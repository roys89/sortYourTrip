// helpers/apiLogger.js
const fs = require('fs');
const path = require('path');

class ApiLogger {
  constructor(basePath = 'D:/sortYourTrip/syt-backend/JSON') {
    this.basePath = basePath;
  }
 
  formatDate(date) {
    if (!date) return '';
    
    let dateObj;  
    try {
      dateObj = new Date(date);
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'invalid-date';
    }
  }

  sanitizePath(str) {
    if (!str) return '';
    return str.replace(/[<>:"/\\|?*]+/g, '-');
  }

  ensureDirectoryExists(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        return true;
      }
      fs.mkdirSync(dirPath, { recursive: true });
      return fs.existsSync(dirPath);
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
      return false;
    }
  }

  generateFilename({ type, activityCode, hotelCode, quotationId }) {
    let prefix;
    if (activityCode) {
      prefix = `activity_${activityCode}`;
    } else if (hotelCode) {
      prefix = `hotel_${hotelCode}`;
    } else if (quotationId) {
      prefix = `transfer_${quotationId}`;
    } else {
      prefix = 'default';
    }

    return `${prefix}_${type}.json`;
  }

  safeWriteFile(filePath, data) {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          console.error(`Failed to write file ${filePath} after ${maxRetries} attempts:`, error);
          return false;
        }
        const delay = retries * 100;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
      }
    }
    return false;
  }

  logApiData({
    inquiryToken,
    cityName,
    date,
    apiType,
    requestData,
    responseData,
    searchId,
    activityCode,
    hotelCode,
    quotationId
  }) {
    try {
      // Sanitize all path components
      const sanitizedInquiryToken = this.sanitizePath(inquiryToken);
      const sanitizedCity = this.sanitizePath(cityName);
      const formattedDate = this.formatDate(date);
      const sanitizedApiType = this.sanitizePath(apiType);

      // Create directory path
      const dirComponents = [
        this.basePath,
        sanitizedInquiryToken
      ];

      if (sanitizedCity) {
        dirComponents.push(sanitizedCity);
      }

      if (formattedDate) {
        dirComponents.push(formattedDate);
      }

      if (sanitizedApiType) {
        dirComponents.push(sanitizedApiType);
      }

      const dirPath = path.join(...dirComponents);

      // Ensure directory exists
      if (!this.ensureDirectoryExists(dirPath)) {
        throw new Error(`Failed to create directory: ${dirPath}`);
      }

      // Generate dynamic filenames based on type
      const requestFilename = this.generateFilename({
        type: 'request',
        activityCode,
        hotelCode,
        quotationId
      });

      const responseFilename = this.generateFilename({
        type: 'response',
        activityCode,
        hotelCode,
        quotationId
      });

      const requestFilePath = path.join(dirPath, requestFilename);
      const responseFilePath = path.join(dirPath, responseFilename);

      // Prepare metadata
      const metadata = {
        inquiryToken,
        cityName,
        date: formattedDate,
        apiType,
        searchId,
        activityCode,
        hotelCode,
        quotationId,
        timestamp: new Date().toISOString()
      };

      // Write files
      const requestSuccess = this.safeWriteFile(requestFilePath, {
        metadata,
        data: requestData
      });

      const responseSuccess = this.safeWriteFile(responseFilePath, {
        metadata,
        data: responseData
      });

      return {
        success: requestSuccess && responseSuccess,
        requestPath: requestFilePath,
        responsePath: responseFilePath
      };
    } catch (error) {
      console.error('Error in logApiData:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Optional: Add method to read logged data
  readLoggedData(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      return {
        success: true,
        data: JSON.parse(fileContent)
      };
    } catch (error) {
      console.error(`Error reading logged data: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const apiLogger = new ApiLogger();

module.exports = apiLogger;