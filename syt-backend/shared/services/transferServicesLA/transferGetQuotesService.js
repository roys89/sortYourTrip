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

        console.log('Transfer quotes service input:', { 
          pickupDate, 
          returnDate,
          originCity: origin.city,
          destinationCity: destination.city
        });
  
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

        console.log('Formatted dates for LeAmigo API:', {
          originalPickup: pickupDate,
          formattedPickup: requestBody.pickupDate,
          originalReturn: returnDate,
          formattedReturn: requestBody.returnDate
        });
  
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
  
    static formatDate(dateStr) {
      try {
        // The LeAmigo API expects format: "YYYY-MM-DD HH:MM:SS"
        
        if (!dateStr) return null;
        
        console.log(`Formatting date for LeAmigo API: ${dateStr}`);
        
        // Create a Date object (this will handle various input formats)
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
          console.error(`Invalid date: ${dateStr}`);
          return null;
        }
        
        // Extract and format date parts using standard JavaScript
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Extract time parts
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // Format as YYYY-MM-DD HH:MM:SS
        const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        console.log(`Formatted date result: ${formatted}`);
        return formatted;
      }
      catch (error) {
        console.error('Error in formatDate:', error, { dateStr });
        // Return a sensible default as fallback
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00:00`;
      }
    }
  
    static getNextDay(date) {
      try {
        // Extract date components
        const currentDate = new Date(date);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate() + 1; // Add one day
        
        // Create new date with same time but next day
        const nextDay = new Date(year, month, day, 
                               currentDate.getHours(), 
                               currentDate.getMinutes());
        
        // Format using our fixed formatDate method
        return this.formatDate(nextDay.toISOString());
      }
      catch (error) {
        console.error('Error in getNextDay:', error, { date });
        // Return tomorrow as fallback
        const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
        return tomorrow.toISOString().replace('Z', '').replace('T', ' ');
      }
    }
  }
  
  module.exports = TransferGetQuoteService;
  