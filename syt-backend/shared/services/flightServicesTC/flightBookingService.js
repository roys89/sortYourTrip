const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightBookingService {
  static async bookFlight(params) {
    try {
      const {
        traceId,
        itineraryCode,
        token
      } = params;

      // Validate required fields
      if (!traceId || !itineraryCode) {
        throw new Error('Missing required fields: traceId and itineraryCode are required');
      }

      const requestBody = {
        traceId,
        isPriceChangeAccepted: false
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
        `https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/itinerary/${itineraryCode}/book`,
        requestBody,
        config
      );

      // Log API data
      const logData = {
        apiType: 'flight_booking',
        requestData: {
          ...requestBody,
          itineraryCode
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
        apiType: 'flight_booking_error',
        requestData: {
          traceId: params.traceId,
          itineraryCode: params.itineraryCode
        },
        responseData: error.response?.data || error
      };

      apiLogger.logApiData(errorLogData);

      return {
        success: false,
        error: error.message,
        data: error.response?.data || error
      };
    }
  }

  static async validateBookingData(bookingData) {
    const requiredFields = ['traceId', 'itineraryCode', 'inquiryToken', 'date', 'city'];
    const missingFields = requiredFields.filter(field => !bookingData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = FlightBookingService;