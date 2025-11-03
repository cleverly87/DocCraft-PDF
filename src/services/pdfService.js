const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const logger = require('../utils/logger');

const DOCS_DIR = path.resolve(process.env.DOCS_DIR || './docs');
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './pdf');
const PANDOC_DEFAULTS = path.resolve(process.env.PANDOC_DEFAULTS || './pandoc.defaults.yml');
const ENABLE_CACHE = process.env.ENABLE_CACHE === 'true';

class PDFService {
  constructor() {
    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      logger.info(`Created output directory: ${OUTPUT_DIR}`);
    }
  }

  /**
   * Check if Pandoc is available on the system
   */
  checkPandocAvailability() {
    try {
      execFileSync('pandoc', ['--version'], { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a cache key based on input files and metadata
   */
  generateCacheKey(docs, metadata) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({ docs, metadata }));
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Create a temporary metadata YAML file
   */
  createMetadataFile(metadata, requestId) {
    const metadataContent = yaml.dump({
      title: metadata.title,
      subtitle: metadata.subtitle || undefined,
      author: metadata.author || undefined,
      date: metadata.date
    });

    const tempFile = path.join(OUTPUT_DIR, `metadata_${requestId}.yml`);
    fs.writeFileSync(tempFile, `---\n${metadataContent}---\n\n`);
    return tempFile;
  }

  /**
   * Validate that all requested markdown files exist
   */
  validateFiles(docs) {
    const missingFiles = [];
    const existingFiles = [];

    for (const doc of docs) {
      const filePath = path.join(DOCS_DIR, doc);
      
      if (!fs.existsSync(filePath)) {
        missingFiles.push(doc);
      } else {
        existingFiles.push(filePath);
      }
    }

    if (missingFiles.length > 0) {
      const error = new Error(`Missing files: ${missingFiles.join(', ')}`);
      error.statusCode = 404;
      throw error;
    }

    return existingFiles;
  }

  /**
   * Generate PDF using Pandoc
   */
  async generatePDF({ docs, metadata, requestId }) {
    logger.info(`[${requestId}] Starting PDF generation`);

    // Check if Pandoc is available
    if (!this.checkPandocAvailability()) {
      const error = new Error('Pandoc is not installed or not available in PATH');
      error.statusCode = 500;
      throw error;
    }

    // Validate files exist
    const inputFiles = this.validateFiles(docs);
    logger.info(`[${requestId}] All input files validated`);

    // Generate cache key
    const cacheKey = this.generateCacheKey(docs, metadata);
    const outputFilename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${cacheKey}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Check cache
    if (ENABLE_CACHE && fs.existsSync(outputPath)) {
      logger.info(`[${requestId}] Using cached PDF: ${outputFilename}`);
      const stats = fs.statSync(outputPath);
      return {
        filename: outputFilename,
        stream: fs.createReadStream(outputPath),
        size: stats.size,
        cached: true
      };
    }

    // Create temporary metadata file
    const metadataFile = this.createMetadataFile(metadata, requestId);
    logger.info(`[${requestId}] Created metadata file`);

    try {
      // Prepare Pandoc arguments
      const pandocArgs = [
        '--defaults', PANDOC_DEFAULTS,
        '-o', outputPath,
        metadataFile,
        ...inputFiles
      ];

      logger.info(`[${requestId}] Executing Pandoc: pandoc ${pandocArgs.join(' ')}`);

      // Execute Pandoc
      await this.executePandoc(pandocArgs, requestId);

      // Clean up metadata file
      fs.unlinkSync(metadataFile);
      logger.info(`[${requestId}] Cleaned up temporary files`);

      // Verify output file was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('PDF generation completed but output file not found');
      }

      const stats = fs.statSync(outputPath);
      logger.info(`[${requestId}] PDF generated successfully: ${outputFilename} (${stats.size} bytes)`);

      return {
        filename: outputFilename,
        stream: fs.createReadStream(outputPath),
        size: stats.size,
        cached: false
      };

    } catch (error) {
      // Clean up on error
      if (fs.existsSync(metadataFile)) {
        fs.unlinkSync(metadataFile);
      }
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      throw error;
    }
  }

  /**
   * Execute Pandoc command as a Promise
   */
  executePandoc(args, requestId) {
    return new Promise((resolve, reject) => {
      const pandoc = spawn('pandoc', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pandoc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pandoc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pandoc.on('close', (code) => {
        if (code === 0) {
          logger.info(`[${requestId}] Pandoc completed successfully`);
          resolve();
        } else {
          logger.error(`[${requestId}] Pandoc failed with code ${code}`);
          logger.error(`[${requestId}] Pandoc stderr:`, stderr);
          const error = new Error(`Pandoc execution failed: ${stderr || 'Unknown error'}`);
          error.statusCode = 500;
          reject(error);
        }
      });

      pandoc.on('error', (err) => {
        logger.error(`[${requestId}] Pandoc spawn error:`, err);
        const error = new Error(`Failed to spawn Pandoc: ${err.message}`);
        error.statusCode = 500;
        reject(error);
      });
    });
  }

  /**
   * Clean old cached PDFs (optional maintenance function)
   */
  cleanOldCache(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const files = fs.readdirSync(OUTPUT_DIR);
    let cleaned = 0;

    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(OUTPUT_DIR, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          fs.unlinkSync(filePath);
          cleaned++;
          logger.info(`Cleaned old cache file: ${file}`);
        }
      }
    }

    if (cleaned > 0) {
      logger.info(`Cache cleanup complete: ${cleaned} files removed`);
    }
  }
}

module.exports = new PDFService();
