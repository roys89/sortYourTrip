const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class TransferBookingService {
  static async validateBookingData(bookingData) {
    const { transformedTransfer } = bookingData;
    const bookingItem = transformedTransfer.bookingArray[0];

    // Minimal validation checks
    const requiredFields = [
      { path: 'bookingArray.booking_date', type: 'string' },
      { path: 'bookingArray.guest_details.first_name', type: 'string' },
      { path: 'bookingArray.guest_details.last_name', type: 'string' },
      { path: 'bookingArray.quotation_id', type: 'string' }
    ];

    for (const field of requiredFields) {
      const value = field.path.split('.').reduce((obj, key) => 
        obj && obj[key] !== undefined ? obj[key] : undefined, 
        { transformedTransfer, bookingArray: bookingItem }
      );

      if (!value || (typeof value === 'string' && value.trim() === '')) {
        throw new Error(`Missing or invalid field: ${field.path}`);
      }
    }

    return true;
  }

  static async bookTransfer(params) {
    try {
      const {
        transformedTransfer,
        inquiryToken,
        cityName,
        date
      } = params;

      // Use the first booking array item
      const bookingArrayItem = transformedTransfer.bookingArray[0];

      // Prepare booking payload
      const bookingPayload = {
        booking_date: bookingArrayItem.booking_date,
        booking_time: bookingArrayItem.booking_time || '00:00',
        return_date: bookingArrayItem.return_date,
        return_time: bookingArrayItem.return_time || '00:00',
        guest_details: bookingArrayItem.guest_details,
        quotation_id: String(bookingArrayItem.quotation_id),
        quotation_child_id: String(bookingArrayItem.quotation_child_id),
        comments: bookingArrayItem.comments || '', // Convert null to empty string
        total_passenger: bookingArrayItem.total_passenger,
        flight_number: bookingArrayItem.flight_number || '' // Convert null to empty string
      };

      // External API configuration
      const config = {
        method: 'post',
        url: 'https://api.leamigo.com/agent/booking/create-booking',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.LEAMIGO_API_KEY
        }
      };

      // Make external API call
      const response = await axios.post(
        config.url, 
        bookingPayload, 
        { headers: config.headers }
      );

      // Log success case
      const logData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName: cityName || 'unknown',
        date: date,
        apiType: 'transfer_booking',
        requestData: {
          ...bookingPayload,
          headers: { 'X-API-KEY': '[REDACTED]' }
        },
        responseData: response.data,
        transferId: transformedTransfer.transferId
      };

      apiLogger.logApiData(logData);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      // Log error case with consistent structure
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.cityName || 'unknown',
        date: params.date,
        apiType: 'transfer_booking_error',
        requestData: {
          ...params,
          headers: { 'X-API-KEY': '[REDACTED]' }
        },
        responseData: error.response?.data || error.message
      };

      apiLogger.logApiData(errorLogData);

      return {
        success: false,
        type: 'error',
        message: 'Unable to book transfer',
        error: {
          message: error.message,
          details: error.response?.data
        }
      };
    }
  }
}

module.exports = TransferBookingService;