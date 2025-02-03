// controllers/flightControllerTC.js

const FlightAuthService = require("../../services/flightServices/flightAuthService");
const FlightSearchService = require("../../services/flightServices/flightSearchService");
const FlightFareRulesService = require("../../services/flightServices/flightFareRulesService");
const FlightCreateItineraryService = require("../../services/flightServices/flightCreateItineraryService");
const FlightUtils = require("../../utils/flight/flightUtils");
const FlightTokenManager = require('../../services/tokenManagers/flightTokenManager');

/**
 * Helper function to attempt booking a specific flight with retries
 */
async function tryFlightBooking(flights, searchResponse, params, currentIndex = 0) {
  if (currentIndex >= flights.length) {
    return {
      success: false,
      error: "All flights attempted - none available",
      retryNeeded: false,
    };
  }

  const selectedFlight = flights[currentIndex];

  try {
    // Get fare rules
    const fareRulesResponse = await FlightFareRulesService.getFareRules({
      traceId: searchResponse.data.traceId,
      resultIndex: selectedFlight.rI,
      inquiryToken: params.inquiryToken,
      cityName: params.cityName,
      date: params.date,
      token: params.token,
    });

    // Create itinerary
    const itineraryResponse = await FlightCreateItineraryService.createItinerary({
      traceId: searchResponse.data.traceId,
      resultIndex: selectedFlight.rI,
      inquiryToken: params.inquiryToken,
      cityName: params.cityName,  
      date: params.date,
      token: params.token,
    });

    if (!itineraryResponse.success) {
      const errorCode = 
        itineraryResponse.details?.error?.errorCode ||
        itineraryResponse.details?.details?.error?.errorCode;
      const errorMessage =
        itineraryResponse.details?.error?.errorMessage ||
        itineraryResponse.details?.details?.error?.errorMessage;

      // Add error code 400 to retry conditions
      if (errorCode == 1000 || errorCode == 50 || errorCode == 400) {
        console.log(
          `Flight ${currentIndex + 1} not available (Error ${errorCode}): ${errorMessage}, trying next flight...`
        );
        return tryFlightBooking(flights, searchResponse, params, currentIndex + 1);
      }

      return {
        success: false,
        error: `Failed to create itinerary: ${errorMessage || "Unknown error"}`,
        errorDetails: itineraryResponse.details,
        retryNeeded: false,
      };
    }

    return {
      success: true,
      fareRules: fareRulesResponse.data,
      itinerary: itineraryResponse.data,
      selectedFlight,
    };
  } catch (error) {
    // Add error code 400 check in catch block as well
    if (
      error.response?.data?.error?.errorCode === "1000" ||
      error.response?.data?.error?.errorCode === "50" ||
      error.response?.data?.error?.errorCode === "400" ||
      error.response?.data?.details?.error?.errorCode === "1000" ||
      error.response?.data?.details?.error?.errorCode === "50" ||
      error.response?.data?.details?.error?.errorCode === "400"
    ) {
      console.log(
        `Flight ${currentIndex + 1} not available, trying next flight...`
      );
      return tryFlightBooking(flights, searchResponse, params, currentIndex + 1);
    }

    throw error;
  }
}

//token preFetching 
const prefetchToken = async () => {
  try {
    const authToken = await FlightTokenManager.getOrSetToken(
      async () => {
        const authResponse = await FlightAuthService.login();
        return authResponse.token;
      }
    );
    return authToken;
  } catch (error) {
    console.error("Error prefetching flight token:", error);
    throw error;
  }
};

module.exports = {
  prefetchToken,
  getFlights: async (requestData) => {
    try {
      const {
        departureCity,
        cities,
        travelers,
        departureDates,
        type = "departure_flight",
        inquiryToken,
      } = requestData;

      // Validate required parameters
      if (!departureCity || !cities || !travelers || !departureDates) {
        throw new Error("Missing required flight request parameters");
      }

      const authToken = await FlightTokenManager.getOrSetToken(
        async () => {
          const authResponse = await FlightAuthService.login();
          return authResponse.token;
        }
      );

      if (!authToken) {
        throw new Error("Authentication failed");
      }

      // Search flights
      const searchResponse = await FlightSearchService.searchFlights({
        departureCity,
        arrivalCity: cities[0],
        date: departureDates.startDate,
        travelers,
        inquiryToken,
        type,
        token: authToken,
      });

      if (!searchResponse.success) {
        throw new Error("Flight search failed: " + searchResponse.error);
      }

      const flights = searchResponse.data.results?.outboundFlights;
      if (!flights?.length) {
        throw new Error("No flights found");
      }

      // Filter out flights that exceed 24 hours and are Flexi
      const validFlights = flights.filter((flight) => {
        const totalDuration = FlightUtils.calculateTotalDuration(flight);
        return totalDuration <= 24 * 60; // 24 hours in minutes
    });

      if (!validFlights.length) {
        throw new Error("No Flexi flights found within 24-hour duration limit");
      }

      // Sort flights by price for more predictable retry behavior
      const sortedFlights = [...validFlights].sort((a, b) => a.pF - b.pF);

      // Common params for booking attempts
      const bookingParams = {
        inquiryToken,
        cityName: `${departureCity.city} to ${cities[0].city}`,
        date: departureDates.startDate,
        token: authToken,
      };

      // Start from the beginning of sorted flights
      const bookingResult = await tryFlightBooking(
        sortedFlights,
        searchResponse,
        bookingParams,
        0
      );

      if (!bookingResult.success) {
        throw new Error(bookingResult.error);
      }

      // Format the flight data from itinerary
      const formattedFlight = FlightUtils.formatFlightResponse(bookingResult.itinerary);
      
      if (!formattedFlight) {
        throw new Error('Failed to format flight data');
      }

      // Enhance with location data
      const enhancedFlight = {
        ...formattedFlight,
        type: requestData.type || null,
        originAirport: {
          ...formattedFlight.originAirport,
          name: departureCity.name || departureCity.city,
          code: departureCity.iata || null,
          city: departureCity.city,
          country: departureCity.country,
          location: {
            latitude: parseFloat(departureCity.latitude || departureCity.lat || 0),
            longitude: parseFloat(departureCity.longitude || departureCity.long || 0)
          }
        },
        arrivalAirport: {
          ...formattedFlight.arrivalAirport,
          name: cities[0].name || cities[0].city,
          code: cities[0].iata || null,
          city: cities[0].city,
          country: cities[0].country,
          location: {
            latitude: parseFloat(cities[0].latitude || cities[0].lat || 0),
            longitude: parseFloat(cities[0].longitude || cities[0].long || 0)
          }
        }
      };

      return [enhancedFlight];
    } catch (error) {
      console.error("Error in getFlights:", {
        message: error.message,
        details: error.errorDetails || error.response?.data || {},
        stack: error.stack,
      });

      return {
        success: false,
        error: "Flight booking failed",
        details: error.message,
      };
    }
  },

  createFlightItinerary: async (requestData) => {
    try {
      const response = await FlightCreateItineraryService.createItinerary(requestData);
      
      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to create flight itinerary',
          details: response.details
        };
      }

      const formattedFlight = FlightUtils.formatFlightResponse(response.data);
      
      if (!formattedFlight) {
        throw new Error('Failed to format flight data');
      }

      const enhancedFlight = {
        ...formattedFlight,
        type: requestData.type,
        originAirport: {
          ...formattedFlight.originAirport,
          country: requestData.departureCity.country,
          location: {
            latitude: parseFloat(requestData.departureCity.latitude || 0),
            longitude: parseFloat(requestData.departureCity.longitude || 0)
          }
        },
        arrivalAirport: {
          ...formattedFlight.arrivalAirport,
          country: requestData.cities[0].country,
          location: {
            latitude: parseFloat(requestData.cities[0].latitude || 0),
            longitude: parseFloat(requestData.cities[0].longitude || 0)
          }
        }
      };

      return {
        success: true,
        data: enhancedFlight
      };

    } catch (error) {
      console.error('Error in createFlightItinerary:', error);
      return {
        success: false,
        error: 'Failed to process flight itinerary',
        details: error.message
      };
    }
  }
};