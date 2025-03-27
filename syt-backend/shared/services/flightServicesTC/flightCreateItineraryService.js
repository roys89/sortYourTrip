//services/flightServicesTC/flightCreateItineraryService.js

const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightCreateItineraryService {
  static async createItinerary(params) {
    try {
      const {
        traceId,
        items,
        flightType,  // We'll use this for validation only
        inquiryToken,
        cityName,
        date,
        token
      } = params;

      // Validate flight type
      if (!['ONE_WAY', 'DOMESTIC_ROUND_TRIP', 'INTERNATIONAL_ROUND_TRIP'].includes(flightType)) {
        throw new Error('Invalid flight type');
      }

      // Construct request body based on flight type
      let requestBody = {
        traceId,
        items: []
      };

      switch (flightType) {
        case 'DOMESTIC_ROUND_TRIP':
          // For domestic round trips, we need both outbound and inbound flights
          if (!items || items.length !== 2) {
            throw new Error('Domestic round trip requires both outbound and inbound flights');
          }
          requestBody.items = [
            {
              type: "FLIGHT",
              resultIndex: items[0].resultIndex,
            },
            {
              type: "FLIGHT",
              resultIndex: items[1].resultIndex,
            }
          ];
          break;

        case 'INTERNATIONAL_ROUND_TRIP':
          // For international round trips, we just need the selected inbound option's resultIndex
          if (!items || items.length !== 1 || !items[0].resultIndex) {
            throw new Error('International round trip requires the selected inbound option resultIndex');
          }
          requestBody.items = [{
            type: "FLIGHT",
            resultIndex: items[0].resultIndex
          }];
          break;

        case 'ONE_WAY':
        default:
          // For one-way flights
          if (!items || items.length !== 1 || !items[0].resultIndex) {
            throw new Error('One way trip requires one flight resultIndex');
          }
          requestBody.items = [{
            type: "FLIGHT",
            resultIndex: items[0].resultIndex
          }];
          break;
      }

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
          items: params.items
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
        details: error.response?.data || {},
      };
    }
  }

  // In flightCreateItineraryService.js
static async getItineraryDetails(itineraryCode, traceId, token, inquiryToken, cityName, date) {
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'source': 'website',
        'authorization-type': 'external-service'
      }
    };

    const response = await axios.get(
      `https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/itinerary/${itineraryCode}?traceId=${traceId}`,
      config
    );

    // Log API data
    const logData = {
      inquiryToken,
      cityName,
      date,
      apiType: 'flight_itinerary_details',
      itineraryCode,
      traceId,
      requestData: {
        headers: {
          'Authorization': 'Bearer [REDACTED]',
          'source': 'website',
          'authorization-type': 'external-service'
        }
      },
      responseData: response.data
    };

    apiLogger.logApiData(logData);

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    // Log error
    const errorLogData = {
      inquiryToken: inquiryToken || 'unknown',
      cityName,
      date,
      apiType: 'flight_itinerary_details_error',
      itineraryCode,
      traceId,
      requestData: {
        url: `itinerary/${itineraryCode}`,
        traceId
      },
      responseData: {
        error: error.message,
        details: error.response?.data || {}
      }
    };

    apiLogger.logApiData(errorLogData);

    return {
      success: false,
      message: 'Failed to get flight itinerary details',
      originalError: error.message,
      details: error.response?.data,
      status: error.response?.status
    };
  }
}
}

module.exports = FlightCreateItineraryService;