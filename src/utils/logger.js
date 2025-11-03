/**
 * Simple logger utility for structured logging
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (args.length > 0) {
      const details = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ');
      return `${prefix} ${message} ${details}`;
    }
    
    return `${prefix} ${message}`;
  }

  error(message, ...args) {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, ...args));
  }

  warn(message, ...args) {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, ...args));
  }

  info(message, ...args) {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message, ...args));
  }

  debug(message, ...args) {
    if (this.level === 'DEBUG') {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, ...args));
    }
  }
}

module.exports = new Logger();
