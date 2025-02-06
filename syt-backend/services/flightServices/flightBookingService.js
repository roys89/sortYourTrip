const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightBookingService {
  static async bookFlight(params) {
    try {
      const {
        traceId,
        itineraryCode,
        token,
        inquiryToken,
        date,
        city
      } = params;

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
        inquiryToken,
        cityName: city,
        date,
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
        data: response.data.response
      };

    } catch (error) {
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.city || 'unknown',
        date: params.date,
        apiType: 'flight_booking_error',
        requestData: {
          traceId: params.traceId,
          itineraryCode: params.itineraryCode
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
        details: error.response?.data
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