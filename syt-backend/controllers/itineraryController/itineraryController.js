const Itinerary = require("../../models/Itinerary");
const ItineraryInquiry = require("../../models/ItineraryInquiry");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const apiLogger = require("../../helpers/apiLogger");
const { getCityActivities } = require("./activityControllerGRNC");
const ActivityDestination = require("../../models/itineraryModel/ActivityDestination");
const { getHotels } = require("./hotelControllerTC");
const { getGroundTransfer } = require("./transferControllerLA");
const { getFlights } = require("./flightControllerTC");
const HotelTokenManager = require('../../services/tokenManagers/hotelTokenManager');
const HotelAuthService = require('../../services/hotelServices/hotelAuthService');
const TransferOrchestrationService = require('../../services/transferServices/transferOrchestrationService');

// Helper function to calculate days between dates
const getDifferenceInDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const difference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return difference;
};

// Helper function to making address of the hotel for transfers
function formatAddressToSingleLine(addressObj) {
  if (!addressObj) return null;

  const parts = [
    addressObj.line1,
    addressObj.city?.name,
    addressObj.country?.name,
    addressObj.postalCode ? `Postal Code ${addressObj.postalCode}` : null
  ];

  return parts.filter(Boolean).join(', ');
}

// Helper function to distribute days across cities
const distributeDaysAcrossCities = (startDate, endDate, selectedCities) => {
  const totalDays = getDifferenceInDays(startDate, endDate) + 1;
  const baseDaysPerCity = Math.floor(totalDays / selectedCities.length);
  let remainingDays = totalDays % selectedCities.length;

  const cityDayDistribution = [];
  let currentDate = new Date(startDate);

  for (const city of selectedCities) {
    const cityStartDate = new Date(currentDate);
    const daysForThisCity = baseDaysPerCity + (remainingDays > 0 ? 1 : 0);
    const cityEndDate = new Date(cityStartDate);
    cityEndDate.setDate(cityEndDate.getDate() + daysForThisCity - 1);

    console.log(
      `City: ${city.city}, Start Date: ${
        cityStartDate.toISOString().split("T")[0]
      }, End Date: ${cityEndDate.toISOString().split("T")[0]}`
    );

    cityDayDistribution.push({
      city,
      startDate: cityStartDate,
      endDate: cityEndDate,
    });

    currentDate.setDate(currentDate.getDate() + daysForThisCity);
    remainingDays--;
  }

  return cityDayDistribution;
};

// Helper function to validate and format location data
const formatLocationForTransfer = (location, type) => {
  if (!location?.latitude || !location?.longitude) {
    throw new Error(`Missing geolocation data for ${type}`);
  }

  return {
    city: location.city,
    country: location.country,
    address: location.address,
    latitude: parseFloat(location.latitude),
    longitude: parseFloat(location.longitude),
  };
};

// Ensure directory exists and save file
const ensureDirectoryExistsAndSave = (filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(
      `Error creating directories or saving file for ${filePath}: ${error.message}`
    );
  }
};

// Process activities for a specific day
const processActivitiesForDay = async (
  city,
  inquiry,
  formattedDate,
  travelers,
  inquiryToken,
  cityActivitiesTracker
) => {
  try {
    const destinationData = await ActivityDestination.findOne({
      destination_id: city.destination_id,
    });

    if (!destinationData) {
      console.error(
        `Destination not found for destination_id: ${city.destination_id}`
      );
      return {
        date: formattedDate,
        activities: [],
        error: "Destination not found",
      };
    }

    const destination_code = destinationData.destination_code;

    if (!cityActivitiesTracker[destination_code]) {
      cityActivitiesTracker[destination_code] = new Set();
    }

    // Add isFirstDay calculation here
    const isFirstDay =
      new Date(formattedDate).getTime() === new Date(city.startDate).getTime();

    const requestData = {
      body: {
        city: {
          code: destination_code,
          name: destinationData.name,
          country: destinationData.country,
          continent: destinationData.continent,
        },
        userPreferences: inquiry.preferences,
        itineraryDates: {
          fromDate: formattedDate,
          toDate: formattedDate,
        },
        travelers,
        inquiryToken,
        excludedActivityCodes: Array.from(
          cityActivitiesTracker[destination_code]
        ),
        day: {
          isFirstDay, // Pass only first day flag
        },
      },
    };

    const activityResponse = await getCityActivities(requestData);

    if (!activityResponse || !Array.isArray(activityResponse)) {
      return {
        date: formattedDate,
        activities: [],
        error: "No activities available",
      };
    }

    // Track selected activities
    activityResponse.forEach((activity) => {
      if (activity.activityCode) {
        cityActivitiesTracker[destination_code].add(activity.activityCode);
      }
    });

    return {
      date: formattedDate,
      activities: activityResponse,
    };
  } catch (error) {
    console.error(
      `Error processing activities for ${city.city} on ${formattedDate}:`,
      error
    );
    return {
      date: formattedDate,
      activities: [],
      error: error.message,
    };
  }
};



// Helper function to process flights and hotels concurrently

const processFlightsAndHotels = async (inquiry, cityDayDistribution, authToken) => {
  try {
    // Get departure and return flights concurrently
    const [departureFlights, returnFlights] = await Promise.all([
      getFlights({
        inquiryToken: inquiry.itineraryInquiryToken,
        departureCity: inquiry.departureCity,
        cities: [inquiry.selectedCities[0]],
        travelers: inquiry.travelersDetails,
        departureDates: {
          startDate: inquiry.departureDates.startDate,
          endDate: inquiry.departureDates.startDate,
        },
        includeDetailedLandingInfo: true,
        type: "departure_flight",
      }),
      getFlights({
        inquiryToken: inquiry.itineraryInquiryToken,
        departureCity: inquiry.selectedCities[inquiry.selectedCities.length - 1],
        cities: [inquiry.departureCity],
        travelers: inquiry.travelersDetails,
        departureDates: {
          startDate: inquiry.departureDates.endDate,
          endDate: inquiry.departureDates.endDate,
        },
        includeDetailedLandingInfo: true,
        type: "return_flight",
      })
    ]);

    // Process hotels for all cities concurrently using same token
    const hotelPromises = cityDayDistribution.map(async ({ city, startDate, endDate }, index) => {
      const extendedCheckoutDate = new Date(endDate);
      extendedCheckoutDate.setDate(extendedCheckoutDate.getDate() + 1);

      console.log(`Getting hotel for city ${index + 1}/${cityDayDistribution.length}: ${city.city}`);

      const hotelResponse = await getHotels({
        city: city.city,
        country: city.country,
        startDate: startDate,
        endDate: extendedCheckoutDate,
        travelersDetails: inquiry.travelersDetails,
        preferences: inquiry.preferences,
        inquiryToken: inquiry.itineraryInquiryToken,
        authToken // Pass the cached token
      });

      return hotelResponse;
    });

    const hotelResponses = await Promise.all(hotelPromises);

    return {
      departureFlights,
      returnFlights,
      hotelResponses
    };
  } catch (error) {
    console.error('Error in processFlightsAndHotels:', error);
    throw error;
  }
};


// Main itinerary creation controller
exports.createItinerary = async (req, res) => {
  try {
    const { inquiryToken } = req.params;
    const inquiry = await ItineraryInquiry.findOne({
      itineraryInquiryToken: inquiryToken,
    });

    if (!inquiry) {
      return res.status(404).json({ message: "Itinerary inquiry not found" });
    }

    const itineraryToken = uuidv4();

    // Get and cache auth token for the entire flow
    const authToken = await HotelTokenManager.getOrSetToken(
      inquiryToken,
      async () => await HotelAuthService.getAuthToken(inquiryToken)
    );

    // Step 1: Distribute days across cities
    const cityDayDistribution = distributeDaysAcrossCities(
      inquiry.departureDates.startDate,
      inquiry.departureDates.endDate,
      inquiry.selectedCities
    );

    // Step 2: Get flights and hotels concurrently using same token
    console.log("Getting flights and hotels concurrently...");
    const { departureFlights, returnFlights, hotelResponses } = 
      await processFlightsAndHotels(inquiry, cityDayDistribution, authToken);

    // Step 3: Process and create initial structure
    const itineraryDaysByCity = [];
    const cityActivitiesTracker = {};

    // Process activities for all cities
    const processedCities = await Promise.all(cityDayDistribution.map(async (cityData, index) => {
      const { city, startDate, endDate } = cityData;
      const hotelResponse = hotelResponses[index];

      const cityDetails = {
        city: city.city,
        cityCode: city.code,
        country: city.country,
        startDate,
        endDate,
        days: [],
      };

      const daysForThisCity = getDifferenceInDays(startDate, endDate) + 1;

      // Process all days for current city concurrently
      const processedDays = await Promise.all(Array.from({ length: daysForThisCity }, async (_, dayOffset) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);
        const formattedDate = currentDate.toISOString().split("T")[0];

        const isFirstDay = dayOffset === 0;
        const isLastDay = dayOffset === daysForThisCity - 1;

        // Get activities for the day
        const dayActivities = await processActivitiesForDay(
          city,
          inquiry,
          formattedDate,
          {
            adults: inquiry.travelersDetails.rooms.map(room => room.adults).flat(),
            childAges: inquiry.travelersDetails.rooms.map(room => room.children).flat(),
          },
          inquiryToken,
          cityActivitiesTracker
        );

        const dayObject = {
          date: formattedDate,
          flights: [],
          hotels: isFirstDay ? [{
            ...hotelResponse,
            checkIn: startDate.toISOString().split("T")[0],
            checkOut: new Date(endDate.getTime() + 24*60*60*1000).toISOString().split("T")[0],
          }] : [],
          activities: dayActivities.activities || [],
          transfers: [],
        };

        // Add departure flight and transfer for first city's first day
        if (index === 0 && isFirstDay && departureFlights[0]) {
          dayObject.flights.push({ flightData: departureFlights[0] });
        }

        // Add return flight for last city's last day
        if (index === cityDayDistribution.length - 1 && isLastDay && returnFlights[0]) {
          dayObject.flights.push({ flightData: returnFlights[0] });
        }

        return dayObject;
      }));

      cityDetails.days = processedDays;
      return cityDetails;
    }));

    itineraryDaysByCity.push(...processedCities);

    // Step 4: Orchestrate Transfers for Entire Itinerary
    const itineraryWithTransfers = await orchestrateTransfersForItinerary({
      itineraryDaysByCity,
      inquiry,
      departureFlights,
      returnFlights,
      hotelResponses,
      inquiryToken
    });

    // Step 5: Create and save the itinerary
    const itinerary = new Itinerary({
      itineraryToken,
      inquiryToken: inquiry.itineraryInquiryToken,
      userInfo: inquiry.userInfo,
      travelersDetails: inquiry.travelersDetails,
      cities: itineraryWithTransfers,
    });

    console.log("Saving itinerary...");
    const savedItinerary = await itinerary.save();

    const formattedResponse = {
      itineraryToken: savedItinerary.itineraryToken,
      inquiryToken: savedItinerary.inquiryToken,
      userInfo: savedItinerary.userInfo,
      cities: savedItinerary.cities,
      travelersDetails: savedItinerary.travelersDetails,
    };

    // Save debug file
    const debugFilePath = path.join(
      __dirname,
      "../../logs/itineraries",
      `${itineraryToken}.json`
    );
    ensureDirectoryExistsAndSave(debugFilePath, formattedResponse);

    res.status(201).json(formattedResponse);
  } catch (error) {
    console.error("Detailed error creating finalized itinerary:", error);
    res.status(500).json({
      message: "Error creating finalized itinerary",
      error: error.message,
      stack: error.stack,
    });
  }
};


// Main orchestration function
async function orchestrateTransfersForItinerary(params) {
  const { itineraryDaysByCity, inquiry, departureFlights, returnFlights, inquiryToken } = params;

  // First city: Airport to first hotel transfer
  if (departureFlights[0] && itineraryDaysByCity[0]) {
    const firstCity = itineraryDaysByCity[0];
    const firstDayFirstCity = firstCity.days[0];
    
    const airportToHotelTransfer = await TransferOrchestrationService.processAirportToHotelTransfer({
      flight: departureFlights[0],
      hotel: firstDayFirstCity.hotels[0],
      travelersDetails: inquiry.travelersDetails,
      inquiryToken,
      preferences: inquiry.preferences
    });

    if (airportToHotelTransfer) {
      firstDayFirstCity.transfers = firstDayFirstCity.transfers || [];
      firstDayFirstCity.transfers.push(airportToHotelTransfer);
    }
  }

  // Process city-to-city transfers
  await Promise.all(Array.from({ length: itineraryDaysByCity.length - 1 }, async (_, i) => {
    const previousCity = itineraryDaysByCity[i];
    const currentCity = itineraryDaysByCity[i + 1];
    
    const previousCityFirstDay = previousCity.days[0];
    const currentCityFirstDay = currentCity.days[0];
    console.log('Previous City First Day Hotels:', (previousCityFirstDay.hotels, null, 2));
    console.log('Current City First Day Hotels:', (currentCityFirstDay.hotels, null, 2));

    const cityToCityTransfer = await TransferOrchestrationService.processCityToCityTransfer({
      originHotel: previousCityFirstDay.hotels[0],
      destinationHotel: currentCityFirstDay.hotels[0],
      travelersDetails: inquiry.travelersDetails,
      inquiryToken,
      preferences: inquiry.preferences,
      date: currentCity.days[0].date,
      originCity: previousCity,
      destinationCity: currentCity,
      selectedCities: inquiry.selectedCities
    });

    if (cityToCityTransfer) {
      if (cityToCityTransfer.type === "inter_city_flight") {
        // Add flight to current city's first day
        currentCityFirstDay.flights = currentCityFirstDay.flights || [];
        currentCityFirstDay.flights.push({ flightData: cityToCityTransfer.details });

        // Add transfers
        if (cityToCityTransfer.transfers?.hotelToAirport) {
          const lastDayPreviousCity = previousCity.days[previousCity.days.length - 1];
          lastDayPreviousCity.transfers = lastDayPreviousCity.transfers || [];
          lastDayPreviousCity.transfers.push(cityToCityTransfer.transfers.hotelToAirport);
        }

        if (cityToCityTransfer.transfers?.airportToHotel) {
          currentCityFirstDay.transfers = currentCityFirstDay.transfers || [];
          currentCityFirstDay.transfers.push(cityToCityTransfer.transfers.airportToHotel);
        }
      } else {
        // Ground transfer
        currentCityFirstDay.transfers = currentCityFirstDay.transfers || [];
        currentCityFirstDay.transfers.push(cityToCityTransfer);
      }
    }
  }));

  // Last city: Last hotel to airport transfer
  if (returnFlights[0]) {
    const lastCity = itineraryDaysByCity[itineraryDaysByCity.length - 1];
    const lastDayLastCity = lastCity.days[lastCity.days.length - 1];
    const firstDayLastCity = lastCity.days[0]; // Get hotel from first day
    
    const hotelToAirportTransfer = await TransferOrchestrationService.processHotelToAirportTransfer({
      flight: returnFlights[0],
      hotel: firstDayLastCity.hotels[0],
      travelersDetails: inquiry.travelersDetails,
      inquiryToken,
      preferences: inquiry.preferences,
      date: lastDayLastCity.date
    });
    
    if (hotelToAirportTransfer) {
      lastDayLastCity.transfers = lastDayLastCity.transfers || [];
      lastDayLastCity.transfers.push(hotelToAirportTransfer);
    }
  }

  return itineraryDaysByCity;
}

// Helper function to create airport to hotel transfer
async function createAirportToHotelTransfer(flight, hotel, inquiry, inquiryToken) {
  try {
    console.log('Airport to Hotel Transfer - Debug');
    // console.log('Flight Data:', (flight, null, 2));

    // Add extensive null checks
    if (!flight || !hotel) {
      console.error('Missing flight or hotel data');
      return null;
    }

    // Safely access nested hotel data
    const hotelDetails = hotel.data?.hotelDetails || 
                         hotel.hotelDetails || 
                         hotel.staticContent?.[0];

    if (!hotelDetails) {
      console.error('Could not find hotel details');
      return null;
    }

    const transferParams = {
      origin: {
        type: "airport",
        city: flight.destination,
        country: flight.arrivalAirport?.country,
        address: flight.arrivalAirport?.name,
        latitude: flight.arrivalAirport?.location?.latitude || 
                  flight.destination_location?.latitude,
        longitude: flight.arrivalAirport?.location?.longitude || 
                   flight.destination_location?.longitude,
      },
      destination: {
        type: "hotel",
        city: hotelDetails.address?.city?.name || hotelDetails.address?.city,
        country: hotelDetails.address?.country?.name || hotelDetails.address?.country,
        address: formatAddressToSingleLine(hotelDetails.address),
        latitude: hotelDetails.geolocation?.lat || 
                  hotelDetails.geoCode?.lat || 
                  hotelDetails.geolocation?.latitude,
        longitude: hotelDetails.geolocation?.long || 
                   hotelDetails.geoCode?.long || 
                   hotelDetails.geolocation?.longitude,
      },
      startDate: flight.landingTime,
      travelers: inquiry.travelersDetails,
      inquiryToken: inquiryToken
    };

    console.log('Transfer Params:', JSON.stringify(transferParams, null, 2));

    const transfer = await getGroundTransfer(transferParams);
    
    return transfer.type !== "error" 
      ? { type: "airport_to_hotel", details: transfer } 
      : null;
  } catch (error) {
    console.error('Airport to hotel transfer error:', error);
    console.error('Error Details:', {
      flightData: flight,
      hotelData: hotel
    });
    return null;
  }
}

// Helper function to create hotel to airport transfer
async function createHotelToAirportTransfer(flight, hotel, inquiry, inquiryToken) {
  try {
    console.log('Hotel to Airport Transfer');
    console.log('Flight:', (flight, null, 2));
    
    if (!flight || !hotel) {
      console.error('Missing flight or hotel data');
      return null;
    }

    // Get flight departure time, ensuring it's in ISO format
    let departureTime = flight.departureTime;
    if (flight.departureDate) {  // If we have separate date and time
      const [hours, minutes, period] = flight.departureTime.match(/(\d+):(\d+)\s*(AM|PM)/).slice(1);
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      departureTime = `${flight.departureDate}T${hour.toString().padStart(2, '0')}:${minutes}:00.000Z`;
    }

    const transferParams = {
      origin: {
        type: "hotel",
        city: hotel.data.hotelDetails.address.city.name,
        country: hotel.data.hotelDetails.address.country.name,
        address: formatAddressToSingleLine(hotel.data.hotelDetails.address),
        latitude: parseFloat(hotel.data.hotelDetails.geolocation.lat),
        longitude: parseFloat(hotel.data.hotelDetails.geolocation.long)
      },
      destination: {
        type: "airport",
        city: flight.origin,
        country: flight.originAirport.country,
        address: flight.originAirport.name,
        latitude: flight.originAirport.location.latitude,
        longitude: flight.originAirport.location.longitude
      },
      startDate: departureTime,
      travelers: inquiry.travelersDetails,
      inquiryToken: inquiryToken,
      flightNumber: flight.flightCode // Add flight number
    };

    console.log('Hotel to Airport Transfer Params:', JSON.stringify(transferParams, null, 2));

    const transfer = await getGroundTransfer(transferParams);
    
    console.log('Hotel to Airport Transfer Result:', JSON.stringify(transfer, null, 2));

    return transfer.type !== "error" 
      ? { type: "hotel_to_airport", details: transfer } 
      : null;
  } catch (error) {
    console.error('Hotel to airport transfer error:', error);
    return null;
  }
}


// Get itinerary endpoint
exports.getItinerary = async (req, res) => {
  try {
    const { itineraryToken } = req.params;
    const inquiryToken = req.headers["x-inquiry-token"];

    if (!itineraryToken || !inquiryToken) {
      return res.status(400).json({
        message: "Both itineraryToken and inquiry token are required",
      });
    }

    const itinerary = await Itinerary.findOne({
      itineraryToken,
      inquiryToken,
    });

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found",
      });
    }

    const formattedResponse = {
      itineraryToken: itinerary.itineraryToken,
      inquiryToken: itinerary.inquiryToken,
      userInfo: itinerary.userInfo, // Include userInfo in response
      cities: itinerary.cities,
      travelersDetails: itinerary.travelersDetails,
      priceTotals: itinerary.priceTotals || null,
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    res.status(500).json({
      message: "Error fetching itinerary",
      error: error.message,
    });
  }
};

// Add this new function
exports.getItineraryByInquiryToken = async (req, res) => {
  try {
    const { inquiryToken } = req.params;

    if (!inquiryToken) {
      return res.status(400).json({
        message: "Inquiry token is required",
      });
    }

    const itinerary = await Itinerary.findOne({ inquiryToken });

    if (!itinerary) {
      return res.status(404).json({
        message: "No itinerary found for this inquiry",
      });
    }

    res.json({
      itineraryToken: itinerary.itineraryToken,
      inquiryToken: itinerary.inquiryToken,
      userInfo: itinerary.userInfo, // Include userInfo in response
      cities: itinerary.cities,
      travelersDetails: itinerary.travelersDetails,
      priceTotals: itinerary.priceTotals || null,
    });
  } catch (error) {
    console.error("Error fetching itinerary by inquiry token:", error);
    res.status(500).json({
      message: "Error fetching itinerary",
      error: error.message,
    });
  }
};

exports.updateItineraryPrices = async (req, res) => {
  try {
    const { itineraryToken } = req.params;
    const { priceTotals } = req.body;

    // Log incoming request
    console.log("Updating prices for itinerary:", itineraryToken);
    console.log("Price totals:", priceTotals);

    // Validate price totals
    if (!priceTotals || typeof priceTotals !== "object") {
      return res.status(400).json({
        message: "Invalid price totals format",
      });
    }

    // Ensure all price values are numbers
    const validatedPriceTotals = {
      activities: Number(priceTotals.activities || 0),
      hotels: Number(priceTotals.hotels || 0),
      flights: Number(priceTotals.flights || 0),
      transfers: Number(priceTotals.transfers || 0),
      subtotal: Number(priceTotals.subtotal || 0),
      tcsAmount: Number(priceTotals.tcsAmount || 0),
      tcsRate: Number(priceTotals.tcsRate || 0),
      grandTotal: Number(priceTotals.grandTotal || 0),
    };

    // Update itinerary with validated price totals
    const updatedItinerary = await Itinerary.findOneAndUpdate(
      { itineraryToken },
      {
        $set: { priceTotals: validatedPriceTotals },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedItinerary) {
      return res.status(404).json({
        message: "Itinerary not found",
      });
    }

    // Log the updated document
    console.log("Updated itinerary with prices:", {
      itineraryToken: updatedItinerary.itineraryToken,
      priceTotals: updatedItinerary.priceTotals,
    });

    res.json(updatedItinerary);
  } catch (error) {
    console.error("Error updating itinerary prices:", error);
    res.status(500).json({
      message: "Error updating itinerary prices",
      error: error.message,
    });
  }
};
