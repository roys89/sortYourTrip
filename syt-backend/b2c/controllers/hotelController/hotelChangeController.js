const HotelTokenManager = require("../../../shared/services/tokenManagersTC/hotelTokenManager");
const HotelAuthService = require("../../../shared/services/hotelServicesTC/hotelAuthService");
const HotelLocationService = require("../../../shared/services/hotelServicesTC/hotelLocationService");
const HotelSearchService = require("../../../shared/services/hotelServicesTC/hotelSearchService");
const HotelItineraryService = require("../../../shared/services/hotelServicesTC/hotelItineraryService");
const HotelRoomRatesService = require("../../../shared/services/hotelServicesTC/hotelRoomRatesService");
const ItineraryInquiry = require("../../models/ItineraryInquiry");
const Itinerary = require("../../models/Itinerary");
const logger = require('../../utils/logger');

// Helper function to safely extract amenities from various data formats
const extractAmenities = (hotel) => {
  const facilities = hotel.facilities;
  
  if (typeof facilities === 'string') {
    // If it's a string, split by semicolon
    return facilities.split(';').map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(facilities)) {
    // If it's already an array, use it directly
    return facilities.map(f => 
      typeof f === 'string' ? f.trim() : 
      (f && f.name ? f.name.trim() : String(f))
    ).filter(Boolean);
  } else if (facilities && typeof facilities === 'object') {
    // If it's an object with amenities/facilities data
    if (facilities.amenities && Array.isArray(facilities.amenities)) {
      return facilities.amenities.map(a => 
        typeof a === 'string' ? a.trim() : 
        (a && a.name ? a.name.trim() : String(a))
      ).filter(Boolean);
    }
  }
  
  // Default to empty array if no valid facilities found
  return [];
};

module.exports = {
  searchAvailableHotels: async (req, res) => {
    const { inquiryToken, cityName, checkIn, checkOut } = req.params;
    
    // Changed to load 100 hotels per page
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Default to 100 hotels per page

    try {
      // Get inquiry details
      const inquiry = await ItineraryInquiry.findOne({
        itineraryInquiryToken: inquiryToken,
      });
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Search location
      const locationResponse = await HotelLocationService.searchLocation(
        cityName,
        authToken,
        inquiryToken,
        checkIn
      );

      const cityLocation = locationResponse.results?.find(
        (location) =>
          location.type === "City" &&
          location.name.toLowerCase() === cityName.toLowerCase()
      );

      if (!cityLocation) {
        throw new Error("City not found in location results");
      }

      // Use provided check-in/out dates directly
      const searchParams = {
        locationId: cityLocation.id,
        checkIn,
        checkOut,
        occupancies: inquiry.travelersDetails.rooms.map((room) => ({
          numOfAdults: room.adults.length,
          childAges: room.children
            .map((age) => parseInt(age))
            .filter((age) => !isNaN(age)),
        })),
        cityName,
        page,
        limit, // Setting to 100 per page
      };

      // Search hotels
      const hotels = await HotelSearchService.searchHotels(
        searchParams,
        authToken,
        inquiryToken
      );

      logger.info(`Retrieved ${hotels.results[0].data.length} hotels for page ${page}`);

      // Get all hotel data
      const allHotels = hotels.results[0].data || [];
      const totalHotels = hotels.results[0].totalCount || allHotels.length;
      
      // Calculate price ranges from ALL hotels
      const allPrices = allHotels
        .map(h => h.rates?.[0]?.price || 0)
        .filter(price => price > 0);
      
      const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
      const maxPrice = allPrices.length ? Math.max(...allPrices) : 10000;
      
      // Get all available amenities for filter options
      const allAmenities = [...new Set(
        allHotels.flatMap(hotel => extractAmenities(hotel))
      )].slice(0, 10); // Limit to top 10 amenities
      
      // Get all property types from hotels
      const allPropertyTypes = [...new Set(
        allHotels
          .map(h => h.accommodationType || 'Hotel')
          .filter(Boolean)
      )];

      res.json({
        success: true,
        data: {
          hotels: allHotels,
          traceId: hotels.results[0].traceId,
          pagination: {
            page,
            limit,
            total: totalHotels,
            hasMore: page * limit < totalHotels,
          },
          dates: {
            checkIn,
            checkOut,
          },
          priceRange: {
            min: minPrice,
            max: maxPrice
          },
          availableFilters: {
            amenities: allAmenities,
            propertyTypes: allPropertyTypes
          }
        },
      });
    } catch (error) {
      console.error("Error searching hotels:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Failed to search hotels",
      });
    }
  },

  // Other functions remain the same
  getHotelDetails: async (req, res) => {
    const { inquiryToken, hotelId } = req.params;
    const { traceId, cityName, checkIn } = req.query;

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Prepare params object to match the method signature
      const itineraryParams = {
        traceId: traceId,
        hotelId: hotelId,
        cityName: cityName,
        startDate: checkIn,
      };

      // Fetch hotel details using HotelItineraryService
      const hotelDetails =
        await HotelItineraryService.createItinerarySequential(
          itineraryParams, // Full params object
          authToken, // accessToken
          inquiryToken // inquiryToken
        );

      res.json({
        success: true,
        data: hotelDetails,
      });
    } catch (error) {
      console.error("Error fetching hotel details:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hotel details",
        details: error.details || {},
      });
    }
  },

  selectHotelRoom: async (req, res) => {
    const { inquiryToken, hotelId } = req.params;
    const {
      roomsAndRateAllocations,
      recommendationId,
      items,
      itineraryCode,
      traceId,
      cityName,
      date,
    } = req.body;

    try {
      // Get auth token
      // 1. Get authentication token internally
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Select room rates
      const roomRatesResponse = await HotelRoomRatesService.selectRoomRates(
        {
          roomsAndRateAllocations,
          recommendationId,
          items,
          itineraryCode,
          traceId,
          inquiryToken,
          cityName,
          date,
        },
        authToken
      );

      // Get updated itinerary details
      const itineraryDetails = await HotelItineraryService.getItineraryDetails(
        itineraryCode,
        traceId,
        authToken,
        inquiryToken,
        cityName,
        date
      );

      // Format response
      const result = itineraryDetails?.results?.[0];
      const staticContent = result?.staticContent?.[0];

      res.json({
        success: true,
        data: {
          ...result,
          staticContent: [
            {
              id: staticContent?.id,
              contact: staticContent?.contact,
              descriptions: staticContent?.descriptions,
              images: staticContent?.images,
              facilities: staticContent?.facilities,
            },
          ],
          bookingStatus: "pending",
          hotelDetails: {
            name: staticContent?.name,
            starRating: staticContent?.starRating,
            reviews: staticContent?.reviews,
            geolocation: staticContent?.geoCode,
            address: staticContent?.contact?.address,
          },
        },
      });
    } catch (error) {
      console.error("Error selecting hotel room:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to select hotel room",
        details: error.details || {},
      });
    }
  },

  getHotelRooms: async (req, res) => {
    const { inquiryToken, hotelId } = req.params;
    const { traceId, cityName, checkIn } = req.query;

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      });

      // Prepare params for itinerary creation
      const itineraryParams = {
        hotelId: hotelId,
        traceId: traceId,
        cityName: cityName,
        startDate: checkIn,
      };

      // Get room details using HotelItineraryService
      const hotelDetails = await HotelItineraryService.createItinerarySequential(
        itineraryParams,
        authToken,
        inquiryToken
      );

      res.json({
        success: true,
        data: hotelDetails,
      });
    } catch (error) {
      console.error("Error fetching hotel rooms:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hotel rooms",
        details: error.details || {},
      });
    }
  },

  getItineraryDetails: async (req, res) => {
    const { itineraryToken } = req.params;
    const { 
      itineraryCode,
      traceId,
      hotelId,
      cityName,
      date,
      inquiryToken 
    } = req.body;

    try {
      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(
        async () => {
          const authResponse = await HotelAuthService.getAuthToken();
          return authResponse.token;
        }
      );

      // Get itinerary details using HotelItineraryService
      const itineraryDetails = await HotelItineraryService.getItineraryDetails(
        itineraryCode,
        traceId,
        authToken,
        inquiryToken,
        cityName,
        date
      );

      // Format and validate the response
      const result = itineraryDetails?.results?.[0];
      if (!result) {
        throw new Error('No itinerary details found');
      }

      // Extract remaining time from trace ID details if available
      const traceIdDetails = result.traceIdDetails || [];
      const remainingTime = traceIdDetails.length > 0 ? traceIdDetails[0].remainingTime : null;

      res.json({
        success: true,
        results: [{
          ...result
        }]
      });

    } catch (error) {
      console.error("Error fetching hotel itinerary details:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch hotel itinerary details",
        details: error.details || {}
      });
    }
  }
};