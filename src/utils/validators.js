const sanitizeFilename = require('sanitize-filename');
const path = require('path');

/**
 * Validate and sanitize input parameters
 */
function validateAndSanitizeInputs({ docs, title, subtitle, author, date, download }) {
  // Validate docs parameter
  if (!docs || typeof docs !== 'string' || docs.trim() === '') {
    return {
      valid: false,
      error: 'Missing or invalid "docs" parameter. Expected comma-separated list of markdown files.'
    };
  }

  // Split and sanitize file names
  const docList = docs.split(',').map(doc => doc.trim()).filter(doc => doc.length > 0);

  if (docList.length === 0) {
    return {
      valid: false,
      error: 'No valid document files provided'
    };
  }

  // Sanitize each filename and validate
  const sanitizedDocs = [];
  for (const doc of docList) {
    // Remove any path traversal attempts
    const basename = path.basename(doc);
    const sanitized = sanitizeFilename(basename);

    // Ensure it's a markdown file
    if (!sanitized.endsWith('.md')) {
      return {
        valid: false,
        error: `Invalid file type: ${basename}. Only .md files are allowed.`
      };
    }

    // Check for suspicious patterns
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      return {
        valid: false,
        error: `Invalid filename: ${basename}. Path traversal not allowed.`
      };
    }

    sanitizedDocs.push(sanitized);
  }

  // Validate download parameter
  if (download && !['inline', 'attachment'].includes(download)) {
    return {
      valid: false,
      error: 'Invalid "download" parameter. Must be "inline" or "attachment".'
    };
  }

  // Sanitize metadata
  const sanitizedMetadata = {
    title: sanitizeString(title, 'Document'),
    subtitle: sanitizeString(subtitle, ''),
    author: sanitizeString(author, ''),
    date: sanitizeString(date, new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
  };

  return {
    valid: true,
    sanitizedDocs,
    sanitizedMetadata
  };
}

/**
 * Sanitize a string by removing dangerous characters
 */
function sanitizeString(str, defaultValue = '') {
  if (!str || typeof str !== 'string') {
    return defaultValue;
  }

  // Remove potentially dangerous characters
  // Allow letters, numbers, spaces, basic punctuation
  const sanitized = str
    .replace(/[<>'"&]/g, '') // Remove HTML/XML special chars
    .replace(/[\r\n\t]/g, ' ') // Replace newlines/tabs with spaces
    .trim()
    .substring(0, 200); // Limit length

  return sanitized || defaultValue;
}

module.exports = {
  validateAndSanitizeInputs,
  sanitizeString
};
