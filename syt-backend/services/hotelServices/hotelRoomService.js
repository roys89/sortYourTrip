const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelRoomService {
  static async allocateRooms(itineraryCode, bookingData, authToken) {
    const url = `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/${itineraryCode}/rooms-allocations`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Take first item if it's an array
    const requestBody = Array.isArray(bookingData) ? bookingData[0] : bookingData;
    
    try {
      const response = await axios.post(
        url,
        requestBody,  // Send single object, not array
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'source': 'website',
            'authorization-type': 'external-service'
          }
        }
      );

      apiLogger.logApiData({
        date: currentDate,
        apiType: 'hotel_room_allocation',
        inquiryToken: itineraryCode,
        requestData: {
          url,
          data: requestBody,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'source': 'website',
            'authorization-type': 'external-service'
          }
        },
        responseData: response.data,
      });

      return response.data;

    } catch (error) {
      apiLogger.logApiData({
        date: currentDate,
        apiType: 'hotel_room_allocation',
        inquiryToken: itineraryCode,
        requestData: {
          url,
          data: requestBody,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'source': 'website',
            'authorization-type': 'external-service'
          }
        },
        responseData: {
          error: error.response?.data || {},
          message: error.message,
          status: error.response?.status
        }
      });

      throw error;
    }
  }
}

module.exports = HotelRoomService;