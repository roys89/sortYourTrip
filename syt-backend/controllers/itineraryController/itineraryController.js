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
const { Client } = require("@googlemaps/google-maps-services-js");
const { getFlights } = require("./flightControllerTC");

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

const processFlightsAndHotels = async (inquiry, cityDayDistribution) => {
  try {
    // Get departure and return flights concurrently
    // const [departureFlights, returnFlights] = await Promise.all([
    //   getFlights({
    //     inquiryToken: inquiry.itineraryInquiryToken,
    //     departureCity: inquiry.departureCity,
    //     cities: [inquiry.selectedCities[0]],
    //     travelers: inquiry.travelersDetails,
    //     departureDates: {
    //       startDate: inquiry.departureDates.startDate,
    //       endDate: inquiry.departureDates.startDate,
    //     },
    //     includeDetailedLandingInfo: true,
    //     type: "departure_flight",
    //   }),
    //   getFlights({
    //     inquiryToken: inquiry.itineraryInquiryToken,
    //     departureCity: inquiry.selectedCities[inquiry.selectedCities.length - 1],
    //     cities: [inquiry.departureCity],
    //     travelers: inquiry.travelersDetails,
    //     departureDates: {
    //       startDate: inquiry.departureDates.endDate,
    //       endDate: inquiry.departureDates.endDate,
    //     },
    //     includeDetailedLandingInfo: true,
    //     type: "return_flight",
    //   })
    // ]);

    // Process hotels for all cities concurrently
    const hotelPromises = cityDayDistribution.map(async ({ city, startDate, endDate }, index) => {
      const extendedCheckoutDate = new Date(endDate);
      extendedCheckoutDate.setDate(extendedCheckoutDate.getDate() + 1);

      console.log(`Getting hotel for city ${index + 1}/${cityDayDistribution.length}: ${city.city}`);


      console.log('Hotel Request Data:', JSON.stringify({
        city: city.city,
        country: city.country,
        startDate: startDate,
        endDate: extendedCheckoutDate,
        travelersDetails: inquiry.travelersDetails,
        preferences: inquiry.preferences,
        inquiryToken: inquiry.itineraryInquiryToken
      }, null, 2));

      // Only pass the expected parameters in the format the hotel controller expects
      const hotelResponse = await getHotels({
        city: city.city,
        country: city.country,
        startDate: startDate,
        endDate: extendedCheckoutDate,
        travelersDetails: inquiry.travelersDetails,
        preferences: inquiry.preferences,
        inquiryToken: inquiry.itineraryInquiryToken
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

    // Step 1: Distribute days across cities
    const cityDayDistribution = distributeDaysAcrossCities(
      inquiry.departureDates.startDate,
      inquiry.departureDates.endDate,
      inquiry.selectedCities
    );

    // Step 2: Get flights and hotels concurrently
    console.log("Getting flights and hotels concurrently...");
    console.log('Starting concurrent processing of flights and hotels...');
    const { departureFlights, returnFlights, hotelResponses } = 
      await processFlightsAndHotels(inquiry, cityDayDistribution);

    // Step 3: Process and create initial structure
    const itineraryDaysByCity = [];
    const cityActivitiesTracker = {};

    // Process activities for all cities
    const processedCities = await Promise.all(cityDayDistribution.map(async (cityData, index) => {
      const { city, startDate, endDate } = cityData;
      const hotelResponse = hotelResponses[index];

      console.log(`Processing city ${index + 1}/${cityDayDistribution.length}: ${city.city}`);

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
          cityActivitiesTracker,
          { isFirstDay, isLastDay }
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
        if (index === 0 && isFirstDay) {
          dayObject.flights.push({ flightData: departureFlights[0] });

          // Process airport-to-hotel transfer
          try {
            const arrivalLocation = formatLocationForTransfer({
              city: city.city,
              country: city.country,
              address: departureFlights[0].arrivalAirport?.name || null,
              latitude: departureFlights[0].arrivalAirport?.location?.latitude || departureFlights[0].destination_location?.latitude,
              longitude: departureFlights[0].arrivalAirport?.location?.longitude || departureFlights[0].destination_location?.longitude,
            }, "airport");

            const hotelLocation = formatLocationForTransfer({
              city: city.city,
              country: city.country,
              address: formatAddressToSingleLine(hotelResponse.data.hotelDetails.address),
              latitude: hotelResponse.data.hotelDetails.geolocation?.lat,
              longitude: hotelResponse.data.hotelDetails.geolocation?.long,
            }, "hotel");

            const transferResult = await getGroundTransfer({
              travelers: inquiry.travelersDetails,
              inquiryToken: inquiry.itineraryInquiryToken,
              preferences: inquiry.preferences,
              startDate: departureFlights[0].landingTime || startDate,
              origin: { type: "airport", ...arrivalLocation },
              destination: { type: "hotel", ...hotelLocation },
            });

            if (transferResult.type !== "error") {
              dayObject.transfers.push({
                type: "airport_to_hotel",
                details: transferResult,
              });
            }
          } catch (error) {
            console.error(`Error processing airport-to-hotel transfer: ${error.message}`);
          }
        }

        // Add return flight and transfer for last city's last day
        if (index === cityDayDistribution.length - 1 && isLastDay) {
          dayObject.flights.push({ flightData: returnFlights[0] });

          // Process hotel-to-airport transfer
          try {
            const hotelLocation = formatLocationForTransfer({
              city: city.city,
              country: city.country,
              address: formatAddressToSingleLine(hotelResponse.data.hotelDetails.address),
              latitude: hotelResponse.data.hotelDetails.geolocation?.lat,
              longitude: hotelResponse.data.hotelDetails.geolocation?.long,
            }, "hotel");

            const departureLocation = formatLocationForTransfer({
              city: city.city,
              country: city.country,
              address: returnFlights[0].originAirport?.name,
              latitude: returnFlights[0].originAirport?.location?.latitude || returnFlights[0].origin_location?.latitude,
              longitude: returnFlights[0].originAirport?.location?.longitude || returnFlights[0].origin_location?.longitude,
            }, "airport");

            const transferResult = await getGroundTransfer({
              travelers: inquiry.travelersDetails,
              inquiryToken: inquiry.itineraryInquiryToken,
              preferences: inquiry.preferences,
              startDate: new Date(formattedDate),
              origin: { type: "hotel", ...hotelLocation },
              destination: { type: "airport", ...departureLocation },
            });

            if (transferResult.type !== "error") {
              dayObject.transfers.push({
                type: "hotel_to_airport",
                details: transferResult,
              });
            }
          } catch (error) {
            console.error(`Error processing hotel-to-airport transfer: ${error.message}`);
          }
        }

        return dayObject;
      }));

      cityDetails.days = processedDays;
      return cityDetails;
    }));

    itineraryDaysByCity.push(...processedCities);

    // Step 4: Process city-to-city transfers
    console.log("Processing city-to-city transfers");
    await Promise.all(Array.from({ length: itineraryDaysByCity.length - 1 }, async (_, i) => {
      const previousCity = itineraryDaysByCity[i];
      const currentCity = itineraryDaysByCity[i + 1];
      const previousHotel = previousCity.days[0].hotels[0];
      const currentHotel = currentCity.days[0].hotels[0];

      try {
        console.log(`Processing transfer from ${previousCity.city} to ${currentCity.city}`);
        const originLocation = formatLocationForTransfer({
          city: previousCity.city,
          country: previousCity.country,
          address: formatAddressToSingleLine(previousHotel.data.hotelDetails.address),
          latitude: previousHotel.data.hotelDetails.geolocation?.lat,
          longitude: previousHotel.data.hotelDetails.geolocation?.long,
        }, "previous hotel");
        
        const destinationLocation = formatLocationForTransfer({
          city: currentCity.city,
          country: currentCity.country,
          address: formatAddressToSingleLine(currentHotel.data.hotelDetails.address),
          latitude: currentHotel.data.hotelDetails.geolocation?.lat,
          longitude: currentHotel.data.hotelDetails.geolocation?.long,
        }, "current hotel");

        const transferRequestData = {
          travelers: inquiry.travelersDetails,
          inquiryToken: inquiry.itineraryInquiryToken,
          preferences: inquiry.preferences,
          startDate: (() => {
            const date = new Date(currentCity.days[0].date);
            date.setHours(12, 0, 0, 0);
            return date;
          })(),
          origin: {
            type: "previous_hotel",
            ...originLocation,
          },
          destination: {
            type: "current_hotel",
            ...destinationLocation,
          },
        };

        const cityToCityTransfer = await getGroundTransfer(transferRequestData);

        if (cityToCityTransfer.type !== "error") {
          const transferDuration = cityToCityTransfer?.quotes?.[0]?.duration || 0;

          if (transferDuration > 480) {
            console.log("Ground transfer duration > 8 hours, switching to flight");
            const alternativeFlights = await getFlights({
              inquiryToken: inquiry.itineraryInquiryToken,
              departureCity: previousCity.city,
              cities: [currentCity.city],
              travelers: inquiry.travelersDetails,
              departureDates: {
                startDate: currentCity.days[0].date,
                endDate: currentCity.days[0].date,
              },
              includeDetailedLandingInfo: true,
              type: "inter_city_flight",
            });

            if (alternativeFlights?.[0]) {
              currentCity.days[0].transfers.push(alternativeFlights[0]);
            }
          } else {
            currentCity.days[0].transfers.push({
              type: "city_to_city",
              details: cityToCityTransfer,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing city-to-city transfer: ${error.message}`);
      }
    }));

    // Step 5: Create and save the itinerary
    const itinerary = new Itinerary({
      itineraryToken,
      inquiryToken: inquiry.itineraryInquiryToken,
      userInfo: inquiry.userInfo,
      travelersDetails: inquiry.travelersDetails,
      cities: itineraryDaysByCity,
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
