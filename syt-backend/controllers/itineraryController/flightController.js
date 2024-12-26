// controllers/flightController.js

const FlightAuthService = require("../../services/flightServices/flightAuthService");
const FlightSearchService = require("../../services/flightServices/flightSearchService");
const FlightFareRulesService = require("../../services/flightServices/flightFareRulesService");
const FlightCreateItineraryService = require("../../services/flightServices/flightCreateItineraryService");

/**
 * Helper function to calculate total flight duration in minutes
 */
function calculateTotalDuration(flight) {
  return flight.sg.reduce((total, segment) => {
    return total + (segment.aD || 0) + (segment.gT || 0);  // Include both air duration and ground time
  }, 0);
}

/**
 * Helper function to attempt booking a specific flight with retries
 */
async function tryFlightBooking(flights, searchResponse, params, currentIndex = 0) {
  if (currentIndex >= flights.length) {
    return {
      success: false,
      error: "All flights attempted - none available",
      retryNeeded: false
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
      const errorCode = itineraryResponse.details?.error?.errorCode;
      const errorMessage = itineraryResponse.details?.error?.errorMessage;
      
      if (errorCode === "1000" || errorCode === 50) {
        console.log(`Flight ${currentIndex + 1} not available (Error ${errorCode}): ${errorMessage}, trying next flight...`);
        return tryFlightBooking(flights, searchResponse, params, currentIndex + 1);
      }
    
      return {
        success: false,
        error: `Failed to create itinerary: ${errorMessage || 'Unknown error'}`,
        errorDetails: itineraryResponse.error,
        retryNeeded: false
      };
    }

    return {
      success: true,
      fareRules: fareRulesResponse.data,
      itinerary: itineraryResponse.data,
      selectedFlight
    };

  } catch (error) {
    if (error.response?.data?.error?.errorCode === "1000" || 
        error.response?.data?.error?.errorCode === 50) {
      console.log(`Flight ${currentIndex + 1} not available, trying next flight...`);
      return tryFlightBooking(flights, searchResponse, params, currentIndex + 1);
    }
  
    throw error;
  }
}

/**
 * Get preferred index based on user preference
 */
function getPreferredIndex(length, preference) {
  switch (preference?.toLowerCase()) {
    case "luxury":
      return Math.floor(length * 0.75);
    case "pocket friendly":
      return Math.floor(length * 0.25);
    default:
      return Math.floor(length * 0.5);
  }
}

/**
 * Format flight response for consistency
 */
function formatFlightResponse(flight, itineraryData, fareRulesData) {
  if (!flight?.sg?.length) return null;

  const firstSegment = flight.sg[0];
  const lastSegment = flight.sg[flight.sg.length - 1];

  // Calculate total duration and landing time
  const totalDuration = flight.sg.reduce((total, segment) => {
    return total + (segment.aD || 0);
  }, 0);

  const departureTime = new Date(firstSegment.or.dT);
  const landingTime = new Date(departureTime);
  landingTime.setMinutes(landingTime.getMinutes() + totalDuration);

  // Get airport metadata
  const airportMetaData = itineraryData.airportMetaData || [];
  const originAirportData = airportMetaData.find(
    (am) => am.airportCode === firstSegment.or.aC
  );
  const destinationAirportData = airportMetaData.find(
    (am) => am.airportCode === lastSegment.ds.aC
  );

  return {
    // Flight identification
    type: flight.type || "flight",
    transportationType: "flight",
    flightProvider: lastSegment.al.alN,
    flightCode: `${lastSegment.al.alC}${lastSegment.al.fN}`,

    // Route information
    origin: firstSegment.or.cN,
    destination: lastSegment.ds.cN,

    // Origin airport details
    originAirport: {
      name: firstSegment.or.aN,
      code: firstSegment.or.aC,
      city: firstSegment.or.cN,
      country: firstSegment.or.cnN,
      location: {
        latitude: parseFloat(
          originAirportData?.latitude ||
            firstSegment.or?.location?.latitude ||
            flight.departureCity?.latitude ||
            flight.departureCity?.lat ||
            0
        ),
        longitude: parseFloat(
          originAirportData?.longitude ||
            firstSegment.or?.location?.longitude ||
            flight.departureCity?.longitude ||
            flight.departureCity?.long ||
            0
        ),
      },
    },

    // Destination airport details
    arrivalAirport: {
      name: lastSegment.ds.aN,
      code: lastSegment.ds.aC,
      city: lastSegment.ds.cN,
      country: lastSegment.ds.cnN,
      location: {
        latitude: parseFloat(
          destinationAirportData?.latitude ||
            lastSegment.ds?.location?.latitude ||
            flight.arrivalCity?.latitude ||
            flight.arrivalCity?.lat ||
            0
        ),
        longitude: parseFloat(
          destinationAirportData?.longitude ||
            lastSegment.ds?.location?.longitude ||
            flight.arrivalCity?.longitude ||
            flight.arrivalCity?.long ||
            0
        ),
      },
    },

    // Time details
    departureDate: firstSegment.or.dT.split("T")[0],
    departureTime: new Date(firstSegment.or.dT).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    landingTime: landingTime.toISOString(),
    arrivalTime: new Date(lastSegment.ds.aT).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),

    // Flight details
    airline: lastSegment.al.alN,
    flightDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
    price: flight.pF,

    // Fare information
    fareDetails: {
      baseFare: flight.bF,
      taxAndSurcharge: flight.tAS,
      serviceFee: flight.sF,
      finalFare: flight.fF,
    },

    // Additional properties
    isRefundable: !flight.iR,
    isLowCost: flight.iL,

    // Segment details
    segments: flight.sg.map((segment) => ({
      baggage: segment.bg,
      cabinBaggage: segment.cBg,
      flightNumber: `${segment.al.alC}${segment.al.fN}`,
      origin: segment.or.cN,
      destination: segment.ds.cN,
      departureTime: segment.or.dT,
      arrivalTime: segment.ds.aT,
      duration: segment.dr,
      groundTime: segment.gT,
    })),

    // Rules and booking information
    fareRules: fareRulesData.results?.[0]?.fareRuleDetail,
    itineraryDetails: {
      itineraryCode: itineraryData.itineraryCode,
      pnrDetails: itineraryData.pnrDetails,
      bookingStatus: itineraryData.bookingStatus,
    },
  };
}

/**
 * Main controller function to get flights with retry logic
 */
module.exports = {
  getFlights: async (requestData) => {
    try {
      const {
        departureCity,
        cities,
        travelers,
        departureDates,
        preferences,
        type = "departure_flight",
        inquiryToken,
      } = requestData;

      // Validate required parameters
      if (!departureCity || !cities || !travelers || !departureDates) {
        throw new Error("Missing required flight request parameters");
      }

      // Get auth token
      const authResponse = await FlightAuthService.login(inquiryToken);
      if (!authResponse.success) {
        throw new Error("Authentication failed");
      }

      const token = authResponse.token;

      // Search flights
      const searchResponse = await FlightSearchService.searchFlights({
        departureCity,
        arrivalCity: cities[0],
        date: departureDates.startDate,
        travelers,
        inquiryToken,
        type,
        token,
      });

      if (!searchResponse.success) {
        throw new Error("Flight search failed: " + searchResponse.error);
      }

      const flights = searchResponse.data.results?.outboundFlights;
      if (!flights?.length) {
        throw new Error("No flights found");
      }

      // Filter out flights that exceed 24 hours
      const validDurationFlights = flights.filter(flight => {
        const totalDuration = calculateTotalDuration(flight);
        return totalDuration <= 24 * 60; // 24 hours in minutes
      });

      if (!validDurationFlights.length) {
        throw new Error("No flights found within 24-hour duration limit");
      }

      // Sort remaining flights by price and remove outliers
      const sortedFlights = [...validDurationFlights].sort((a, b) => a.pF - b.pF);
      const totalFlights = sortedFlights.length;
      const startIndex = Math.floor(totalFlights * 0.1);
      const endIndex = Math.floor(totalFlights * 0.9);
      const validFlights = sortedFlights.slice(startIndex, endIndex);

      // Common params for booking attempts
      const bookingParams = {
        inquiryToken,
        cityName: `${departureCity.city} to ${cities[0].city}`,
        date: departureDates.startDate,
        token,
      };

      // Start from the preferred index based on preferences
      const startingIndex = getPreferredIndex(
        validFlights.length,
        preferences?.flightPreference
      );

      // Attempt booking with retry logic
      const bookingResult = await tryFlightBooking(
        validFlights,
        searchResponse,
        bookingParams,
        startingIndex
      );

      if (!bookingResult.success) {
        throw new Error(bookingResult.error);
      }

      // Format and return the successful booking
      const formattedFlight = formatFlightResponse(
        {
          ...bookingResult.selectedFlight,
          departureCity,
          arrivalCity: cities[0],
          origin_location: {
            latitude: departureCity.latitude || departureCity.lat,
            longitude: departureCity.longitude || departureCity.long,
          },
          destination_location: {
            latitude: cities[0].latitude || cities[0].lat,
            longitude: cities[0].longitude || cities[0].long,
          }
        },
        bookingResult.itinerary,
        bookingResult.fareRules
      );

      return [formattedFlight];

    } catch (error) {
      console.error("Error in getFlights:", {
        message: error.message,
        details: error.errorDetails || error.response?.data || {},
        stack: error.stack
      });
      
      if (error.errorDetails) {
        return {
          success: false,
          error: error.message,
          details: error.errorDetails
        };
      }
      
      return {
        success: false,
        error: "Flight booking failed",
        details: error.message
      };
    }
  },
};