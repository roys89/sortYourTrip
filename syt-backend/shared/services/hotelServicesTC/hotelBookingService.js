const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelBookingService {
  static async bookHotel(params) {
    try {
      const {
        traceId,
        code, // Changed from itineraryCode
        token,
        inquiryToken,
        date,
        city
      } = params;

      // Use code as itineraryCode
      const itineraryCode = code;

      const requestBody = {
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
        `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/${itineraryCode}/book`,
        requestBody,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName: city,
        date,
        apiType: 'hotel_booking',
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
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.city || 'unknown',
        date: params.date,
        apiType: 'hotel_booking_error',
        requestData: {
          traceId: params.traceId,
          itineraryCode: params.code // Changed to code
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
    // Updated required fields to include code instead of itineraryCode
    const requiredFields = ['traceId', 'code', 'inquiryToken', 'date', 'city'];
    const missingFields = requiredFields.filter(field => !bookingData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = HotelBookingService;