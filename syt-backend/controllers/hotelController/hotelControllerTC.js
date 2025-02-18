const HotelLocationService = require('../../services/hotelServices/hotelLocationService');
const HotelSearchService = require('../../services/hotelServices/hotelSearchService');
const HotelItineraryService = require('../../services/hotelServices/hotelItineraryService');
const HotelRoomRatesService = require('../../services/hotelServices/hotelRoomRatesService');
const  HotelTokenManager = require('../../services/tokenManagers/hotelTokenManager');
const HotelAuthService = require('../../services/hotelServices/hotelAuthService');
const HotelBookingService = require('../../services/hotelServices/hotelBookingService');
const HotelBookingDetailsService = require("../../services/hotelServices/hotelBookingDetailsService")
/**
 * Helper function to format room occupancy for API request
 */
function formatRoomOccupancy(rooms) {
  return rooms.map(room => ({
    numOfAdults: room.adults.length,
    ...(room.children?.length > 0 && {
      childAges: room.children
        .map(age => parseInt(age))
        .filter(age => !isNaN(age))
    })
  }));
}

/**
 * Helper function to get hotel ratings based on budget preference
 */
function getHotelRatings(budget) {
  switch (budget) {
    case "Luxury":
      return [4, 5];
    case "Somewhere In-Between":
      return [3, 4];
    case "Pocket Friendly":
      return [3];
    default:
      return [3, 4, 5];
  }
}

/**
 * Helper function to select the best hotel based on budget and criteria
 */
function selectBestHotel(hotels, budget) {
  const availableHotels = hotels.filter((h) => h.isAvailable);
  if (!availableHotels.length) return null;

  const scoreHotel = (hotel, budget) => {
    let score = 0;
    const starRating = parseInt(hotel.starRating) || 0;
    const reviewRating = parseFloat(hotel?.reviews?.[0]?.rating) || 0;
    const reviewCount = parseInt(hotel?.reviews?.[0]?.count) || 0;
    const price = hotel.availability?.rate?.finalRate || 0;

    score += reviewRating * 10;
    score += Math.min(reviewCount / 20, 25);

    if (budget === "Luxury") {
      if (starRating === 5) score += 30;
      else if (starRating === 4) score += 15;

      const avgPrice = availableHotels.reduce(
        (sum, h) => sum + (h.availability?.rate?.finalRate || 0), 0
      ) / availableHotels.length;
      
      if (price < avgPrice * 1.5 && price > avgPrice * 0.8) score += 20;
    } 
    else if (budget === "Somewhere In-Between") {
      if (starRating === 4) score += 30;
      else if (starRating === 3) score += 20;

      const avgPrice = availableHotels.reduce(
        (sum, h) => sum + (h.availability?.rate?.finalRate || 0), 0
      ) / availableHotels.length;
      
      if (price < avgPrice) score += 25;
    } 
    else if (budget === "Pocket Friendly") {
      if (starRating === 3 && reviewRating >= 4) score += 30;

      const avgPrice = availableHotels.reduce(
        (sum, h) => sum + (h.availability?.rate?.finalRate || 0), 0
      ) / availableHotels.length;
      
      if (price < avgPrice * 0.8) score += 35;
    }

    if (hotel.reviews?.[0]?.categoryratings) {
      const categories = hotel.reviews[0].categoryratings;
      const cleanliness = parseFloat(
        categories.find((c) => c.category === "cleanliness")?.rating
      ) || 0;
      const service = parseFloat(
        categories.find((c) => c.category === "service")?.rating
      ) || 0;
      score += (cleanliness + service) * 2;
    }

    return score;
  };

  const scoredHotels = availableHotels.map((hotel) => ({
    ...hotel,
    score: scoreHotel(hotel, budget),
  }));

  scoredHotels.sort((a, b) => b.score - a.score);
  return scoredHotels[0];
}

/**
 * Helper function to process recommendations and calculate totals
 */
function processRecommendations(itineraryResponse) {
  if (!itineraryResponse?.results?.[0]) {
    throw new Error("Invalid itinerary response structure");
  }

  const result = itineraryResponse.results[0];
  const roomRate = result.data[0].roomRate[0];
  const { rates, recommendations } = roomRate;

  if (!recommendations || !rates) {
    throw new Error("No room rates available");
  }

  // Process recommendations and calculate totals
  return Object.entries(recommendations)
    .map(([recKey, recommendation]) => {
      let totalRate = 0;
      let isValidCombination = true;
      const rateDetails = [];

      for (const rateId of recommendation.rates) {
        const rate = rates[rateId];
        if (!rate) {
          isValidCombination = false;
          break;
        }
        totalRate += rate.finalRate;
        rateDetails.push(rate);
      }

      if (!isValidCombination) return null;

      return {
        recommendationId: recommendation.id,
        rates: rateDetails,
        totalRate: totalRate
      };
    })
    .filter(rec => rec !== null)
    .sort((a, b) => a.totalRate - b.totalRate);
}

/**
 * Helper function to select room rates with retry logic
 */
async function selectRoomRatesWithRetry(itineraryResponse, travelersDetails, params) {
  const MAX_ROOM_RATE_RETRIES = 5;
  const MAX_HOTEL_ATTEMPTS = 3;
  const RETRY_DELAY = 1000; // 1 second
  let hotelAttempts = 0;
  let lastError = null;
  
  while (hotelAttempts < MAX_HOTEL_ATTEMPTS) {
    try {
      const recommendationTotals = processRecommendations(itineraryResponse);
      let roomRateAttempts = 0;
      
      for (const recommendation of recommendationTotals) {
        while (roomRateAttempts < MAX_ROOM_RATE_RETRIES) {
          try {
            roomRateAttempts++;
            
            // Format room allocations
            const roomAllocations = recommendation.rates.map((rate, index) => ({
              rateId: rate.id,
              roomId: rate.occupancies[0].roomId,
              occupancy: {
                adults: travelersDetails.rooms[index].adults.length,
                ...(travelersDetails.rooms[index].children?.length > 0 && {
                  childAges: travelersDetails.rooms[index].children
                    .map(age => parseInt(age))
                    .filter(age => !isNaN(age))
                })
              }
            }));

            const rateSelection = {
              roomsAndRateAllocations: roomAllocations,
              traceId: itineraryResponse.results[0].traceIdDetails?.id,
              items: itineraryResponse.results[0].items,
              itineraryCode: itineraryResponse.results[0].itinerary?.code,
              recommendationId: recommendation.recommendationId,
              inquiryToken: params.inquiryToken,
              cityName: params.cityName,
              date: params.startDate
            };

            const response = await HotelRoomRatesService.selectRoomRates(
              rateSelection,
              params.authToken
            );

            if (response.success) {
              return { 
                success: true,
                rateSelection,
                roomRatesResponse: response 
              };
            }

          } catch (error) {
            lastError = error;
            console.log(`Room rate attempt ${roomRateAttempts} failed:`, error.message);

            if (roomRateAttempts >= MAX_ROOM_RATE_RETRIES) {
              console.log('Max room rate retries reached, trying with a different hotel');
              break;
            }

            // Add delay between retries
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }

      // If we get here, all room rate attempts failed for current hotel
      hotelAttempts++;
      
      if (hotelAttempts >= MAX_HOTEL_ATTEMPTS) {
        throw new Error('All hotel attempts exhausted');
      }

      // Try with a different hotel
      console.log(`Trying with a different hotel. Attempt ${hotelAttempts + 1}/${MAX_HOTEL_ATTEMPTS}`);
      
      // Get a new hotel and create new itinerary
      const newHotel = searchResponse.results[0].similarHotels[hotelAttempts];
      if (!newHotel) {
        throw new Error('No more hotels available to try');
      }

      const newItineraryParams = {
        hotelId: newHotel.id,
        traceId: searchResponse?.results?.[0]?.traceIdDetails?.id,
        cityName: params.cityName,
        startDate: params.startDate
      };

      itineraryResponse = await HotelItineraryService.createItinerarySequential(
        newItineraryParams,
        params.authToken,
        params.inquiryToken
      );

    } catch (error) {
      lastError = error;
      if (hotelAttempts >= MAX_HOTEL_ATTEMPTS) {
        throw {
          message: "All hotel attempts failed",
          attempts: hotelAttempts,
          lastError
        };
      }
    }
  }

  throw {
    message: "All room rate selection attempts failed",
    attempts: hotelAttempts,
    lastError
  };
}

// preFetching token

const prefetchToken = async () => {
  try {
    const authToken = await HotelTokenManager.getOrSetToken(
      async () => {
        const authResponse = await HotelAuthService.getAuthToken();
        return authResponse.token;
      }
    );
    return authToken;
  } catch (error) {
    console.error("Error prefetching hotel token:", error);
    throw error;
  }
};

/**
 * Main controller function to handle hotel bookings
 */
module.exports = {
  prefetchToken,
  getHotels: async (requestData) => {
    try {
      const {
        city,
        country,
        startDate,
        endDate,
        travelersDetails,
        preferences,
        inquiryToken
      } = requestData;

      const authToken = await HotelTokenManager.getOrSetToken(
        async () => {
          const authResponse = await HotelAuthService.getAuthToken();
          return authResponse.token;
        }
      );
  
      if (!authToken) {
        throw new Error("Hotel authentication failed");
      }
  
      // Search for location
      const locationResponse = await HotelLocationService.searchLocation(
        city,
        authToken,
        inquiryToken,
        startDate
      );

      if (!locationResponse?.results?.length) {
        throw new Error("Location not found");
      }

      const cityLocation = locationResponse.results.find(
        (location) =>
          location.type === "City" &&
          location.name.toLowerCase() === city.toLowerCase()
      );

      if (!cityLocation) {
        throw new Error("City not found in location results");
      }

      const location = {
        id: cityLocation.id,
        name: cityLocation.name,
        coordinates: cityLocation.coordinates,
      };

      // Prepare search parameters
      const searchParams = {
        locationId: location.id,
        checkIn: new Date(startDate).toISOString().split("T")[0],
        checkOut: new Date(endDate).toISOString().split("T")[0],
        occupancies: formatRoomOccupancy(travelersDetails.rooms),
        cityName: city,
        ratings: getHotelRatings(preferences?.budget),
      };

      // Search for hotels
      const searchResponse = await HotelSearchService.searchHotels(
        searchParams,
        authToken,
        inquiryToken
      );

      if (!searchResponse?.results?.length) {
        throw new Error("No hotels found");
      }

      // Select best matching hotel
      const selectedHotel = selectBestHotel(
        searchResponse.results[0].similarHotels,
        preferences?.budget
      );

      if (!selectedHotel) {
        throw new Error("No suitable hotel found matching criteria");
      }

      const traceId = searchResponse?.results?.[0]?.traceIdDetails?.id;

      // Create itinerary with selected hotel
      const itineraryParams = {
        hotelId: selectedHotel.id,
        traceId: traceId,
        cityName: city,
        startDate
      };

      const itineraryResponse = await HotelItineraryService.createItinerarySequential(
        itineraryParams,
        authToken,
        inquiryToken
      );

      // Try to select room rates with retry logic
      const { rateSelection, roomRatesResponse } = await selectRoomRatesWithRetry(
        itineraryResponse, 
        travelersDetails,
        {
          authToken,
          inquiryToken,
          cityName: city,
          startDate
        }
      );

      // Get final itinerary details
      const itineraryDetails = await HotelItineraryService.getItineraryDetails(
        rateSelection.itineraryCode,
        rateSelection.traceId,
        authToken,
        inquiryToken,
        city,
        startDate
      );

      // Format and return response
      const result = itineraryDetails?.results?.[0];
      const staticContent = result?.staticContent?.[0];

      return {
        success: true,
        data: {
          ...result,
          staticContent: [{
            id: staticContent?.id,
            contact: staticContent?.contact,
            descriptions: staticContent?.descriptions,
            images: staticContent?.images,
            facilities: staticContent?.facilities,
          }],
          hotelDetails: {
            name: staticContent?.name,
            starRating: staticContent?.starRating,
            geolocation: staticContent?.geoCode,
            reviews: staticContent?.reviews,
            address: staticContent?.contact?.address,
          },
          bookingStatus: 'pending' // Added this line
        },
      };

    } catch (error) {
      console.error("Error in getHotels:", {
        message: error.message,
        details: error.response?.data || {},
        stack: error.stack,
      });

      return {
        success: false,
        error: "Hotel booking failed",
        details: error.message,
      };
    }
  },
  
  bookHotel: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const hotelData = req.body.hotel;
  
      if (!hotelData) {
        return res.status(400).json({
          success: false,
          error: 'Hotel data is required',
          data: null
        });
      }
  
      // Validate booking ID match
      if (bookingId !== hotelData.bookingId) {
        return res.status(400).json({
          success: false,
          error: 'Booking ID mismatch',
          data: null
        });
      }
  
      // Get authentication token
      const authToken = await HotelTokenManager.getOrSetToken(
        async () => {
          const authResponse = await HotelAuthService.getAuthToken();
          return authResponse.token;
        }
      );
  
      if (!authToken) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          data: null
        });
      }
  
      // Prepare booking parameters
      const bookingParams = {
        ...hotelData,
        token: authToken
      };
  
      // Validate booking data
      try {
        await HotelBookingService.validateBookingData(bookingParams);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.message,
          data: null
        });
      }
  
      // Book hotel
      const bookingResponse = await HotelBookingService.bookHotel(bookingParams);
  
      // Return complete response maintaining the success flag
      res.status(200).json({
        success: bookingResponse.success,
        data: bookingResponse.data,
        error: bookingResponse.error
      });
  
    } catch (error) {
      console.error('Error in bookHotel:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        data: error.response?.data || error // Include complete error response
      });
    }
  },
  getHotelBookingDetails: async (req, res) => {
    try {
      const { bookingCode } = req.params;
      const { inquiryToken, date, city } = req.body;
  
      if (!bookingCode) {
        throw new Error('Booking code is required');
      }
  
      const authToken = await HotelTokenManager.getOrSetToken(
        async () => {
          const authResponse = await HotelAuthService.getAuthToken();
          return authResponse.token;
        }
      );
  
      if (!authToken) {
        throw new Error('Authentication failed');
      }
  
      const response = await HotelBookingDetailsService.getBookingDetails({
        bookingCode,
        token: authToken,
        inquiryToken,
        date,
        city
      });
  
      res.status(200).json(response);
  
    } catch (error) {
      console.error('Error in getHotelBookingDetails:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        data: error.response?.data || error
      });
    }
  }
};