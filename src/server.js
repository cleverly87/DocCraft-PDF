const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pdfService = require('./services/pdfService');
const { validateAndSanitizeInputs } = require('./utils/validators');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DocCraft PDF',
    timestamp: new Date().toISOString(),
    pandoc: pdfService.checkPandocAvailability()
  });
});

// Main PDF generation endpoint
// GET /pdf?docs=01-intro.md,02-guide.md&title=DocCraft&subtitle=Branded%20PDF&author=Andrew&download=inline
app.get('/pdf', async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.info(`[${requestId}] New PDF generation request`, req.query);

  try {
    // Extract and validate query parameters
    const {
      docs,
      title = 'Document',
      subtitle = '',
      author = '',
      date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      download = 'inline' // 'inline' or 'attachment'
    } = req.query;

    // Validate inputs
    const validation = validateAndSanitizeInputs({ docs, title, subtitle, author, date, download });
    
    if (!validation.valid) {
      logger.warn(`[${requestId}] Validation failed: ${validation.error}`);
      return res.status(400).json({
        error: 'Invalid input',
        message: validation.error
      });
    }

    const { sanitizedDocs, sanitizedMetadata } = validation;

    logger.info(`[${requestId}] Generating PDF for files: ${sanitizedDocs.join(', ')}`);
    logger.info(`[${requestId}] Metadata: ${JSON.stringify(sanitizedMetadata)}`);

    // Generate PDF
    const pdfResult = await pdfService.generatePDF({
      docs: sanitizedDocs,
      metadata: sanitizedMetadata,
      requestId
    });

    // Set response headers
    const contentDisposition = download === 'attachment' 
      ? `attachment; filename="${pdfResult.filename}"` 
      : `inline; filename="${pdfResult.filename}"`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Length', pdfResult.size);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    logger.info(`[${requestId}] PDF generated successfully (${pdfResult.size} bytes)`);

    // Stream the PDF
    pdfResult.stream.pipe(res);

    pdfResult.stream.on('error', (err) => {
      logger.error(`[${requestId}] Stream error:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming PDF' });
      }
    });

  } catch (error) {
    logger.error(`[${requestId}] Error generating PDF:`, error);

    if (!res.headersSent) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        error: 'PDF generation failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 DocCraft PDF microservice running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📁 Docs directory: ${path.resolve(process.env.DOCS_DIR || './docs')}`);
  logger.info(`🔧 Pandoc available: ${pdfService.checkPandocAvailability() ? 'Yes' : 'No (Warning: PDF generation will fail!)'}`);
});

module.exports = app;
