//services/flightServices/flightCreateItineraryService.js

const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightCreateItineraryService {
  static async createItinerary(params) {
    try {
      const {
        traceId,
        resultIndex,
        inquiryToken,
        cityName,
        date,
        token
      } = params;

      const requestBody = {
        items: [{
          type: "FLIGHT",
          resultIndex
        }],
        traceId
      };

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'source': 'website',
          'authorization-type': 'external-service'
        }
      };

      const response = await axios.post(
        'https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/itinerary',
        requestBody,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName,
        date,
        apiType: 'flight_create_itinerary',
        requestData: {
          ...requestBody
        },
        responseData: response.data
      };

      apiLogger.logApiData(logData);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.cityName,
        date: params.date,
        apiType: 'flight_create_itinerary_error',
        requestData: {
          traceId: params.traceId,
          resultIndex: params.resultIndex
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      apiLogger.logApiData(errorLogData);

      return {
        success: false,
        error: error.message,
        details: error.response?.data?.details || {}  // This contains the error object with errorCode: 50
      };
    }
  }
}

module.exports = FlightCreateItineraryService;