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
      // Special handling for auth logs
      if (apiType === 'flight_auth' || apiType === 'hotel_auth') {
        const authDirPath = path.join(this.basePath, 'auth');
        
        if (!this.ensureDirectoryExists(authDirPath)) {
          throw new Error(`Failed to create auth directory: ${authDirPath}`);
        }
  
        const authFilePath = path.join(authDirPath, `${apiType}.json`);
        
        // Check if file exists and read existing data
        let existingData = {};
        if (fs.existsSync(authFilePath)) {
          try {
            existingData = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
          } catch (err) {
            console.error('Error reading existing auth file:', err);
          }
        }
  
        // Update or add new token data
        existingData[inquiryToken || 'default'] = {
          token: responseData.AccessToken,
          timestamp: new Date().toISOString()
        };
  
        return this.safeWriteFile(authFilePath, existingData);
      }

      // Regular API logging
      const sanitizedInquiryToken = this.sanitizePath(inquiryToken);
      const sanitizedCity = this.sanitizePath(cityName);
      const formattedDate = this.formatDate(date);
      const sanitizedApiType = this.sanitizePath(apiType);

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

      if (!this.ensureDirectoryExists(dirPath)) {
        throw new Error(`Failed to create directory: ${dirPath}`);
      }

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

  // Add method to read auth token
  getAuthToken(inquiryToken) {
    try {
      const authFilePath = path.join(this.basePath, 'auth', 'flight_auth.json');
      
      if (!fs.existsSync(authFilePath)) {
        return null;
      }

      const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
      const tokenData = authData[inquiryToken];

      if (!tokenData) {
        return null;
      }

      // Could add token expiration check here if needed
      return tokenData.token;
    } catch (error) {
      console.error('Error reading auth token:', error);
      return null;
    }
  }
}

// Create singleton instance
const apiLogger = new ApiLogger();

module.exports = apiLogger;