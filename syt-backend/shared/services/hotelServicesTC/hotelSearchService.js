const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelSearchService {
  static async searchHotels(searchParams, accessToken, inquiryToken) {
    try {
      // Set default values only for null fields
      const requestBody = {
        ...searchParams,
        filterBy: {
          ...searchParams.filterBy,
          freeBreakfast: searchParams.filterBy?.freeBreakfast ?? false,
          isRefundable: searchParams.filterBy?.isRefundable ?? false,
          ratings: searchParams.filterBy?.ratings ?? [4, 5],
          reviewRatings: searchParams.filterBy?.reviewRatings ?? [4, 5]
        }
      };

      // Validate required fields
      if (!requestBody.locationId) {
        throw new Error('Location ID is required for hotel search');
      }

      // Format dates if provided
      if (requestBody.checkIn) {
        requestBody.checkIn = new Date(requestBody.checkIn).toISOString().split('T')[0];
      }
      if (requestBody.checkOut) {
        requestBody.checkOut = new Date(requestBody.checkOut).toISOString().split('T')[0];
      }

      // Validate dates
      const checkInDate = new Date(requestBody.checkIn);
      const checkOutDate = new Date(requestBody.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        throw new Error('Check-in date cannot be in the past');
      }

      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }

      // Format occupancies
      if (requestBody.occupancies) {
        requestBody.occupancies = requestBody.occupancies.map(occupancy => ({
          numOfAdults: parseInt(occupancy.numOfAdults) || 1,
          childAges: Array.isArray(occupancy.childAges) ? occupancy.childAges : []
        }));
      }

      // Format filterBy arrays
      if (requestBody.filterBy) {
        if (requestBody.filterBy.ratings) {
          requestBody.filterBy.ratings = Array.isArray(requestBody.filterBy.ratings) 
            ? requestBody.filterBy.ratings.map(r => parseInt(r))
            : [4, 5];
        }
        if (requestBody.filterBy.reviewRatings) {
          requestBody.filterBy.reviewRatings = Array.isArray(requestBody.filterBy.reviewRatings)
            ? requestBody.filterBy.reviewRatings.map(r => parseInt(r))
            : [4, 5];
        }
        if (requestBody.filterBy.facilities) {
          requestBody.filterBy.facilities = Array.isArray(requestBody.filterBy.facilities)
            ? requestBody.filterBy.facilities
            : null;
        }
        if (requestBody.filterBy.tags) {
          requestBody.filterBy.tags = Array.isArray(requestBody.filterBy.tags)
            ? requestBody.filterBy.tags
            : null;
        }
      }

      // Add traceId if provided for pagination
      if (requestBody.traceId) {
        requestBody.traceId = requestBody.traceId;
      }

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
        date: requestBody.checkIn,
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