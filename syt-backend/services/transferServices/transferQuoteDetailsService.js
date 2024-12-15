// services/transferServices/transferQuoteDetailsService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class TransferQuoteDetailsService {
  static async getQuoteDetails(quotationId, quoteId, inquiryToken, cityName, startDate) {  // Add these parameters
    try {
      const config = {
        method: "get",
        url: `https://api.leamigo.com/agent/booking/get-quote/${quotationId}/${quoteId}`,
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': process.env.LEAMIGO_API_KEY
        }
      };

      const response = await axios(config);

      // Match the log structure with transferGetQuotesService.js
      const logData = {
        inquiryToken: inquiryToken || "unknown",
        cityName: cityName || "unknown",
        date: startDate,  
        apiType: "transfer_quote_details",
        requestData: {
          quotationId,
          quoteId,
          requestUrl: config.url
        },
        responseData: response.data,
        quotationId  // Keep this for filename generation
      };

      const logResult = apiLogger.logApiData(logData);

      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
          logDetails: logResult
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch quote details');
      }
    } catch (error) {
      const errorLogData = {
        inquiryToken: inquiryToken || "unknown",
        cityName: cityName || "unknown",
        date: startDate,
        apiType: "transfer_quote_details_error",
        requestData: {
          quotationId,
          quoteId,
          error: error.message
        },
        responseData: error.response?.data,
        quotationId
      };

      console.error("Error in transfer quote details service:", error);
      
      const errorLogResult = apiLogger.logApiData(errorLogData);

      return {
        success: false,
        type: "error",
        message: "Unable to fetch transfer quote details",
        error: {
          message: error.message,
          details: error.response?.data,
          logDetails: errorLogResult
        }
      };
    }
  }
}

module.exports = TransferQuoteDetailsService;