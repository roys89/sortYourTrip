// services/activityServices/activityBookingDetailsService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class ActivityBookingDetailsService {
  static async getBookingDetails(params) {
    try {
      const {
        bookingReference,
        inquiryToken,
        date,
        city
      } = params;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.GRNC_API_KEY || 'hhVblqFbLN8ojaRs'
        }
      };

      const response = await axios.get(
        `https://api-act.grnconnect.com/api/v3/activity/Bookingdetails?voucherKey=${bookingReference}`,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName: city,
        date,
        apiType: 'activity_booking_details',
        requestData: {
          bookingReference,
          headers: {
            'api-key': '[REDACTED]'
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
        apiType: 'activity_booking_details_error',
        requestData: {
          bookingReference: params.bookingReference
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

module.exports = ActivityBookingDetailsService;