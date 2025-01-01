const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelRoomRatesService {
  static async selectRoomRates(requestBody, accessToken) {
    try {
      // Extract necessary details from request body
      const {
        itineraryCode, 
        cityName, 
        inquiryToken,
        traceId,
        recommendationId,
        items,
        roomsAndRateAllocations,
        date
      } = requestBody;

      // Prepare request payload
      const requestPayload = {
        roomsAndRateAllocations,
        traceId,
        recommendationId,
        items
      };

      const config = {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Authorization-Type': 'external-service',
          'source': 'website',
          'Content-Type': 'application/json'
        }
      };

      // Make API request
      const response = await axios.post(
        `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/${itineraryCode}/select-roomrates`,
        requestPayload,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName,
        date,
        apiType: 'hotel_room_rates',
        itineraryCode,
        requestData: {
          ...requestPayload,
          headers: {
            'Authorization': 'Bearer [REDACTED]',
            'Authorization-Type': 'external-service',
            'source': 'website'
          }
        },
        responseData: response.data
      };

      await apiLogger.logApiData(logData);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      // Log error
      const errorLogData = {
        inquiryToken: requestBody.inquiryToken || 'unknown',
        cityName: requestBody.cityName || 'unknown', 
        date: requestBody.date || 'unknown',
        apiType: 'hotel_room_rates_error',
        itineraryCode: requestBody.itineraryCode,
        requestData: {
          // Match success case by including all request data
          ...requestPayload,
          headers: {
            'Authorization': 'Bearer [REDACTED]',
            'Authorization-Type': 'external-service', 
            'source': 'website'
          },
          url: `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/${requestBody.itineraryCode}/select-roomrates`
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      await apiLogger.logApiData(errorLogData);

      throw {
        message: 'Failed to select room rates',
        originalError: error.message,
        details: error.response?.data,
        status: error.response?.status
      };
    }
  }
}

module.exports = HotelRoomRatesService;