const Itinerary = require("../../models/Itinerary");
const ItineraryInquiry = require("../../models/ItineraryInquiry");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const apiLogger = require("../../helpers/apiLogger");
const { getCityActivities } = require("./activityController");
const ActivityDestination = require("../../models/itineraryModel/ActivityDestination");
const { processHotelsForCity } = require("./hotelController");
const { getGroundTransfer } = require("./transferController");
const { Client } = require("@googlemaps/google-maps-services-js");
const { getFlights } = require("./flightController");

// Helper function to calculate days between dates
const getDifferenceInDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const difference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return difference;
};

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

    // Step 1: Get initial flight
    console.log("Getting departure flight...");

    // console.log("Departure Flight Request Data:", JSON.stringify({
    //   inquiryToken: inquiry.itineraryInquiryToken,
    //   departureCity: inquiry.departureCity,
    //   cities: [inquiry.selectedCities[0]],
    //   travelers: inquiry.travelersDetails,
    //   departureDates: {
    //     startDate: inquiry.departureDates.startDate,
    //     endDate: inquiry.departureDates.startDate
    //   },
    //   includeDetailedLandingInfo: true,
    //   type: "departure_flight"
    // }, null, 2));

    const departureFlights = await getFlights({
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
    });


    // Step 2: Get return flight scheduled for the last day
    console.log("Getting return flight...");

    // console.log(
    //   "Return Flight Request Data:",
    //   JSON.stringify(
    //     {
    //       inquiryToken: inquiry.itineraryInquiryToken,
    //       departureCity:
    //         inquiry.selectedCities[inquiry.selectedCities.length - 1],
    //       cities: [inquiry.departureCity],
    //       travelers: inquiry.travelersDetails,
    //       departureDates: {
    //         startDate: inquiry.departureDates.endDate,
    //         endDate: inquiry.departureDates.endDate,
    //       },
    //       includeDetailedLandingInfo: true,
    //       type: "return_flight",
    //     },
    //     null,
    //     2
    //   )
    // );

    const returnFlights = await getFlights({
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
    });


    // Step 3: Distribute days across cities
    const cityDayDistribution = distributeDaysAcrossCities(
      inquiry.departureDates.startDate,
      inquiry.departureDates.endDate,
      inquiry.selectedCities
    );

    // Step 4: Process hotels and create initial structure
    const itineraryDaysByCity = [];
    const cityActivitiesTracker = {};

    for (const [
      index,
      { city, startDate, endDate },
    ] of cityDayDistribution.entries()) {
      console.log(
        `Processing city ${index + 1}/${cityDayDistribution.length}: ${
          city.city
        }`
      );

      // Create extended checkout date (1 day after endDate)
      const extendedCheckoutDate = new Date(endDate);
      extendedCheckoutDate.setDate(extendedCheckoutDate.getDate() + 1);

      // Get hotel for current city with extended checkout date
      console.log("Getting hotel...");
      const hotelResponse = await processHotelsForCity(
        {
          city: city.city,
          country: city.country,
          startDate: startDate,
          endDate: extendedCheckoutDate, // Use extended checkout date here
          travelersDetails: inquiry.travelersDetails,
          preferences: inquiry.preferences,
          inquiryToken: inquiryToken,
        },
        inquiry,
        inquiryToken
      );

      const cityDetails = {
        city: city.city,
        cityCode: city.code,
        country: city.country,
        startDate,
        endDate,
        days: [],
      };

      const daysForThisCity = getDifferenceInDays(startDate, endDate) + 1;

      // Process each day for the city
      for (let dayOffset = 0; dayOffset < daysForThisCity; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);
        const formattedDate = currentDate.toISOString().split("T")[0];

        // Add correct day context
        const isFirstDay = dayOffset === 0;
        const isLastDay = dayOffset === daysForThisCity - 1;

        console.log(`Processing activities for day ${dayOffset + 1}`);
        const dayActivities = await processActivitiesForDay(
          city,
          inquiry,
          formattedDate,
          {
            adults: inquiry.travelersDetails.rooms
              .map((room) => room.adults)
              .flat(),
            childAges: inquiry.travelersDetails.rooms
              .map((room) => room.children)
              .flat(),
          },
          inquiryToken,
          cityActivitiesTracker,
          { isFirstDay, isLastDay } // Add this day context
        );

        const dayObject = {
          date: formattedDate,
          flights: [],
          hotels:
            dayOffset === 0
              ? [
                  {
                    ...hotelResponse,
                    address: hotelResponse.address || null,
                    checkIn: startDate.toISOString().split("T")[0],
                    checkOut: extendedCheckoutDate.toISOString().split("T")[0], // Add checkout date explicitly
                  },
                ]
              : [],
          activities: dayActivities.activities || [],
          transfers: [],
        };

        // Add departure flight to first day of first city
        if (index === 0 && dayOffset === 0) {
          dayObject.flights.push({
            flightData: departureFlights[0],
          });

          // Process airport-to-hotel transfer for first city
          try {
            const arrivalLocation = formatLocationForTransfer(
              {
                city: city.city,
                country: city.country,
                address: departureFlights[0].arrivalAirport?.name || null,
                latitude:
                  departureFlights[0].arrivalAirport?.location?.latitude ||
                  departureFlights[0].destination_location?.latitude,
                longitude:
                  departureFlights[0].arrivalAirport?.location?.longitude ||
                  departureFlights[0].destination_location?.longitude,
              },
              "airport"
            );

            const hotelLocation = formatLocationForTransfer(
              {
                city: city.city,
                country: city.country,
                address: hotelResponse.address || null,
                latitude: hotelResponse.hotel_details?.geolocation?.latitude,
                longitude: hotelResponse.hotel_details?.geolocation?.longitude,
              },
              "hotel"
            );

            const transferRequestData = {
              travelers: inquiry.travelersDetails,
              inquiryToken: inquiry.itineraryInquiryToken,
              preferences: inquiry.preferences,
              startDate: departureFlights[0].landingTime || startDate,
              origin: {
                type: "airport",
                ...arrivalLocation,
              },
              destination: {
                type: "hotel",
                ...hotelLocation,
              },
            };
            // console.log("transferRequestData origin:", JSON.stringify(transferRequestData.origin, null, 2));
            // console.log("transferRequestData destination:", JSON.stringify(transferRequestData.destination, null, 2));

            const airportToHotelTransfer = await getGroundTransfer(
              transferRequestData
            );
            if (airportToHotelTransfer.type !== "error") {
              dayObject.transfers.push({
                type: "airport_to_hotel",
                details: airportToHotelTransfer,
              });
            }
          } catch (error) {
            console.error(
              `Error processing airport-to-hotel transfer: ${error.message}`
            );
          }
        }

        // Add return flight and final transfer to last day of last city
        if (
          index === cityDayDistribution.length - 1 &&
          dayOffset === daysForThisCity - 1
        ) {
          dayObject.flights.push({
            flightData: returnFlights[0],
          });

          // Process hotel-to-airport transfer for return flight
          try {
            const hotelLocation = formatLocationForTransfer(
              {
                city: city.city,
                country: city.country,
                address: hotelResponse.address,
                latitude: hotelResponse.hotel_details?.geolocation?.latitude,
                longitude: hotelResponse.hotel_details?.geolocation?.longitude,
              },
              "hotel"
            );

            const departureLocation = formatLocationForTransfer(
              {
                city: city.city,
                country: city.country,
                address: returnFlights[0].originAirport?.name,
                latitude:
                  returnFlights[0].originAirport?.location?.latitude ||
                  returnFlights[0].origin_location?.latitude,
                longitude:
                  returnFlights[0].originAirport?.location?.longitude ||
                  returnFlights[0].origin_location?.longitude,
              },
              "airport"
            );

            const transferRequestData = {
              travelers: inquiry.travelersDetails,
              inquiryToken: inquiry.itineraryInquiryToken,
              preferences: inquiry.preferences,
              startDate: new Date(formattedDate),
              origin: {
                type: "hotel",
                ...hotelLocation,
              },
              destination: {
                type: "airport",
                ...departureLocation,
              },
            };

            const hotelToAirportTransfer = await getGroundTransfer(
              transferRequestData
            );

            // console.log('Hotel to Airport Transfer Response:',
            //   JSON.stringify(hotelToAirportTransfer, null, 2));

            if (hotelToAirportTransfer.type !== "error") {
              dayObject.transfers.push({
                type: "hotel_to_airport",
                details: hotelToAirportTransfer,
              });
            }
          } catch (error) {
            console.error(
              `Error processing hotel-to-airport transfer: ${error.message}`
            );
          }
        }

        cityDetails.days.push(dayObject);
      }

      itineraryDaysByCity.push(cityDetails);
    }

    // Step 5: Process city-to-city transfers
    console.log("Processing city-to-city transfers");
    for (let i = 1; i < itineraryDaysByCity.length; i++) {
      const previousCity = itineraryDaysByCity[i - 1];
      const currentCity = itineraryDaysByCity[i];
      const previousHotel = previousCity.days[0].hotels[0];
      const currentHotel = currentCity.days[0].hotels[0];

      try {
        console.log(
          `Processing transfer from ${previousCity.city} to ${currentCity.city}`
        );
        const originLocation = formatLocationForTransfer(
          {
            city: previousCity.city,
            country: previousCity.country,
            address: previousHotel.address,
            latitude: previousHotel.hotel_details?.geolocation?.latitude,
            longitude: previousHotel.hotel_details?.geolocation?.longitude,
          },
          "previous hotel"
        );

        const destinationLocation = formatLocationForTransfer(
          {
            city: currentCity.city,
            country: currentCity.country,
            address: currentHotel.address,
            latitude: currentHotel.hotel_details?.geolocation?.latitude,
            longitude: currentHotel.hotel_details?.geolocation?.longitude,
          },
          "current hotel"
        );

        const transferRequestData = {
          travelers: inquiry.travelersDetails,
          inquiryToken: inquiry.itineraryInquiryToken,
          preferences: inquiry.preferences,
          startDate: (() => {
            const date = new Date(currentCity.days[0].date);
            date.setHours(12, 0, 0, 0); // Sets to 12:00:00.000 PM
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

        // console.log(`City-to-City Transfer from ${previousCity.city} to ${currentCity.city}:`,
        //   JSON.stringify(cityToCityTransfer, null, 2));

        if (cityToCityTransfer.type !== "error") {
          const transferDuration =
            cityToCityTransfer?.quotes?.[0]?.duration || 0;

          if (transferDuration > 480) {
            console.log(
              "Ground transfer duration > 8 hours, switching to flight"
            );
            const alternativeFlights = await getFlights({
              // ... flight request config
            });

            if (alternativeFlights && alternativeFlights[0]) {
              // Directly save the flight data
              currentCity.days[0].transfers.push(alternativeFlights[0]);
            }
          } else {
            // Directly save the transfer data
            currentCity.days[0].transfers.push({
              type: "city_to_city",
              details: cityToCityTransfer,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error processing city-to-city transfer: ${error.message}`
        );
      }
    }

    // Create and save the itinerary
    const itinerary = new Itinerary({
      itineraryToken,
      inquiryToken: inquiry.itineraryInquiryToken,
      travelersDetails: inquiry.travelersDetails, // Add this line
      cities: itineraryDaysByCity,
    });

    console.log("Saving itinerary...");
    const savedItinerary = await itinerary.save();

    const formattedResponse = {
      itineraryToken: savedItinerary.itineraryToken,
      inquiryToken: savedItinerary.inquiryToken,
      cities: savedItinerary.cities,
      travelersDetails: savedItinerary.travelersDetails, // Add travelers data to response
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
