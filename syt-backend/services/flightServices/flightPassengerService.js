// flightPassengerService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightPassengerService {
  static async savePassengers(itineraryCode, bookingData, authToken) {
    const url = `https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/itinerary/${itineraryCode}/passenger-collections`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // If bookingData is an array, take the first item
    const requestBody = Array.isArray(bookingData) ? bookingData[0] : bookingData;
    
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await axios.post(
        url,
        requestBody,  // Send the object directly, not in an array
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
        apiType: 'flight_passenger_allocation',
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
        apiType: 'flight_passenger_allocation',
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
    
      // Create structured error object
      const errorResponse = {
        error: error.response?.data || {},
        message: error.message,
        status: error.response?.status
      };
    
      throw errorResponse;
    }
  }
}

module.exports = FlightPassengerService;