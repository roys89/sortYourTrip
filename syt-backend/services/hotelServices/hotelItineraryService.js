// services/hotelServices/hotelItineraryService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelItineraryService {
  static async createItinerarySequential(params, accessToken, inquiryToken) {
    try {
      const requestBody = {
        traceId: params.traceId,
        hotelId: params.hotelId
      };

      const response = await axios.post(
        'https://hotel-api-sandbox.travclan.com/api/v2/hotels/itineraries',
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
        cityName: params.cityName,
        date: params.startDate,
        apiType: 'hotel_itinerary_v2',
        hotelCode: params.hotelId,
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
        cityName: params.cityName,
        date: params.startDate,
        apiType: 'hotel_itinerary_v2_error',
        hotelCode: params.hotelId,
        requestData: {
          traceId: params.traceId,
          hotelId: params.hotelId
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      await apiLogger.logApiData(errorLogData);

      throw {
        message: 'Failed to create hotel itinerary (sequential)',
        originalError: error.message,
        details: error.response?.data,
        status: error.response?.status
      };
    }
  }


  static async createItineraryAdHoc(params, accessToken, inquiryToken) {
    try {
      // Format the request body according to API requirements
      const requestBody = {
        hotelId: params.hotelId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        occupancies: params.guests.map(room => ({
          numOfAdults: room.numberOfAdults,
          ...(room.childAges?.length > 0 && { childAges: room.childAges })
        })),
        nationality: "IN" // Default to IN (India) as per API requirement
      };

      const response = await axios.post(
        'https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries',
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
        cityName: params.cityName,
        date: params.checkIn,
        apiType: 'hotel_itinerary',
        hotelCode: params.hotelId,
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

      apiLogger.logApiData(logData);

      return {
        success: true,
        data: response.data,
        itineraryId: response.data?.itineraryId
      };

    } catch (error) {
      // Log error
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName: params.cityName,
        date: params.checkIn,
        apiType: 'hotel_itinerary_error',
        hotelCode: params.hotelId,
        requestData: {
          hotelId: params.hotelId,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          occupancies: params.guests
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      apiLogger.logApiData(errorLogData);

      throw {
        message: 'Failed to create hotel itinerary',
        originalError: error.message,
        details: error.response?.data,
        status: error.response?.status
      };
    }
  }

  static async getItineraryDetails(itineraryCode, traceId, accessToken, inquiryToken, cityName, startDate) {
    try {
      const response = await axios.get(
        `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/${itineraryCode}/?traceId=${traceId}&guestRules=false&searchRequestLog=true&staticContent=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Authorization-Type': 'external-service',
            'source': 'website',
            'Content-Type': 'application/json'
          }
        }
      );
  
      // Log API data with city and date
      const logData = {
        inquiryToken,
        cityName,
        date: startDate,
        apiType: 'hotel_itinerary_details',
        itineraryCode,
        traceId,
        requestData: {
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
      // Log error with city and date
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName,
        date: startDate,
        apiType: 'hotel_itinerary_details_error',
        itineraryCode,
        traceId,
        requestData: {
          url: `itineraries/${itineraryCode}`,
          traceId
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };
  
      apiLogger.logApiData(errorLogData);
  
      throw {
        message: 'Failed to get hotel itinerary details',
        originalError: error.message,
        details: error.response?.data,
        status: error.response?.status
      };
    }
  }
}

module.exports = HotelItineraryService;