const axios = require('axios');

class Availability {
  constructor() {
    this.API_KEY = '659555342b7a9a1f910a45462672f3fb';
    this.BASE_URL = 'https://v3-api.grnconnect.com/api/v3/hotels/availability';
  }

  /**
   * Make a single API call for hotel codes
   */
  async fetchHotelAvailability({
    hotelCodes,
    checkIn,
    checkOut,
    travelers,
    nationality = 'IN',
    currency = 'INR'
  }) {
    try {
      // Prepare the request body
      const requestBody = {
        rooms: travelers.rooms.map(room => ({
          adults: room.adults.length,
          children_ages: room.children || []
        })),
        rates: 'comprehensive',
        currency,
        client_nationality: nationality,
        checkout: checkOut,
        checkin: checkIn,
        purpose_of_travel: 1,
        hotel_codes: hotelCodes
      };

      // Make the API call
      const response = await axios.post(
        this.BASE_URL,
        requestBody,
        {
          headers: {
            'api-key': this.API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error in hotel service:', error.message);
      throw new Error(`Hotel service error: ${error.message}`);
    }
  }
}

module.exports = new Availability();