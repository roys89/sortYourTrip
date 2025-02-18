// services/transferServices/transferBookingDetailsService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class TransferBookingDetailsService {
  static async getBookingDetails(params) {
    try {
      const {
        booking_id,
        inquiryToken,
        date,
        city
      } = params;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.LEAMIGO_API_KEY
        }
      };

      const payload = {
        booking_id
      };

      const response = await axios.post(
        'https://api.leamigo.com/agent/booking/get-booking',
        payload,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName: city,
        date,
        apiType: 'transfer_booking_details',
        requestData: {
          booking_id,
          headers: {
            'X-API-KEY': '[REDACTED]'
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
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.city || 'unknown',
        date: params.date,
        apiType: 'transfer_booking_details_error',
        requestData: {
          booking_id: params.booking_id
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

module.exports = TransferBookingDetailsService;