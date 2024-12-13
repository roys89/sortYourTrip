const axios = require('axios');

exports.getFlights = async (city, travelersDetails, departureDates) => {
  try {
    const response = await axios.post('https://api.flightdata.com/flights', {
      city: city.iataCode,
      travelers: travelersDetails,
      dates: departureDates
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch flight details');
  }
};
