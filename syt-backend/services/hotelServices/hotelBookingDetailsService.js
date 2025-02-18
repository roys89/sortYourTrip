// services/hotelServices/hotelBookingDetailsService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelBookingDetailsService {
  static async getBookingDetails(params) {
    try {
      const {
        bookingCode,
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
        `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/bookings/${bookingCode}`,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName: city,
        date,
        apiType: 'hotel_booking_details',
        requestData: {
          bookingCode
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
        apiType: 'hotel_booking_details_error',
        requestData: {
          bookingCode: params.bookingCode
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

module.exports = HotelBookingDetailsService;