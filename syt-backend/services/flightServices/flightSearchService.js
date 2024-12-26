//services/flightServices/flightSearchService.js

const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightSearchService {
  static async searchFlights(params) {
    try {
      const {
        departureCity,
        arrivalCity,
        date,
        travelers,
        inquiryToken,
        type = 'departure',
        token
      } = params;

      let preferredTime = new Date(date);
      preferredTime.setHours(type === 'departure' ? 8 : 18, 0, 0);

      const passengerCounts = travelers.rooms.reduce(
        (counts, room) => {
          counts.adultCount += room.adults.length;
          counts.childCount += room.children.length;
          return counts;
        },
        { adultCount: 0, childCount: 0 }
      );

      const requestBody = {
        adultCount: String(passengerCounts.adultCount),
        childCount: String(passengerCounts.childCount),
        infantCount: "0",
        directFlight: false,
        journeyType: 1,
        origin: departureCity.iata,
        destination: arrivalCity.iata,
        preferredDepartureTime: preferredTime.toISOString(),
        flightCabinClass: 1
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
        'https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/search',
        requestBody,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName: `${departureCity.city} to ${arrivalCity.city}`,
        date,
        apiType: `flight_search_${type}`,
        requestData: {
          ...requestBody
        },
        responseData: response.data
      };

      apiLogger.logApiData(logData);

      return {
        success: true,
        data: response.data.response
      };

    } catch (error) {
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: `${params.departureCity.city} to ${params.arrivalCity.city}`,
        date: params.date,
        apiType: `flight_search_${params.type}_error`,
        requestData: {
          departureCity: params.departureCity,
          arrivalCity: params.arrivalCity,
          date: params.date
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      apiLogger.logApiData(errorLogData);

      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FlightSearchService;