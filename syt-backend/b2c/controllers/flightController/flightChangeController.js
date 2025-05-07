const FlightTokenManager = require('../../../shared/services/tokenManagersTC/flightTokenManager');
const FlightAuthService = require('../../../shared/services/flightServicesTC/flightAuthService');
const FlightSearchService = require('../../../shared/services/flightServicesTC/flightSearchService');
const FlightFareRulesService = require('../../../shared/services/flightServicesTC/flightFareRulesService');
const FlightCreateItineraryService = require('../../../shared/services/flightServicesTC/flightCreateItineraryService');
const FlightUtils = require("../../utils/flight/flightUtils");
const CityAirport = require('../../../shared/models/CityAirport');

module.exports = {
  searchAvailableFlights: async (req, res) => {
    const {
      origin,
      destination,
      departureDate,
      type,
      oldFlightCode,
      existingFlightPrice,
      travelersDetails,
    } = req.body;

    try {
      if (!origin || !destination || !departureDate) {
        return res.status(400).json({
          success: false,
          message: "Missing required flight search parameters"
        });
      }

      // Get auth token
      const authToken = await FlightTokenManager.getOrSetToken(
        async () => {
          const authResponse = await FlightAuthService.login();
          return authResponse.token;
        }
      );

      // Determine the traveler details to use
      const effectiveTravelers = travelersDetails;

      // Format traveler details like in the CRM controller
      let formattedTravelers = { rooms: [{ adults: ['27'], children: [], infants: 0 }] }; // Default structure
      if (effectiveTravelers && effectiveTravelers.rooms && effectiveTravelers.rooms[0]) {
          const room = effectiveTravelers.rooms[0];
          const adultCount = Math.max(1, room.adults || 1); // Ensure at least 1 adult
          const childAges = (room.children || []).map(c => typeof c === 'number' ? String(c) : c); // Ensure string ages
          const infantCount = room.infants || 0;

          formattedTravelers = {
              rooms: [{
                  adults: Array(adultCount).fill('27'), // Array of '27' for each adult
                  children: childAges,
                  infants: infantCount
              }]
          };
      }

      // Search parameters
      const searchParams = {
        departureCity: {
          city: origin.city,
          iata: origin.code,
          country: origin.country,
        },
        arrivalCity: {
          city: destination.city,
          iata: destination.code,
          country: destination.country,
        },
        date: departureDate,
        travelers: formattedTravelers, // Use the formatted traveler object
        type,
        token: authToken,
        context: {
          oldFlightCode,
          existingFlightPrice: Number(existingFlightPrice)
        }
      };

      const searchResponse = await FlightSearchService.searchFlights(searchParams);

      if (!searchResponse.success) {
        throw new Error(searchResponse.error || "Flight search failed");
      }

      // Get all flights from search response
      const allFlights = searchResponse?.data?.results?.outboundFlights || [];
      
      // Get metadata for the entire dataset (for filter UI)
      
      // Calculate price ranges from ALL flights
      const allPrices = allFlights.map(f => f?.fF).filter(Boolean);
      const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
      
      // Get all available airlines for filter options from ALL flights
      const allAirlines = [...new Set(allFlights.map(f => f?.sg?.[0]?.al?.alN).filter(Boolean))];
      
      // Count occurrence of each stop count (0, 1, 2+) from ALL flights
      const stopCounts = {
        0: allFlights.filter(f => f?.sg?.length === 1).length,
        1: allFlights.filter(f => f?.sg?.length === 2).length,
        "2+": allFlights.filter(f => f?.sg?.length > 2).length
      };

      res.json({
        success: true,
        data: {
          flights: allFlights,
          traceId: searchResponse.data.traceId,
          isDomestic: searchResponse.data.isDomestic,
          totalTravelers: searchResponse.data.paxCount,
          priceRange: {
            min: minPrice,
            max: maxPrice
          },
          availableFilters: {
            airlines: allAirlines,
            stopCounts
          },
          context: {
            oldFlightCode,
            existingFlightPrice: Number(existingFlightPrice)
          }
        }
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search flights"
      });
    }
  },

  // All other methods remain the same...
  
  getFareRules: async (req, res) => {
    const { traceId, resultIndex, cityName, date } = req.query;

    try {
      const authToken = await FlightTokenManager.getOrSetToken(
        async () => {
          const authResponse = await FlightAuthService.login();
          return authResponse.token;
        }
      );

      const rulesResponse = await FlightFareRulesService.getFareRules({
        traceId,
        resultIndex,
        cityName,
        date,
        token: authToken
      });

      res.json({
        success: true,
        data: rulesResponse.data
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get fare rules"
      });
    }
  },

  selectFlight: async (req, res) => {
    // Updated signature: Get inquiryToken from params, body contains items, traceId, flightType
    const { inquiryToken } = req.params;
    const { items, traceId, flightType } = req.body;

    try {
      // Basic validation for the new payload
      if (!inquiryToken || !items || !Array.isArray(items) || items.length === 0 || !items[0].resultIndex || !traceId || !flightType) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters in select flight request (inquiryToken, items, traceId, flightType)."
        });
      }

      // Get auth token
      const authToken = await FlightTokenManager.getOrSetToken(
        async () => {
          const authResponse = await FlightAuthService.login();
          return authResponse.token;
        }
      );

      // Prepare parameters for createItinerary service
      const createItineraryParams = {
        traceId,
        items: items,
        flightType: flightType, 
        inquiryToken: inquiryToken,
        cityName: null, // Not needed for service call, used for logging in service
        date: null, // Not needed for service call, used for logging in service
        token: authToken
      };

      // Create itinerary using the service
      const itineraryResponse = await FlightCreateItineraryService.createItinerary(createItineraryParams);
      
      if (!itineraryResponse.success || !itineraryResponse.data || !itineraryResponse.data.results) {
        return res.status(400).json({
          success: false,
          error: itineraryResponse.error || 'Failed to create flight itinerary',
          details: itineraryResponse.details || itineraryResponse
        });
      }

      // Format the flight data using FlightUtils
      let formattedFlight = FlightUtils.formatFlightResponse(itineraryResponse.data);

      if (!formattedFlight) {
        console.error("Failed to format flight response from itinerary data:", itineraryResponse.data);
        throw new Error('Failed to format flight data after creating itinerary.');
      }

      // --- START: Enhance with location data --- 
      try {
        const originIata = formattedFlight.originAirport?.code;
        const destinationIata = formattedFlight.arrivalAirport?.code;
        console.log(`[selectFlight] Extracted IATAs: Origin=${originIata}, Destination=${destinationIata}`); // Log extracted IATAs
        
        let originLocation = { latitude: 0, longitude: 0 };
        let arrivalLocation = { latitude: 0, longitude: 0 };

        if (originIata && destinationIata) {
          const iataCodes = [originIata, destinationIata];
          console.log(`[selectFlight] Querying CityAirport for IATAs:`, iataCodes); // Log codes being queried

          const airportLocations = await CityAirport.find({ iata: { $in: iataCodes } }).select('iata latitude longitude');
          console.log(`[selectFlight] Found airport locations from DB:`, JSON.stringify(airportLocations)); // Log DB results
          
          const originAirportData = airportLocations.find(ap => ap.iata === originIata);
          const arrivalAirportData = airportLocations.find(ap => ap.iata === destinationIata);
          console.log(`[selectFlight] Matched DB data: Origin=`, JSON.stringify(originAirportData), `Arrival=`, JSON.stringify(arrivalAirportData)); // Log matched data

          if (originAirportData) {
            originLocation = { latitude: originAirportData.latitude, longitude: originAirportData.longitude };
          }
          if (arrivalAirportData) {
            arrivalLocation = { latitude: arrivalAirportData.latitude, longitude: arrivalAirportData.longitude };
          }
        } else {
             console.warn("[selectFlight] Missing origin or destination IATA code in formatted flight, cannot fetch location.", formattedFlight);
        }
        
        console.log(`[selectFlight] Final location objects: Origin=`, JSON.stringify(originLocation), `Arrival=`, JSON.stringify(arrivalLocation)); // Log final locations

        // Update the formattedFlight object
        formattedFlight.originAirport.location = originLocation;
        formattedFlight.arrivalAirport.location = arrivalLocation;

      } catch (locationError) {
        console.error("[selectFlight] Error fetching or adding airport location data:", locationError); // Added prefix
        // Continue without location data if fetching fails, but log the error
        // Ensure default location objects are still assigned
        formattedFlight.originAirport.location = { latitude: 0, longitude: 0 };
        formattedFlight.arrivalAirport.location = { latitude: 0, longitude: 0 };
      }
      // --- END: Enhance with location data --- 

      return res.json({
        success: true,
        data: formattedFlight // Return the enhanced flight data
      });

    } catch (error) {
      console.error('Error in selectFlight:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to select flight',
        details: error.message
      });
    }
  },

  getFlightItineraryDetails: async (req, res) => {
    const {
      cityName,
      date,
      itineraryCode,
      traceId
    } = req.body;

    try {
      // Validate input
      if (!itineraryCode || !traceId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters: itineraryCode or traceId"
        });
      }

      // Get auth token
      const authToken = await FlightTokenManager.getOrSetToken(
        async () => {
          const authResponse = await FlightAuthService.login();
          return authResponse.token;
        }
      );

      // Call service method to get itinerary details
      const itineraryDetails = await FlightCreateItineraryService.getItineraryDetails(
        itineraryCode,
        traceId,
        authToken,
        cityName,
        date
      );

      const data = itineraryDetails.data
      
      // Return the response
      res.json({
        success: true,
        data,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch flight itinerary details',
        details: error.details || {}
      });
    }
  }
};