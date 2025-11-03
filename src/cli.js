#!/usr/bin/env node

/**
 * CLI tool for generating PDFs locally without running the server
 * Usage: npm run pdf:demo
 * Or: node src/cli.js --docs=01-intro.md,02-guide.md --title="My Document"
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pdfService = require('./services/pdfService');
const logger = require('./utils/logger');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    docs: '01-intro.md,02-guide.md',
    title: 'DocCraft Demo',
    subtitle: 'Generated from CLI',
    author: 'Andrew',
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };

  args.forEach(arg => {
    const match = arg.match(/--(\w+)=(.+)/);
    if (match) {
      const [, key, value] = match;
      params[key] = value;
    }
  });

  return params;
}

// Main CLI function
async function main() {
  console.log('📄 DocCraft PDF - CLI Demo\n');
  
  const params = parseArgs();
  const requestId = `cli_${Date.now()}`;

  logger.info(`[${requestId}] Starting CLI PDF generation`);
  logger.info(`[${requestId}] Parameters:`, params);

  try {
    // Check Pandoc availability
    if (!pdfService.checkPandocAvailability()) {
      logger.error('❌ Pandoc is not installed or not available in PATH');
      logger.error('Please install Pandoc: https://pandoc.org/installing.html');
      process.exit(1);
    }

    logger.info('✅ Pandoc is available');

    // Parse docs
    const docs = params.docs.split(',').map(d => d.trim());

    // Validate files exist
    const DOCS_DIR = path.resolve(process.env.DOCS_DIR || './docs');
    const missingFiles = [];
    
    for (const doc of docs) {
      const filePath = path.join(DOCS_DIR, doc);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(doc);
      }
    }

    if (missingFiles.length > 0) {
      logger.error(`❌ Missing files in ${DOCS_DIR}:`);
      missingFiles.forEach(file => logger.error(`   - ${file}`));
      process.exit(1);
    }

    logger.info(`✅ All ${docs.length} input files found`);

    // Generate PDF
    const metadata = {
      title: params.title,
      subtitle: params.subtitle,
      author: params.author,
      date: params.date
    };

    logger.info('🔄 Generating PDF...');

    const result = await pdfService.generatePDF({
      docs,
      metadata,
      requestId
    });

    const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './pdf');
    const outputPath = path.join(OUTPUT_DIR, result.filename);

    logger.info(`\n✅ PDF generated successfully!`);
    logger.info(`📁 Output: ${outputPath}`);
    logger.info(`📊 Size: ${(result.size / 1024).toFixed(2)} KB`);
    logger.info(`💾 Cached: ${result.cached ? 'Yes' : 'No'}`);

  } catch (error) {
    logger.error(`\n❌ Error generating PDF:`, error.message);
    if (process.env.NODE_ENV === 'development') {
      logger.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = { main, parseArgs };
