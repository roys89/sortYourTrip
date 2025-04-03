//services/flightServicesTC/flightSearchService.js

const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightSearchService {
  static async searchFlights(params) {
    try {
      const {
        departureCity,
        arrivalCity,
        date,
        returnDate,
        isRoundTrip,
        travelers,
        inquiryToken,
        type = 'departure',
        token,
        departureTime,
        returnTime,
        cabinClass
      } = params;

      const getPreferredTime = (date, time, type) => {
        let preferredTime = new Date(date);
        
        if (time) {
          // If time is provided, use it
          const [hours, minutes] = time.split(':');
          preferredTime.setHours(parseInt(hours), parseInt(minutes), 0);
        } else {
          // Default times if no time provided
          preferredTime.setHours(type === 'departure' ? 8 : 18, 0, 0);
        }
        
        return preferredTime;
      };

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
        journeyType: isRoundTrip ? 2 : 1, // 1 for one-way, 2 for round trip
        origin: departureCity.iata,
        destination: arrivalCity.iata,
        preferredDepartureTime: getPreferredTime(date, departureTime, 'departure').toISOString(),
        flightCabinClass: cabinClass || 1,
        ...(isRoundTrip && returnDate && {
          returnDate: new Date(returnDate).toISOString(),
          preferredReturnDepartureTime: getPreferredTime(returnDate, returnTime, 'departure').toISOString()
        })
      };

      const response = await axios.post(
        'https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/search',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'source': 'website',
            'authorization-type': 'external-service'
          }
        }
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