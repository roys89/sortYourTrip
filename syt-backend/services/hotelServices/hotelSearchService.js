const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelSearchService {
  static async searchHotels(searchParams, accessToken, inquiryToken) {
    try {
      // Format request body according to API requirements
      const requestBody = {
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        filterBy: {
          freeBreakfast: false,
          isRefundable: false,
          subLocationIds: null,
          ratings: searchParams.ratings,  // Use ratings based on budget preference
          facilities: null,
          type: "hotel",
          tags: null,
          reviewRatings: [4,5]
        },
        nationality: "IN",
        occupancies: searchParams.occupancies, // Use occupancies directly
        hotelId: null,
        locationId: searchParams.locationId,
        traceId: null
      };

      const response = await axios.post(
        'https://hotel-api-sandbox.travclan.com/api/v2/hotels/search',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Authorization-Type': 'external-service',
            'source': 'website',
            'Content-Type': 'application/json'
          }
        }
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName: searchParams.cityName,
        date: searchParams.checkIn,
        apiType: 'hotel_search',
        requestData: {
          ...requestBody,
          headers: {
            'Authorization': 'Bearer [REDACTED]',
            'Authorization-Type': 'external-service',
            'source': 'website'
          }
        },
        responseData: response.data
      };

      await apiLogger.logApiData(logData);

      return response.data;

    } catch (error) {
      // Log error
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName: searchParams.cityName,
        date: searchParams.checkIn,
        apiType: 'hotel_search_error',
        requestData: searchParams,
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      await apiLogger.logApiData(errorLogData);
      throw error;
    }
  }
}

module.exports = HotelSearchService;