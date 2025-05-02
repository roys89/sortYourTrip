// shared/services/hotelServicesTC/hotelCancelService.js
const axios = require('axios');
const logger = require('../../utils/logger');
const { handleAxiosError } = require('../../helpers/errorHandler');
const apiLogger = require('../../helpers/apiLogger'); // Import apiLogger

const hotelCancelService = {
  /**
   * Sends a cancellation request for a hotel booking.
   * @param {string} bookingCode - The booking code (itinerary code) to cancel.
   * @param {string} traceId - The trace ID associated with the booking/search.
   * @param {string} authToken - The authentication token.
   * @param {string} inquiryToken - Optional inquiry token for logging/tracking.
   * @returns {Promise<object>} - The response data from the API.
   * @throws {Error} - Throws an error if the API call fails.
   */
  cancelBooking: async (bookingCode, traceId, authToken, inquiryToken = 'unknown') => {
    const url = `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/bookings/${bookingCode}/cancel`; // Use direct URL
    const headers = {
      accept: 'application/json',
      'Authorization-Type': 'external-service',
      source: 'website',
      'content-type': 'application/json',
      Authorization: authToken // Use Authorization header
    };
    const body = { traceId }; // Include traceId in the body

    // Define requestDataForLogging here for access in catch block
    const requestDataForLogging = { 
      url, 
      body, 
      headers: { ...headers, Authorization: '[REDACTED]' } // Redact sensitive info
    };

    logger.info(`[HotelCancelService] Attempting cancellation for bookingCode: ${bookingCode}`, { url, body, inquiryToken });

    try {
      const response = await axios.post(url, body, { headers }); // Send body

      logger.info(`[HotelCancelService] Cancellation API response for ${bookingCode}: ${response.status}`, { status: response.status, data: response.data, inquiryToken });
      
      // Log success using apiLogger (optional, but consistent)
      // Consider adding if detailed success logging is needed
      // await apiLogger.logApiData({
      //   inquiryToken,
      //   apiType: 'hotel_cancel_success',
      //   requestData: requestDataForLogging,
      //   responseData: response.data,
      // });

      if (response.data && (response.data.success === true || response.status === 200 || response.status === 201)) { // Check for success indicators
        return { 
            success: true, 
            message: response.data.message || 'Cancellation request processed successfully.', 
            data: response.data // Return the full response data
        };
      } else {
        // Handle cases where API returns 2xx but indicates failure in the body
        throw new Error(response.data.message || `Cancellation API returned status ${response.status} but indicated failure.`);
      }

    } catch (error) {
      // Log error using apiLogger
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        apiType: 'hotel_cancel_error',
        requestData: requestDataForLogging, // Use the data defined above
        responseData: { 
          error: error.message,
          details: error.response?.data || {},
          status: error.response?.status,
          config: { // Include request config details
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers ? { ...error.config.headers, Authorization: '[REDACTED]' } : {} 
          }
        }
      };
      await apiLogger.logApiData(errorLogData);

      // Log basic error message (optional, could be removed if apiLogger is sufficient)
      logger.error(`[HotelCancelService] Error cancelling hotel booking ${bookingCode}:`, { 
          message: error.message, 
          url, 
          inquiryToken, 
          status: error.response?.status,
          //responseData: error.response?.data // Already logged by apiLogger
      });
      
      // Use shared error handler to format and re-throw
      handleAxiosError(error, `Hotel Cancellation (Booking Code: ${bookingCode})`); 
      // handleAxiosError will throw a formatted error, so no need to throw again here.
    }
  },
};

module.exports = hotelCancelService; 