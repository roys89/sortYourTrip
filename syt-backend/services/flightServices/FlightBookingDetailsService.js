// services/flightServices/FlightBookingDetailsService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightBookingDetailsService {
  static async getBookingDetails(params) {
    try {
      const {
        bmsBookingCode,
        token,
        inquiryToken,
        date,
        city
      } = params;

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'source': 'website',
          'authorization-type': 'external-service'
        }
      };

      const response = await axios.get(
        `https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/bookings/${bmsBookingCode}`,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName: city,
        date,
        apiType: 'flight_booking_details',
        requestData: {
          bmsBookingCode
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
        cityName: params.city || 'unknown',
        date: params.date,
        apiType: 'flight_booking_details_error',
        requestData: {
          bmsBookingCode: params.bmsBookingCode
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
}

module.exports = FlightBookingDetailsService;