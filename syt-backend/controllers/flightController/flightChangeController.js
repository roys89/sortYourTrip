const FlightTokenManager = require('../../services/tokenManagers/flightTokenManager');
const FlightAuthService = require('../../services/flightServices/flightAuthService');
const FlightSearchService = require('../../services/flightServices/flightSearchService');
const FlightFareRulesService = require('../../services/flightServices/flightFareRulesService');
const FlightCreateItineraryService = require('../../services/flightServices/flightCreateItineraryService');
const logger = require('../../utils/logger');
const ItineraryInquiry = require('../../models/ItineraryInquiry');
const FlightUtils = require("../../utils/flight/flightUtils");
const CityAirport = require('../../models/CityAirport');

module.exports = {
  searchAvailableFlights: async (req, res) => {
    const { inquiryToken } = req.params;
    const { 
      origin, 
      destination, 
      departureDate,
      type,
      oldFlightCode,
      existingFlightPrice,
      travelersDetails,
      // Chunk parameters for progressive loading
      chunkIndex = 0,
      chunkSize = 100
    } = req.body;
  
    try {
      if (!inquiryToken || !origin || !destination || !departureDate) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required flight search parameters" 
        });
      }
  
      // Get inquiry details
      const inquiry = await ItineraryInquiry.findOne({ 
        itineraryInquiryToken: inquiryToken 
      });
  
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
  
      // Get auth token
      const authToken = await FlightTokenManager.getOrSetToken(
        async () => {
          const authResponse = await FlightAuthService.login();
          return authResponse.token;
        }
      );
  
      // Search parameters
      const searchParams = {
        departureCity: {
          city: origin.city || inquiry.departureCity.city,
          iata: origin.code || inquiry.departureCity.iata,
          country: origin.country || inquiry.departureCity.country,
          location: {
            latitude: origin.location?.latitude || inquiry.departureCity.latitude,
            longitude: origin.location?.longitude || inquiry.departureCity.longitude
          }
        },
        arrivalCity: {
          city: destination.city || inquiry.selectedCities[0].city,
          iata: destination.code || inquiry.selectedCities[0].iata,
          country: destination.country || inquiry.selectedCities[0].country,
          location: {
            latitude: destination.location?.latitude || inquiry.selectedCities[0].lat,
            longitude: destination.location?.longitude || inquiry.selectedCities[0].long
          }
        },
        date: departureDate,
        travelers: travelersDetails || inquiry.travelersDetails,
        inquiryToken,
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
      const allFlights = searchResponse.data.results.outboundFlights;
      const totalFlights = allFlights.length;
      
      logger.info(`Retrieved ${totalFlights} total flights`);
      
      // Calculate which chunk to return
      const startIndex = chunkIndex * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, totalFlights);
      const flightChunk = allFlights.slice(startIndex, endIndex);
      
      logger.info(`Returning chunk ${chunkIndex}: ${startIndex}-${endIndex} (${flightChunk.length} flights)`);
      
      // Get metadata for the entire dataset (for filter UI)
      
      // Calculate price ranges from ALL flights
      const allPrices = allFlights.map(f => f.pF).filter(Boolean);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      // Get all available airlines for filter options from ALL flights
      const allAirlines = [...new Set(allFlights.map(f => f.sg[0].al.alN))];
      
      // Count occurrence of each stop count (0, 1, 2+) from ALL flights
      const stopCounts = {
        0: allFlights.filter(f => f.sg.length === 1).length,
        1: allFlights.filter(f => f.sg.length === 2).length,
        "2+": allFlights.filter(f => f.sg.length > 2).length
      };
  
      res.json({
        success: true,
        data: {
          flights: flightChunk,
          traceId: searchResponse.data.traceId,
          isDomestic: searchResponse.data.isDomestic,
          totalTravelers: searchResponse.data.paxCount,
          pagination: {
            chunkIndex,
            chunkSize, 
            total: totalFlights,
            hasMore: endIndex < totalFlights
          },
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
      console.error("Error searching flights:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search flights"
      });
    }
  },

  // All other methods remain the same...
  
  getFareRules: async (req, res) => {
    const { inquiryToken } = req.params;
    const { traceId, resultIndex, cityName, date } = req.query;

    try {
      const authToken = await FlightTokenManager.getOrSetToken(
        inquiryToken,
        async () => {
          const authResponse = await FlightAuthService.login(inquiryToken);
          return authResponse.token;
        }
      );

      const rulesResponse = await FlightFareRulesService.getFareRules({
        traceId,
        resultIndex,
        inquiryToken,
        cityName,
        date,
        token: authToken
      });

      res.json({
        success: true,
        data: rulesResponse.data
      });

    } catch (error) {
      console.error('Error fetching fare rules:', error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get fare rules"
      });
    }
  },

  selectFlight: async (req, res) => {
    const { inquiryToken, resultIndex } = req.params;
    const { traceId, cityName, date, type } = req.body;

    logger.info('selectFlight called with params: ' + 
      `inquiryToken=${inquiryToken}, ` +
      `resultIndex=${resultIndex}, ` +
      `traceId=${traceId}, ` +
      `cityName=${cityName}, ` +
      `date=${date}, ` +
      `type=${type}`
    );

    try {
      // Get inquiry details
      const inquiry = await ItineraryInquiry.findOne({ 
        itineraryInquiryToken: inquiryToken 
      });

      if (!inquiry) {
        logger.info('Inquiry not found for token: ' + inquiryToken);
        return res.status(404).json({ 
          success: false,
          message: "Inquiry not found" 
        });
      }

      // Get auth token
      const authToken = await FlightTokenManager.getOrSetToken(
        inquiryToken,
        async () => {
          const authResponse = await FlightAuthService.login(inquiryToken);
          return authResponse.token;
        }
      );

      // Create itinerary
      const itineraryResponse = await FlightCreateItineraryService.createItinerary({
        traceId,
        resultIndex,
        inquiryToken,
        cityName,
        date,
        token: authToken
      });
      
      logger.info('Itinerary Response: ' + JSON.stringify(itineraryResponse, null, 2));

      if (!itineraryResponse.success || !itineraryResponse.data || !itineraryResponse.data.results) {
        logger.info('Failed to create flight itinerary: ' + 
          (itineraryResponse.error || 'Unknown error')
        );
        return res.status(400).json({
          success: false,
          error: itineraryResponse.error || 'Failed to create flight itinerary',
          details: itineraryResponse.details || itineraryResponse
        });
      }

      // Format the flight data using FlightUtils
      const formattedFlight = FlightUtils.formatFlightResponse(itineraryResponse.data);

      if (!formattedFlight) {
        throw new Error('Failed to format flight data');
      }

      // Find origin and destination locations
      const originLocation = await CityAirport.findOne({ 
        iata: formattedFlight.originAirport.code 
      }) || inquiry.selectedCities.find(
        city => city.iata === formattedFlight.originAirport.code
      ) || inquiry.departureCity;

      const destinationLocation = await CityAirport.findOne({ 
        iata: formattedFlight.arrivalAirport.code 
      }) || inquiry.selectedCities.find(
        city => city.iata === formattedFlight.arrivalAirport.code
      );

      // Validate location data
      if (!originLocation) {
        logger.error(`Could not find origin location for flight type: ${type}`);
        throw new Error(`Could not find origin location for flight type: ${type}`);
      }

      if (!destinationLocation) {
        logger.error(`Could not find destination location for flight type: ${type}`);
        throw new Error(`Could not find destination location for flight type: ${type}`);
      }

      // Enhance with detailed location data
      const enhancedFlight = {
        ...formattedFlight,
        type,
        originAirport: {
          ...formattedFlight.originAirport,
          country: originLocation.country || '',
          location: {
            latitude: parseFloat(originLocation.latitude || originLocation.lat || 0),
            longitude: parseFloat(originLocation.longitude || originLocation.long || 0)
          }
        },
        arrivalAirport: {
          ...formattedFlight.arrivalAirport,
          country: destinationLocation.country || '',
          location: {
            latitude: parseFloat(destinationLocation.latitude || destinationLocation.lat || 0),
            longitude: parseFloat(destinationLocation.longitude || destinationLocation.long || 0)
          }
        }
      };

      return res.json({
        success: true,
        data: enhancedFlight
      });

    } catch (error) {
      logger.error('Error selecting flight: ' + error.message);
      logger.error('Error Details: ' + JSON.stringify({
        message: error.message,
        stack: error.stack,
        inquiryToken,
        resultIndex
      }, null, 2));

      return res.status(500).json({
        success: false,
        error: 'Failed to select flight',
        details: error.message
      });
    }
  },

  getFlightItineraryDetails: async (req, res) => {
    const {
      inquiryToken,
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
        inquiryToken,
        cityName,
        date
      );

      // Log the details for additional tracking if needed
      logger.info('Flight Itinerary Details:', JSON.stringify(itineraryDetails, null, 2));
      const data = itineraryDetails.data
      
      // Return the response
      res.json({
        success: true,
        data,
      });

    } catch (error) {
      logger.error('Error fetching flight itinerary details:', error);
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch flight itinerary details',
        details: error.details || {}
      });
    }
  }
};