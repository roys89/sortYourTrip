const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class TransferGetQuoteService {
    static async getTransferQuotes(params) {
      try {
        // Destructure and validate input parameters
        const {
          origin,
          destination,
          pickupDate,
          returnDate,
          inquiryToken // Ensure inquiryToken is destructured
        } = params;
  
        // Prepare the request body
        const requestBody = {
          destination: {
            display_address: destination.display_address,
            lat: destination.latitude?.toString() || destination.lat,
            long: destination.longitude?.toString() || destination.long
          },
          origin: {
            type: "location",
            display_address: origin.display_address,
            lat: origin.latitude?.toString() || origin.lat,
            long: origin.longitude?.toString() || origin.long
          },
          journey_type: "oneway",
          pickupDate: this.formatDate(pickupDate),
          returnDate: this.formatDate(returnDate || this.getNextDay(pickupDate))
        };
  
        // Prepare axios request configuration
        const config = {
          method: "post",
          url: "https://api.leamigo.com/agent/booking/get-quotes",
          headers: {
            accept: "application/json",
            "X-API-KEY": process.env.LEAMIGO_API_KEY,
            "Content-Type": "application/json"
          },
          data: requestBody
        };

        // Make the API call
        const response = await axios(config);
  
        // Log the API data
        const logData = {
          inquiryToken: inquiryToken || "unknown", // Ensure inquiryToken is logged safely
          cityName: `${origin.city} to ${destination.city
          }`,
          date: pickupDate,
          apiType: "transfer_quote",
          requestData: requestBody,
          responseData: response.data
        };
  
        // console.log("Logging data to apiLogger (success):", logData); // Log the data
        const logResult = apiLogger.logApiData(logData);
  
        // Return the response with additional logging information
        return {
          success: true,
          quotes: response.data,
        };
      } catch (error) {
        // Log any errors
        console.error("Error in transfer quote service:", error);
  
        // Attempt to log error details
        const errorLogData = {
          inquiryToken: params.inquiryToken || "unknown", // Safely access inquiryToken
          cityName: `${params.origin.display_address || params.origin.city} to ${
            params.destination.display_address || params.destination.city
          }`,
          date: params.pickupDate,
          apiType: "transfer_quote_error",
          requestData: params,
          responseData: error.response?.data || error.message
        };
  
        console.log("Logging data to apiLogger (error):", errorLogData); // Log the data
        const errorLogResult = apiLogger.logApiData(errorLogData);
  
        // Return structured error response
        return {
          success: false,
          type: "error",
          message: "Unable to fetch transfer quotes",
          error: {
            message: error.message,
            details: error.response?.data,
            logDetails: errorLogResult
          }
        };
      }
    }
  
    static formatDate(date) {
      const formattedDate = new Date(date);
      return formattedDate.toISOString().replace('Z', '').replace('T', ' ');
    }
  
    static getNextDay(date) {
      const nextDay = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000);
      return nextDay.toISOString().replace('Z', '').replace('T', ' ');
    }
  }
  
  module.exports = TransferGetQuoteService;
  