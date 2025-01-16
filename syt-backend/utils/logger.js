// logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), 'logs');
    this.defaultFileName = options.defaultFileName || 'app.log';
    this.maxFileSizeBytes = options.maxFileSizeBytes || 5 * 1024 * 1024; // 5MB default
    this.maxFiles = options.maxFiles || 5;
    
    // Ensure logs directory exists
    this.initializeLogDirectory();
  }

  initializeLogDirectory() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
      throw error;
    }
  }

  rotateLogFile(logFilePath) {
    try {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= this.maxFileSizeBytes) {
        // Rotate existing log files
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldPath = `${logFilePath}.${i}`;
          const newPath = `${logFilePath}.${i + 1}`;
          
          if (fs.existsSync(oldPath)) {
            if (i === this.maxFiles - 1) {
              fs.unlinkSync(oldPath); // Delete the oldest log file
            } else {
              fs.renameSync(oldPath, newPath);
            }
          }
        }
        
        // Rename current log file
        fs.renameSync(logFilePath, `${logFilePath}.1`);
      }
    } catch (error) {
      console.error('Error rotating log files:', error);
    }
  }

  formatMessage(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    let formattedMessage = message;
    
    // Handle objects and arrays
    if (typeof message === 'object') {
      formattedMessage = JSON.stringify(message, null, 2);
    }

    return `[${timestamp}] [${level}] ${formattedMessage}\n`;
  }

  log(message, options = {}) {
    const {
      fileName = this.defaultFileName,
      level = 'INFO'
    } = options;

    try {
      const logFilePath = path.join(this.baseDir, fileName);
      
      // Check if we need to rotate the log file
      if (fs.existsSync(logFilePath)) {
        this.rotateLogFile(logFilePath);
      }

      // Append the log message
      const logMessage = this.formatMessage(message, level);
      fs.appendFileSync(logFilePath, logMessage, 'utf8');

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(logMessage.trim());
      }

      return true;
    } catch (error) {
      console.error('Failed to write to log file:', error);
      return false;
    }
  }

  info(message, fileName) {
    return this.log(message, { fileName, level: 'INFO' });
  }

  error(message, fileName) {
    return this.log(message, { fileName, level: 'ERROR' });
  }

  warn(message, fileName) {
    return this.log(message, { fileName, level: 'WARN' });
  }

  debug(message, fileName) {
    if (process.env.NODE_ENV === 'development') {
      return this.log(message, { fileName, level: 'DEBUG' });
    }
    return true;
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;