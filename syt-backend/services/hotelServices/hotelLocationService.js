// services/hotelServices/hotelLocationService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelLocationService {
  static async searchLocation(cityName, accessToken, inquiryToken, startDate) {
    try {
      const response = await axios.get(
        `https://hotel-api-sandbox.travclan.com/api/v1/locations/search/?searchString=${encodeURIComponent(cityName)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Authorization-Type': 'external-service',
            'source': 'website'
          }
        }
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName,
        date: startDate,
        apiType: 'hotel_location_search',
        requestData: {
          cityName,
          headers: {
            'Authorization': 'Bearer [REDACTED]',
            'Authorization-Type': 'external-service',
            'source': 'website'
          }
        },
        responseData: response.data
      };

      apiLogger.logApiData(logData);

      return response.data;

    } catch (error) {
      // Log error
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName,
        date: new Date().toISOString(),
        apiType: 'hotel_location_search_error',
        requestData: { cityName },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      apiLogger.logApiData(errorLogData);
      throw error;
    }
  }
}

module.exports = HotelLocationService;