const HotelAuthService = require("../../services/hotelServices/hotelAuthService");
const HotelLocationService = require("../../services/hotelServices/hotelLocationService");
const HotelSearchService = require("../../services/hotelServices/hotelSearchService");
const HotelItineraryService = require("../../services/hotelServices/hotelItineraryService");
const HotelRoomRatesService = require("../../services/hotelServices/hotelRoomRatesService");

/**
 * Helper function to select appropriate room rates from itinerary response
 */

function selectRoomRates(itineraryResponse, travelersDetails) {
  if (!itineraryResponse?.results?.[0]) {
    throw new Error("Invalid itinerary response structure");
  }

  const result = itineraryResponse.results[0];
  const roomRate = result.data[0].roomRate[0];
  const { rates, recommendations } = roomRate;
  const hotelDetails = result.data[0];

  if (!recommendations || !rates) {
    throw new Error("No room rates available");
  }

  // Process each recommendation and calculate totals
  const recommendationTotals = Object.entries(recommendations).map(([recKey, recommendation]) => {
    let totalRate = 0;
    let isValidCombination = true;
    const rateDetails = [];

    // Calculate total rate for this recommendation
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
  }).filter(rec => rec !== null);

  // Sort recommendations by total rate
  recommendationTotals.sort((a, b) => a.totalRate - b.totalRate);

  let selectedRecommendation;

  // Select recommendation based on hotel star rating and category
  if (hotelDetails.starRating === "5" && hotelDetails.category === "Hotel") {
    // For 5-star hotels: Find almost lowest (not extreme low)
    const avgRate = recommendationTotals.reduce((sum, rec) => sum + rec.totalRate, 0) / recommendationTotals.length;
    selectedRecommendation = recommendationTotals.find(rec => rec.totalRate >= avgRate * 0.8);
  } 
  else if (hotelDetails.starRating === "4" && hotelDetails.category === "Hotel") {
    // For 4-star hotels: Find average
    const avgRate = recommendationTotals.reduce((sum, rec) => sum + rec.totalRate, 0) / recommendationTotals.length;
    selectedRecommendation = recommendationTotals.find(rec => 
      Math.abs(rec.totalRate - avgRate) === Math.min(...recommendationTotals.map(r => Math.abs(r.totalRate - avgRate)))
    );
  } 
  else if (hotelDetails.starRating === "3" && hotelDetails.category === "Hotel") {
    // For 3-star hotels: Find highest (not extreme)
    const avgRate = recommendationTotals.reduce((sum, rec) => sum + rec.totalRate, 0) / recommendationTotals.length;
    const maxRate = Math.max(...recommendationTotals.map(r => r.totalRate));
    selectedRecommendation = recommendationTotals.find(rec => 
      rec.totalRate >= avgRate && rec.totalRate <= maxRate * 0.9
    );
  } 
  else {
    // Default: Select middle option
    selectedRecommendation = recommendationTotals[Math.floor(recommendationTotals.length / 2)];
  }

  if (!selectedRecommendation) {
    throw new Error("No suitable rate combination found");
  }

  // Format room allocations for the selected recommendation
  const roomAllocations = selectedRecommendation.rates.map((rate, index) => ({
    rateId: rate.id,
    roomId: rate.occupancies[0].roomId,
    occupancy: {
      adults: travelersDetails.rooms[index].adults.length,
      ...(travelersDetails.rooms[index].children.length > 0 && {
        childAges: travelersDetails.rooms[index].children.map(child => parseInt(child.age))
      })
    }
  }));

  return {
    roomsAndRateAllocations: roomAllocations,
    traceId: result.traceIdDetails?.id,
    items: result.items,
    itineraryCode: result.itinerary?.code,
    recommendationId: selectedRecommendation.recommendationId
  };
}

/**
 * Helper function to format room occupancy for API request
 * Handles multiple rooms with their respective adults and children
 */
/**
 * Helper function to format room occupancy for API request
 * Handles multiple rooms with their respective adults and children
 */
function formatRoomOccupancy(rooms) {
  console.log('Input rooms data:', JSON.stringify(rooms, null, 2));
  
  return rooms.map(room => {
    // Basic room object with number of adults
    const roomObj = {
      numOfAdults: room.adults.length
    };

    // Only add childAges if there are children
    if (room.children && room.children.length > 0) {
      // Handle children ages directly since they're already strings/numbers
      const validAges = room.children
        .map(age => {
          const parsedAge = parseInt(age);
          return !isNaN(parsedAge) ? parsedAge : null;
        })
        .filter(age => age !== null);

      if (validAges.length > 0) {
        roomObj.childAges = validAges;
      }
    }

    console.log('Processed room:', JSON.stringify(roomObj, null, 2));
    return roomObj;
  });
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
    else if (budget === "Somewhere In-between") {
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
 * Helper function to get hotel ratings based on budget preference
 */
function getHotelRatings(budget) {
  switch (budget) {
    case "Luxury":
      return [4, 5];
    case "Somewhere In-between":
      return [3, 4];
    case "Pocket Friendly":
      return [3];
    default:
      return [3, 4, 5];
  }
}

/**
 * Main controller function to handle hotel bookings
 */
module.exports = {
  getHotels: async (requestData) => {
    try {
      const {
        city,
        country,
        startDate,
        endDate,
        travelersDetails,
        preferences,
        inquiryToken,
      } = requestData;

      // Get auth token
      const authToken = await HotelAuthService.getAuthToken(inquiryToken);

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

      // Log search parameters before making the request
      console.log('Hotel Search Parameters:', JSON.stringify({
        ...searchParams,
        authToken: authToken ? '***' : null,
        inquiryToken
      }, null, 2));

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

      // Select and format room rates
      const rateSelection = selectRoomRates(itineraryResponse, travelersDetails);

      // Get room rates
      const roomRatesResponse = await HotelRoomRatesService.selectRoomRates(
        {
          ...rateSelection,
          inquiryToken,
          cityName: city,
          date: startDate,
        },
        authToken
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

      // Extract necessary details and simplify response
      const result = itineraryDetails?.results?.[0];
      const staticContent = result?.staticContent?.[0];

      return {
        success: true,
        data: {
          ...result,
          staticContent: [{
            id: staticContent?.id,
            name: staticContent?.name,
            starRating: staticContent?.starRating,
            contact: staticContent?.contact,
            geoCode: staticContent?.geoCode,
            descriptions: staticContent?.descriptions,
            facilities: staticContent?.facilities,
            images: staticContent?.images,
            nearByAttractions: staticContent?.nearByAttractions,
            reviews: staticContent?.reviews
          }],
          hotelDetails: {
            name: staticContent?.name,
            starRating: staticContent?.starRating,
            location: staticContent?.contact?.address,
            reviews: staticContent?.reviews,
            geolocation: staticContent?.geoCode,
            address: staticContent?.contact?.address,
          },
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
};