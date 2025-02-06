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

      const bookingArrayItem = transformedTransfer.bookingArray[0];

      const bookingPayload = {
        booking_date: bookingArrayItem.booking_date,
        booking_time: bookingArrayItem.booking_time || '00:00',
        return_date: bookingArrayItem.return_date,
        return_time: bookingArrayItem.return_time || '00:00',
        guest_details: bookingArrayItem.guest_details,
        quotation_id: String(bookingArrayItem.quotation_id),
        quotation_child_id: String(bookingArrayItem.quotation_child_id),
        comments: bookingArrayItem.comments || '',
        total_passenger: bookingArrayItem.total_passenger,
        flight_number: bookingArrayItem.flight_number || null
      };

      const config = {
        method: 'post',
        url: 'https://api.leamigo.com/agent/booking/create-booking',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.LEAMIGO_API_KEY
        }
      };

      const response = await axios.post(
        config.url, 
        bookingPayload, 
        { headers: config.headers }
      );

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
        data: response.data // Return complete response data
      };

    } catch (error) {
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.cityName || 'unknown',
        date: params.date,
        apiType: 'transfer_booking_error',
        requestData: {
          ...params,
          headers: { 'X-API-KEY': '[REDACTED]' }
        },
        responseData: error.response?.data || error
      };

      apiLogger.logApiData(errorLogData);

      return {
        success: false,
        error: error.message,
        data: error.response?.data || error // Return complete error response
      };
    }
  }
}

module.exports = TransferBookingService;