const FlightTokenManager = require('../../shared/services/tokenManagersTC/flightTokenManager');
const FlightAuthService = require('../../shared/services/flightServicesTC/flightAuthService');
const FlightSearchService = require('../../shared/services/flightServicesTC/flightSearchService');
const FlightFareRulesService = require('../../shared/services/flightServicesTC/flightFareRulesService');
const FlightBookingService = require('../../shared/services/flightServicesTC/flightBookingService');
const FlightCreateItineraryService = require('../../shared/services/flightServicesTC/flightCreateItineraryService');
const FlightPassengerService = require('../../shared/services/flightServicesTC/flightPassengerService');
const SingleBooking = require('../models/SingleBooking');
const logger = require('../../shared/utils/logger');
const FlightBookingDetailsService = require('../../shared/services/flightServicesTC/FlightBookingDetailsService');

// Provider-specific services
const TravClanServices = {
  tokenManager: FlightTokenManager,
  authService: FlightAuthService,
  searchService: FlightSearchService,
  fareRulesService: FlightFareRulesService,
  bookingService: FlightBookingService,
  createItineraryService: FlightCreateItineraryService
};

// Available providers
const Providers = {
  TC: TravClanServices
  // Add other providers as they become available:
  // LA: LeAmigoServices,
  // GRNC: GRNCServices
};

// Function to get provider service
const getProviderService = (provider, serviceType) => {
  if (!provider || !Providers[provider]) {
    throw new Error(`Invalid or unsupported provider: ${provider}`);
  }

  const service = Providers[provider][serviceType];
  if (!service) {
    throw new Error(`Service ${serviceType} not available for provider ${provider}`);
  }

  return service;
};

// Helper functions for transforming flight data
const transformers = {
  // Transform segment data for consistent format
  transformSegment: (segment) => {
    return {
      baggage: segment.bg,
      cabinBaggage: segment.cBg,
      duration: segment.dr,
      groundTime: segment.gT || 0,
      stopoverDuration: segment.sD,
      cabinClass: segment.cC,
      availableSeats: segment.nOSA,
      accumulatedDuration: segment.aD,
      
      // Stopover info
      isStopover: segment.sO,
      stopoverPoint: segment.sP,
      stopoverArrivalTime: segment.sPAT,
      stopoverDepartureTime: segment.sPDT,
      
      // Departure info
      departure: {
        airport: {
          code: segment.or.aC,
          name: segment.or.aN,
          terminal: segment.or.tr || ''
        },
        city: {
          code: segment.or.cC,
          name: segment.or.cN
        },
        country: segment.or.cnN,
        time: segment.or.dT
      },
      
      // Arrival info
      arrival: {
        airport: {
          code: segment.ds.aC,
          name: segment.ds.aN,
          terminal: segment.ds.tr || ''
        },
        city: {
          code: segment.ds.cC,
          name: segment.ds.cN
        },
        country: segment.ds.cnN,
        time: segment.ds.aT
      },
      
      // Airline info
      airline: {
        code: segment.al.alC,
        name: segment.al.alN,
        flightNumber: segment.al.fN ? segment.al.fN.trim() : '',
        fareClass: segment.al.fC,
        fareClassFullCode: segment.al.fCFC,
        operatingCarrier: segment.al.oC
      }
    };
  },



  // Generate filter metadata from all flights
  generateFilterMetadata: (allFlights, isRoundTrip) => {
    // Calculate price ranges from ALL flights
    const allPrices = allFlights.map(f => f.fF).filter(Boolean);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    
    // Get all available airlines for filter options
    const allAirlines = new Set();
    
    // Count occurrence of each stop count
    const stopCounts = {
      0: 0,
      1: 0,
      "2+": 0
    };

    allFlights.forEach(flight => {
      if (isRoundTrip && flight.outboundFlight) {
        // Add airlines from outbound flight
        flight.outboundFlight.forEach(segment => {
          allAirlines.add(segment.al.alN);
        });
        
        // Add airlines from inbound options
        if (flight.inboundFlights) {
          flight.inboundFlights.forEach(options => {
            options.forEach(option => {
              if (option.sg) {
                option.sg.forEach(segment => {
                  allAirlines.add(segment.al.alN);
                });
              }
            });
          });
        }

        // Count stops for outbound flight
        const outboundStops = flight.outboundFlight.length - 1;
        if (outboundStops === 0) stopCounts[0]++;
        else if (outboundStops === 1) stopCounts[1]++;
        else stopCounts["2+"]++;

        // Count stops for each inbound option
        if (flight.inboundFlights) {
          flight.inboundFlights.forEach(options => {
            options.forEach(option => {
              if (option.sg) {
                const inboundStops = option.sg.length - 1;
                if (inboundStops === 0) stopCounts[0]++;
                else if (inboundStops === 1) stopCounts[1]++;
                else stopCounts["2+"]++;
              }
            });
          });
        }
      } else {
        // One-way flight or domestic round trip
        flight.sg?.forEach(segment => {
          allAirlines.add(segment.al.alN);
        });
        
        // Count stops
        const stops = flight.sg?.length - 1 || 0;
        if (stops === 0) stopCounts[0]++;
        else if (stops === 1) stopCounts[1]++;
        else stopCounts["2+"]++;
      }
    });

    return {
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      availableFilters: {
        airlines: Array.from(allAirlines),
        stopCounts
      }
    };
  }
};

module.exports = {
  searchFlights: async (req, res) => {
    try {
      const {
        provider = 'TC',
        departureCity,
        arrivalCity,
        date,
        returnDate,
        isRoundTrip,
        travelers,
        departureTime,
        returnTime,
        cabinClass
      } = req.body;

      // Validate required fields
      if (!departureCity || !arrivalCity || !date) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: departure city, arrival city, and date are required'
        });
      }

      // Validate return date for round trips
      if (isRoundTrip && !returnDate) {
        return res.status(400).json({
          success: false,
          message: 'Return date is required for round trips'
        });
      }

      // Get provider-specific services
      const tokenManager = getProviderService(provider, 'tokenManager');
      const authService = getProviderService(provider, 'authService');
      const searchService = getProviderService(provider, 'searchService');

      // Get auth token
      const authToken = await tokenManager.getOrSetToken(
        async () => {
          const authResponse = await authService.login();
          return authResponse.token;
        }
      );

      // Search parameters
      const searchParams = {
        departureCity,
        arrivalCity,
        date,
        returnDate,
        isRoundTrip,
        travelers: {
          rooms: [{
            adults: Array(travelers.rooms[0].adults).fill('27'),
            children: travelers.rooms[0].children.map(c => 
              typeof c === 'number' ? String(c) : c
            ),
            infants: travelers.rooms[0].infants || 0
          }]
        },
        departureTime,
        returnTime,
        cabinClass,
        token: authToken
      };

      logger.debug('Controller - Search Params:', JSON.stringify(searchParams, null, 2));

      // Search flights
      const searchResults = await searchService.searchFlights(searchParams);

      if (!searchResults.success) {
        logger.error('Flight search error:', searchResults.error);
        return res.status(422).json({ 
          success: false,
          message: searchResults.error || "Flight search failed" 
        });
      }

      // Check for required data in search response
      if (!searchResults.data?.results?.outboundFlights) {
        logger.error('Invalid search response format:', searchResults);
        return res.status(500).json({
          success: false,
          message: "Invalid response format from flight provider API"
        });
      }

      // Check if this is a domestic round trip
      const isDomesticRoundTrip = searchResults.data.isDomestic && 
                                isRoundTrip &&
                                searchResults.data.results.outboundFlights &&
                                searchResults.data.results.inboundFlights;

      if (isDomesticRoundTrip) {
        logger.info('Domestic round trip detected - providing separate outbound/inbound arrays');
        
        // Get outbound and inbound flights
        const outboundFlights = searchResults.data.results.outboundFlights || [];
        const inboundFlights = searchResults.data.results.inboundFlights || [];
        
        logger.info('Domestic round trip flight counts:', {
          outboundCount: outboundFlights.length,
          inboundCount: inboundFlights.length
        });
        
        // Calculate metadata for filters
        const allPrices = [...outboundFlights, ...inboundFlights].map(f => f.fF).filter(Boolean);
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        
        // Get all available airlines
        const allAirlines = new Set();
        [...outboundFlights, ...inboundFlights].forEach(flight => {
          flight.sg.forEach(segment => {
            allAirlines.add(segment.al.alN);
          });
        });
        
        // Count stops
        const stopCounts = { 0: 0, 1: 0, "2+": 0 };
        [...outboundFlights, ...inboundFlights].forEach(flight => {
          const stops = flight.sg.length - 1;
          if (stops === 0) stopCounts[0]++;
          else if (stops === 1) stopCounts[1]++;
          else stopCounts["2+"]++;
        });
        
        const response = {
          success: true,
          provider: req.body.provider || 'TC',
          data: {
            outboundFlights,
            inboundFlights,
            traceId: searchResults.data.traceId,
            isDomestic: true,
            totalTravelers: searchResults.data.paxCount,
            isRoundTrip: true,
            priceRange: {
              min: minPrice,
              max: maxPrice
            },
            availableFilters: {
              airlines: Array.from(allAirlines),
              stopCounts
            }
          }
        };
        
        return res.json(response);
      }
      
      // Get all flights from search response - for non-domestic round trips and one-way flights
      const allFlights = searchResults.data.results.outboundFlights;
      
      // Calculate metadata for filters from ALL flights
      const allPrices = allFlights.map(f => f.fF).filter(Boolean);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      // Get all available airlines
      const allAirlines = new Set();
      
      // For round trips, we need to consider both outbound and inbound flights
      allFlights.forEach(flight => {
        if (isRoundTrip && flight.outboundFlight) {
          // Add airlines from outbound flight
          flight.outboundFlight.forEach(segment => {
            allAirlines.add(segment.al.alN);
          });
          
          // Add airlines from inbound options
          if (flight.inboundFlights) {
            flight.inboundFlights.forEach(options => {
              options.forEach(option => {
                if (option.sg) {
                  option.sg.forEach(segment => {
                    allAirlines.add(segment.al.alN);
                  });
                }
              });
            });
          }
        } else {
          // One-way flight
          flight.sg.forEach(segment => {
            allAirlines.add(segment.al.alN);
          });
        }
      });
      
      // Count occurrence of each stop count
      const stopCounts = {
        0: 0,
        1: 0,
        "2+": 0
      };

      allFlights.forEach(flight => {
        if (isRoundTrip && flight.outboundFlight) {
          // Count stops for outbound flight
          const outboundStops = flight.outboundFlight.length - 1;
          if (outboundStops === 0) stopCounts[0]++;
          else if (outboundStops === 1) stopCounts[1]++;
          else stopCounts["2+"]++;

          // Count stops for each inbound option
          if (flight.inboundFlights) {
            flight.inboundFlights.forEach(options => {
              options.forEach(option => {
                if (option.sg) {
                  const inboundStops = option.sg.length - 1;
                  if (inboundStops === 0) stopCounts[0]++;
                  else if (inboundStops === 1) stopCounts[1]++;
                  else stopCounts["2+"]++;
                }
              });
            });
          }
        } else {
          // One-way flight
          const stops = flight.sg.length - 1;
          if (stops === 0) stopCounts[0]++;
          else if (stops === 1) stopCounts[1]++;
          else stopCounts["2+"]++;
        }
      });

      const response = {
        success: true,
        provider: req.body.provider || 'TC',
        data: {
          flights: allFlights,
          traceId: searchResults.data.traceId,
          isDomestic: searchResults.data.isDomestic,
          totalTravelers: searchResults.data.paxCount,
          isRoundTrip: isRoundTrip,
          priceRange: {
            min: minPrice,
            max: maxPrice
          },
          availableFilters: {
            airlines: Array.from(allAirlines),
            stopCounts
          }
        }
      };
      
      return res.json(response);
    } catch (error) {
      logger.error(`Error searching flights with provider ${req.body.provider || 'TC'}:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to search flights"
      });
    }
  },

  createFlightItinerary: async (req, res) => {
    const { provider = 'TC', traceId, items, flightType, cityName, date } = req.body;

    try {
      // Validate required fields
      if (!traceId || !items || !flightType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: traceId, items, and flightType are required'
        });
      }

      // Validate flight type
      if (!['ONE_WAY', 'DOMESTIC_ROUND_TRIP', 'INTERNATIONAL_ROUND_TRIP'].includes(flightType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid flight type. Must be ONE_WAY, DOMESTIC_ROUND_TRIP, or INTERNATIONAL_ROUND_TRIP'
        });
      }

      // Validate items based on flight type
      switch (flightType) {
        case 'DOMESTIC_ROUND_TRIP':
          if (!Array.isArray(items) || items.length !== 2) {
            return res.status(400).json({
              success: false,
              message: 'Domestic round trip requires exactly 2 items (outbound and inbound flights)'
            });
          }
          if (!items[0].resultIndex || !items[1].resultIndex) {
            return res.status(400).json({
              success: false,
              message: 'Both outbound and inbound flights must have resultIndex'
            });
          }
          break;

        case 'INTERNATIONAL_ROUND_TRIP':
          if (!Array.isArray(items) || items.length !== 1) {
            return res.status(400).json({
              success: false,
              message: 'International round trip requires exactly 1 item'
            });
          }
          if (!items[0].resultIndex) {
            return res.status(400).json({
              success: false,
              message: 'Selected inbound option resultIndex is required'
            });
          }
          break;

        case 'ONE_WAY':
          if (!Array.isArray(items) || items.length !== 1) {
            return res.status(400).json({
              success: false,
              message: 'One way trip requires exactly 1 item'
            });
          }
          if (!items[0].resultIndex) {
            return res.status(400).json({
              success: false,
              message: 'Flight resultIndex is required'
            });
          }
          break;
      }

      // Get provider-specific services
      const tokenManager = getProviderService(provider, 'tokenManager');
      const authService = getProviderService(provider, 'authService');
      const createItineraryService = getProviderService(provider, 'createItineraryService');

      // Get auth token
      const authToken = await tokenManager.getOrSetToken(
        async () => {
          const authResponse = await authService.login();
          return authResponse.token;
        }
      );

      // Create itinerary with validated data
      const itineraryResponse = await createItineraryService.createItinerary({
        traceId,
        items,
        flightType,
        cityName,
        date,
        token: authToken
      });

      if (!itineraryResponse.success) {
        throw new Error(itineraryResponse.error || "Failed to create flight itinerary");
      }

      // Get itinerary details
      const itineraryDetails = await createItineraryService.getItineraryDetails(
        itineraryResponse.data.results.itineraryCode,
        traceId,
        authToken,
        null,
        cityName,
        date
      );

      if (!itineraryDetails.success) {
        throw new Error(itineraryDetails.error || "Failed to get itinerary details");
      }

      res.json({
        success: true,
        provider: provider,
        data: itineraryDetails.data,
        flightType
      });

    } catch (error) {
      logger.error(`Error creating flight itinerary with provider ${req.body.provider || 'TC'}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create flight itinerary"
      });
    }
  },

  getFareRules: async (req, res) => {
    const { provider = 'TC', traceId } = req.params;
    const { resultIndex, cityName, date } = req.query;

    try {
      // Get provider-specific services
      const tokenManager = getProviderService(provider, 'tokenManager');
      const authService = getProviderService(provider, 'authService');
      const fareRulesService = getProviderService(provider, 'fareRulesService');

      const authToken = await tokenManager.getOrSetToken(
        async () => {
          const authResponse = await authService.login();
          return authResponse.token;
        }
      );

      const rulesResponse = await fareRulesService.getFareRules({
        traceId,
        resultIndex,
        cityName,
        date,
        token: authToken
      });

      res.json({
        success: true,
        provider: provider,
        data: rulesResponse.data
      });

    } catch (error) {
      logger.error(`Error fetching fare rules with provider ${req.params.provider || 'TC'}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get fare rules"
      });
    }
  },

  bookFlight: async (req, res) => {
    const { provider = 'TC', traceId, itineraryCode } = req.body;

    try {
      // Validate required fields
      if (!traceId || !itineraryCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: traceId and itineraryCode are required'
        });
      }

      // Get provider-specific services
      const tokenManager = getProviderService(provider, 'tokenManager');
      const authService = getProviderService(provider, 'authService');
      const bookingService = getProviderService(provider, 'bookingService');

      // Get auth token
      const authToken = await tokenManager.getOrSetToken(
        async () => {
          const authResponse = await authService.login();
          return authResponse.token;
        }
      );

      // Call flight booking service
      const bookingResponse = await bookingService.bookFlight({
        traceId,
        itineraryCode,
        token: authToken
      });

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.error || "Failed to book flight");
      }

      res.json({
        success: true,
        provider: provider,
        data: bookingResponse.data
      });

    } catch (error) {
      logger.error(`Error booking flight with provider ${req.body.provider || 'TC'}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to book flight"
      });
    }
  },

  handleFlightSearch: async (req, res) => {
    try {
      const { searchId, sessionId, providerId, traceId, chunk } = req.query;
      let offset = parseInt(req.query.offset) || 0;
      let limit = parseInt(req.query.limit) || 20;
      
      // Ensure limit is no more than 100 flights at a time
      if (limit > 100) {
        limit = 100;
      }

      if (!searchId && !sessionId && !providerId && !traceId) {
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
      }

      const flightSearchService = new FlightSearchService();
      const response = await flightSearchService.getFlightSearchResults({ searchId, sessionId, providerId, traceId, chunk });
      
      if (!response || !response.data || !response.data.response) {
        return res.status(404).json({ success: false, message: 'No flight results found' });
      }

      // Check if this is a domestic round trip (has outboundFlights and inboundFlights)
      const isDomesticRoundTrip = response.data.response.isDomestic && 
                                 response.data.response.journeyType === 2 &&
                                 response.data.response.results && 
                                 response.data.response.results.outboundFlights &&
                                 response.data.response.results.inboundFlights;

      // For domestic round trips, map with consistent field names but keep separate arrays
      if (isDomesticRoundTrip) {
        logger.info('Domestic round trip detected - mapping fields consistently');
        
        // Map outbound flights with consistent field names
        const mappedOutboundFlights = response.data.response.results.outboundFlights.map(flight => ({
          resultIndex: flight.rI,
          isRefundable: flight.iR,
          airlineRemark: flight.aR,
          isLowCost: flight.iL,
          provider: flight.pr,
          price: {
            amount: flight.fF,
            currency: flight.cr,
            baseFare: flight.bF,
            tax: flight.tAS
          },
          segments: flight.sg.map(segment => ({
            baggage: segment.bg,
            cabinBaggage: segment.cBg,
            cabinClass: segment.cC,
            airline: {
              code: segment.al.alC,
              name: segment.al.alN,
              flightNumber: segment.al.fN ? segment.al.fN.trim() : '',
              fareClass: segment.al.fC
            },
            departure: {
              airport: {
                code: segment.or.aC,
                name: segment.or.aN,
                terminal: segment.or.tr || ''
              },
              city: {
                code: segment.or.cC,
                name: segment.or.cN
              },
              country: segment.or.cnN,
              time: segment.or.dT
            },
            arrival: {
              airport: {
                code: segment.ds.aC,
                name: segment.ds.aN,
                terminal: segment.ds.tr || ''
              },
              city: {
                code: segment.ds.cC,
                name: segment.ds.cN
              },
              country: segment.ds.cnN,
              time: segment.ds.aT
            },
            duration: segment.dr,
            groundTime: segment.gT || 0
          })),
          stopCount: flight.sC || 0,
          availableSeats: flight.sA,
          fareClass: flight.pFC,
          fareIdentifier: flight.fareIdentifier
        }));
        
        // Map inbound flights with consistent field names
        const mappedInboundFlights = response.data.response.results.inboundFlights.map(flight => ({
          resultIndex: flight.rI,
          isRefundable: flight.iR,
          airlineRemark: flight.aR,
          isLowCost: flight.iL,
          provider: flight.pr,
          price: {
            amount: flight.fF,
            currency: flight.cr,
            baseFare: flight.bF,
            tax: flight.tAS
          },
          segments: flight.sg.map(segment => ({
            baggage: segment.bg,
            cabinBaggage: segment.cBg,
            cabinClass: segment.cC,
            airline: {
              code: segment.al.alC,
              name: segment.al.alN,
              flightNumber: segment.al.fN ? segment.al.fN.trim() : '',
              fareClass: segment.al.fC
            },
            departure: {
              airport: {
                code: segment.or.aC,
                name: segment.or.aN,
                terminal: segment.or.tr || ''
              },
              city: {
                code: segment.or.cC,
                name: segment.or.cN
              },
              country: segment.or.cnN,
              time: segment.or.dT
            },
            arrival: {
              airport: {
                code: segment.ds.aC,
                name: segment.ds.aN,
                terminal: segment.ds.tr || ''
              },
              city: {
                code: segment.ds.cC,
                name: segment.ds.cN
              },
              country: segment.ds.cnN,
              time: segment.ds.aT
            },
            duration: segment.dr,
            groundTime: segment.gT || 0
          })),
          stopCount: flight.sC || 0,
          availableSeats: flight.sA,
          fareClass: flight.pFC,
          fareIdentifier: flight.fareIdentifier
        }));
        
        return res.json({
          success: true,
          provider: response.data.response.provider,
          data: {
            outboundFlights: mappedOutboundFlights,
            inboundFlights: mappedInboundFlights,
            pagination: {
              total: {
                outbound: mappedOutboundFlights.length,
                inbound: mappedInboundFlights.length
              },
              offset,
              limit,
              hasMore: false, // No pagination for now
              isRoundTrip: true,
              isDomestic: true
            },
            traceId: response.data.response.traceId,
            isRoundTrip: true,
            isDomestic: true
          }
        });
      }

      // Handle regular (non-domestic round trip) structure
      return res.json({
        success: true,
        provider: response.data.response.provider,
        data: response.data.response
      });
    } catch (error) {
      logger.error('Error in handleFlightSearch:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  allocatePassengers: async (req, res) => {
    const { provider = 'TC', bookingArray, itineraryCode } = req.body;

    try {
      // Validate required fields
      if (!bookingArray || !itineraryCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: bookingArray and itineraryCode are required'
        });
      }

      // Validate bookingArray structure
      if (!Array.isArray(bookingArray) || bookingArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'bookingArray must be a non-empty array'
        });
      }

      // Validate each booking in the array
      for (const booking of bookingArray) {
        if (!booking.traceId || !booking.passengers || !Array.isArray(booking.passengers)) {
          return res.status(400).json({
            success: false,
            message: 'Each booking must have traceId and passengers array'
          });
        }
      }

      // Get provider-specific services
      const tokenManager = getProviderService(provider, 'tokenManager');
      const authService = getProviderService(provider, 'authService');

      // Get auth token
      const authToken = await tokenManager.getOrSetToken(
        async () => {
          const authResponse = await authService.login();
          return authResponse.token;
        }
      );

      // Call passenger service to save passenger information
      const passengerResponse = await FlightPassengerService.savePassengers(
        itineraryCode,
        bookingArray,
        authToken
      );

      if (!passengerResponse || passengerResponse.error) {
        throw new Error(passengerResponse?.error?.message || 'Failed to save passenger information');
      }

      // Return success response
      res.json({
        success: true,
        provider: provider,
        data: passengerResponse
      });

    } catch (error) {
      logger.error(`Error allocating passengers with provider ${provider}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to allocate passengers'
      });
    }
  },

  recheckRate: async (req, res) => {
    const { provider = 'TC', traceId, itineraryCode } = req.body;

    try {
      // Validate required fields
      if (!traceId || !itineraryCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: traceId and itineraryCode are required'
        });
      }

      // Get provider-specific services
      const tokenManager = getProviderService(provider, 'tokenManager');
      const authService = getProviderService(provider, 'authService');
      const createItineraryService = getProviderService(provider, 'createItineraryService');

      // Get auth token
      const authToken = await tokenManager.getOrSetToken(
        async () => {
          const authResponse = await authService.login();
          return authResponse.token;
        }
      );

      // Get itinerary details with price recheck
      const itineraryDetails = await createItineraryService.getItineraryDetails(
        itineraryCode,
        traceId,
        authToken,
        true  // Set recheckPrice flag to true
      );

      if (!itineraryDetails.success) {
        throw new Error(itineraryDetails.error || "Failed to recheck rate");
      }

      res.json({
        success: true,
        provider: provider,
        data: itineraryDetails.data
      });

    } catch (error) {
      logger.error(`Error rechecking rate with provider ${req.body.provider || 'TC'}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to recheck rate"
      });
    }
  },

  getBookingDetails: async (req, res) => {
    const { provider = 'TC', bmsBookingCode } = req.params;

    try {
      // Validate required fields
      if (!bmsBookingCode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: bmsBookingCode'
        });
      }

      // Get provider-specific services
      const tokenManager = getProviderService(provider, 'tokenManager');
      const authService = getProviderService(provider, 'authService');

      // Get auth token
      const authToken = await tokenManager.getOrSetToken(
        async () => {
          const authResponse = await authService.login();
          return authResponse.token;
        }
      );

      // Get booking details - Call statically on the class
      const bookingResponse = await FlightBookingDetailsService.getBookingDetails({
        bmsBookingCode,
        token: authToken
      });

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.error || "Failed to get booking details");
      }

      res.json({
        success: true,
        provider: provider,
        data: bookingResponse.data
      });

    } catch (error) {
      logger.error(`Error getting booking details with provider ${req.params.provider || 'TC'}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get booking details"
      });
    }
  }
}; 