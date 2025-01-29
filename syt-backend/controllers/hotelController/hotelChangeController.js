const HotelTokenManager = require('../../services/tokenManagers/hotelTokenManager');
const HotelAuthService = require('../../services/hotelServices/hotelAuthService');
const HotelLocationService = require('../../services/hotelServices/hotelLocationService');
const HotelSearchService = require('../../services/hotelServices/hotelSearchService');
const HotelItineraryService = require('../../services/hotelServices/hotelItineraryService');
const HotelRoomRatesService = require('../../services/hotelServices/hotelRoomRatesService');
const ItineraryInquiry = require('../../models/ItineraryInquiry');
const Itinerary = require('../../models/Itinerary');

// Make sure all controller functions are exported
module.exports = {
  searchAvailableHotels: async (req, res) => {
    const { inquiryToken, cityName, checkIn, checkOut } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    try {
      // Get inquiry details
      const inquiry = await ItineraryInquiry.findOne({ 
        itineraryInquiryToken: inquiryToken 
      });
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      // Get auth token
      const authToken = await HotelTokenManager.getOrSetToken(
        async () => {
          const authResponse = await HotelAuthService.getAuthToken();
          return authResponse.token;
        }
      );

      // Search location
      const locationResponse = await HotelLocationService.searchLocation(
        cityName,
        authToken,
        inquiryToken,
        checkIn
      );

      const cityLocation = locationResponse.results?.find(
        location => location.type === "City" && 
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
        occupancies: inquiry.travelersDetails.rooms.map(room => ({
          numOfAdults: room.adults.length,
          childAges: room.children.map(age => parseInt(age)).filter(age => !isNaN(age))
        })),
        cityName,
        page,
        limit
      };

      // Search hotels
      const hotels = await HotelSearchService.searchHotels(
        searchParams,
        authToken,
        inquiryToken
      );


      res.json({
        success: true,
        data: {
          hotels: hotels.results[0].similarHotels,
          traceId: hotels.results[0].traceId, 
          pagination: {
            page,
            limit,
            total: hotels.results[0].totalCount,
            hasMore: hotels.results[0].similarHotels.length >= limit
          },
          dates: {
            checkIn,
            checkOut
          }
        }
      });

    } catch (error) {
      console.error("Error searching hotels:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Failed to search hotels"
      });
    }
  },

  // Add stubs for other required functions
  getHotelDetails: async (req, res) => {
    const { inquiryToken, hotelId } = req.params;
    const { traceId, cityName, checkIn } = req.query;

    try {
        // Get auth token
        const authToken = await HotelTokenManager.getOrSetToken(
          async () => {
            const authResponse = await HotelAuthService.getAuthToken();
            return authResponse.token;
          }
        );

        // Prepare params object to match the method signature
        const itineraryParams = {
            traceId: traceId,
            hotelId: hotelId,
            cityName: cityName,
            startDate: checkIn
        };

        // Fetch hotel details using HotelItineraryService
        const hotelDetails = await HotelItineraryService.createItinerarySequential(
          itineraryParams,        // Full params object 
            authToken,     // accessToken
            inquiryToken   // inquiryToken
        );

        res.json({
            success: true,
            data: hotelDetails
        });

    } catch (error) {
        console.error("Error fetching hotel details:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to fetch hotel details",
            details: error.details || {}
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
      date 
  } = req.body;

  try {
      // Get auth token
// 1. Get authentication token internally
const authToken = await HotelTokenManager.getOrSetToken(
  async () => {
    const authResponse = await HotelAuthService.getAuthToken();
    return authResponse.token;
  }
);

      // Select room rates
      const roomRatesResponse = await HotelRoomRatesService.selectRoomRates({
          roomsAndRateAllocations,
          recommendationId,
          items,
          itineraryCode,
          traceId,
          inquiryToken,
          cityName,
          date
      }, authToken);

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
            staticContent: [{
              id: staticContent?.id,
              contact: staticContent?.contact,
              descriptions: staticContent?.descriptions,
              images: staticContent?.images,
              facilities: staticContent?.facilities,
              // nearByAttractions: staticContent?.nearByAttractions
            }],
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
          details: error.details || {}
      });
  }
}
};

module.exports.getHotelRooms = async (req, res) => {
  const { inquiryToken, hotelId } = req.params;
  const { traceId, cityName, checkIn } = req.query;

  try {
    // Get auth token
    const authToken = await HotelTokenManager.getOrSetToken(
      async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      }
    );

    // Prepare params for itinerary creation
    const itineraryParams = {
      hotelId: hotelId,
      traceId: traceId,
      cityName: cityName,
      startDate: checkIn
    };

    // Get room details using HotelItineraryService
    const hotelDetails = await HotelItineraryService.createItinerarySequential(
      itineraryParams,
      authToken,
      inquiryToken
    );

    res.json({
      success: true,
      data: hotelDetails
    });

  } catch (error) {
    console.error("Error fetching hotel rooms:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch hotel rooms",
      details: error.details || {}
    });
  }
};