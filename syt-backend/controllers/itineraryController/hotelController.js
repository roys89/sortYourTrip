const fs = require('fs').promises;
const path = require('path');
const HotelCountry = require('../../models/itineraryModel/HotelCountry');
const HotelCity = require('../../models/itineraryModel/HotelCity');
const Hotel = require('../../models/itineraryModel/Hotel');
const hotelAvailabilityService = require('../../services/hotelServices/hotelAvailabilityService');
const hotelRecheckService = require('../../services/hotelServices/hotelRecheckService');

const BATCH_SIZE = 100; // Maximum hotel codes per API call

/**
 * Log API Data
 */
const logApiData = async ({ inquiryToken, cityName, date, apiType, requestData, responseData }) => {
  try {
    const logPath = path.join(
      process.cwd(),
      'JSON',
      inquiryToken,
      cityName,
      date,
      'hotel-availability',
      'api_logs.json'
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(logPath), { recursive: true });

    const logEntry = {
      timestamp: new Date().toISOString(),
      apiType,
      request: requestData,
      response: responseData
    };

    let logs = [];
    try {
      const existingLogs = await fs.readFile(logPath, 'utf8');
      logs = JSON.parse(existingLogs);
    } catch (err) {
      // File doesn't exist or is invalid JSON, start with empty array
    }

    logs.push(logEntry);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error logging API data:', error);
  }
};

/**
 * Get country code (2-letter) for the given country name
 */
const getCountryCode2Letter = async (countryName) => {
  try {
    const country = await HotelCountry.findOne({ countryName });
    if (!country) {
      throw new Error(`Country not found: ${countryName}`);
    }
    return country.countryCode2Letter;
  } catch (error) {
    console.error('Error fetching country code:', error);
    throw error;
  }
};

/**
 * Get city code for the given city name and country code
 */
const getCityCode = async (cityName, countryCode2Letter) => {
  try {
    const city = await HotelCity.findOne({
      cityName,
      countryCode: countryCode2Letter
    });
    if (!city) {
      throw new Error(`City not found: ${cityName}`);
    }
    return city.cityCode;
  } catch (error) {
    console.error('Error fetching city code:', error);
    throw error;
  }
};

/**
 * Get ALL hotel codes for a city without star category filter
 */
const getAllHotelsForCity = async (cityCode, countryCode) => {
  try {
    const hotels = await Hotel.find({
      cityCode,
      countryCode,
      accommodationTypeSubName: 'Hotel',
    })
    .limit(500)
    .select('hotelCode');

    return hotels.map(hotel => hotel.hotelCode);
  } catch (error) {
    console.error('Error fetching ALL hotels:', error);
    return [];
  }
};

/**
 * Get hotels for a city based on budget preferences
 */
const getHotelsForCity = async (cityCode, countryCode, preferences) => {
  try {
    const { budget } = preferences;

    let starCategoryFilter;
    if (budget === 'Luxury') {
      starCategoryFilter = 5;
    } else if (budget === 'Somewhere In-between') {
      starCategoryFilter = 4;
    } else if (budget === 'Pocket Friendly') {
      starCategoryFilter = 3;
    } else {
      throw new Error(`Unsupported budget preference: ${budget}`);
    }

    const hotels = await Hotel.find({
      cityCode,
      countryCode,
      starCategory: starCategoryFilter,
      accommodationTypeSubName: 'Hotel',
    })
      .limit(100)
      .select('hotelCode');

    return hotels.map(hotel => hotel.hotelCode);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }
};

/**
 * Process hotel rates to find the lowest priced options
 */
const processHotelRates = (hotel) => {
  if (!hotel.rates || hotel.rates.length === 0) return { ...hotel, averageRatePrice: 0 };

  const averageRatePrice = hotel.rates.reduce((sum, rate) => sum + (rate.price || 0), 0) / hotel.rates.length;
  const lowestRate = hotel.rates.reduce((prev, current) => 
    (current.price || 0) < (prev.price || 0) ? current : prev
  );

  return { ...hotel, averageRatePrice, lowestRate };
};


/**
 * Process recheck response and validate
 */
const processRecheckResponse = (recheckResponse, inquiryToken, cityName, originalRate) => {
  // First check if we have a rate in the response
  if (!recheckResponse?.hotel?.rate) {
    throw new Error('Rate is no longer available');
  }

  // Then check if the rate is bookable
  if (recheckResponse.hotel.rate.rate_type !== 'bookable') {
    throw new Error('Rate is not bookable');
  }

  return recheckResponse;
};

/**
 * Format hotel details for response with detailed recheck information
 */
const formatHotelDetails = (hotel, search_id, recheckInfo, originalRate) => {
  const recheckRate = recheckInfo?.hotel?.rate;
  const existingPrice = originalRate?.price || 0;
  const priceDifference = (recheckRate?.price || 0) - existingPrice;
  
  // Use recheck rate comments as they're more complete
  const rateComments = recheckRate?.rate_comments || {};

  // Handle case where cancellation policy is missing
  const cancellationPolicy = recheckRate?.cancellation_policy || {
    amount_type: "value",
    no_show_fee: {
      amount_type: "value",
      currency: recheckRate?.currency,
      flat_fee: recheckRate?.price
    },
    under_cancellation: false,
    message: "Not cancelable"
  };

  return {
    hotelCode: hotel.hotel_code,
    hotelProvider: 'GRNC',
    cityCode: recheckInfo.hotel.city_code || null,
    name: hotel.name,
    address: hotel.address,
    category: hotel.category,
    description: hotel.description,
    checkIn: hotel.checkIn || recheckInfo.hotel.checkIn,
    checkOut: hotel.checkOut || recheckInfo.hotel.checkOut,
    images: [{
      url: hotel.images?.url || hotel.images?.main_image || null,
      variants: [{
        url: hotel.images?.url || hotel.images?.main_image || null
      }]
    }],
    rate: {
      ...recheckRate,
      boarding_details: recheckRate?.boarding_details || [],
      cancellation_policy: cancellationPolicy,
      rate_comments: {
        checkin_begin_time: rateComments.checkin_begin_time || "2:00 PM",
        checkin_end_time: rateComments.checkin_end_time || "midnight",
        checkout_time: rateComments.checkout_time || "12:00 PM",
        comments: rateComments.comments || "",
        fee_comments: rateComments.fee_comments || "",
        mealplan: rateComments.mealplan || "",
        pax_comments: rateComments.pax_comments || "",
        remarks: rateComments.remarks || ""
      },
      price_details: {
        GST: recheckRate?.price_details?.GST || [],
        net: recheckRate?.price_details?.net || [],
        surcharge_or_tax: recheckRate?.price_details?.surcharge_or_tax || []
      },
      other_inclusions: recheckRate?.other_inclusions || [],
      promotions_details: recheckRate?.has_promotions ? recheckRate.promotions_details : undefined,
      rooms: recheckRate?.rooms || []
    },
    rate_status: recheckRate?.rate_type === 'bookable' ? 'BOOKABLE' : 'NOT_BOOKABLE',
    is_rate_changed: !!recheckRate && recheckRate.price !== originalRate?.price,
    recheck_price_difference: !!recheckRate ? recheckRate.price - (originalRate?.price || 0) : 0,
    price_difference: priceDifference,
    search_id: search_id,
    hotel_details: {
      geolocation: hotel.geolocation || recheckInfo?.hotel?.geolocation,
      facilities: Array.isArray(hotel.facilities) ? 
        hotel.facilities : 
        (hotel.facilities || '').split(';').map(f => f.trim()),
      category: (hotel.category || '').toString(),
      cancellation_policy: cancellationPolicy,
      checkin_end_time: rateComments.checkin_end_time || "midnight",
      checkin_begin_time: rateComments.checkin_begin_time || "2:00 PM",
      checkout_time: rateComments.checkout_time || "12:00 PM",
      hotel_charges: recheckRate?.price_details?.surcharge_or_tax || []
    }
  };
};
/**
 * Process hotel availability and details for the given city and inquiry.
 */
const processHotelsForCity = async (cityDetails, inquiry, inquiryToken) => {
  try {
    // Step 1: Get country code
    const countryCode2Letter = await getCountryCode2Letter(cityDetails.country);

    // Step 2: Get city code
    const cityCode = await getCityCode(cityDetails.city, countryCode2Letter);

    // New Step: Get all hotel codes for saving
    const allHotelCodes = await getAllHotelsForCity(cityCode, countryCode2Letter);
    if (!allHotelCodes.length) {
      throw new Error(`No hotels found for city: ${cityDetails.city}`);
    }

    // Step 3: Fetch hotel codes based on budget preferences (for API call)
    const hotelCodes = await getHotelsForCity(cityCode, countryCode2Letter, inquiry.preferences);
    if (!hotelCodes.length) {
      throw new Error(`No hotels found for city: ${cityDetails.city}`);
    }

    // Step 4: Format dates
    const checkIn = cityDetails.startDate.toISOString().split('T')[0];
    const checkOut = cityDetails.endDate.toISOString().split('T')[0];

    // Save hotel_codes.json
    const basePath = path.join(
      process.cwd(),
      'JSON',
      inquiryToken,
      cityDetails.city,
      checkIn,
      'hotel-availability'
    );

    await fs.mkdir(basePath, { recursive: true });
    await fs.writeFile(
      path.join(basePath, 'hotel_codes.json'),
      JSON.stringify({
        cityName: cityDetails.city,
        countryName: cityDetails.country,
        totalHotels: allHotelCodes.length,
        hotelCodes: allHotelCodes,
        timestamp: new Date().toISOString()
      }, null, 2)
    );

    // Prepare data for hotel service
    const serviceRequestData = {
      hotelCodes,
      checkIn,
      checkOut,
      travelers: inquiry.travelersDetails,
      preferences: inquiry.preferences,
      inquiryToken,
      cityName: cityDetails.city,
      nationality: 'IN',
      currency: 'INR',
    };

    // console.log('Request to Hotel Service:', serviceRequestData);

   // Save default_request.json
await fs.writeFile(
  path.join(basePath, 'default_request.json'),
  JSON.stringify({
    metadata: {
      inquiryToken,
      cityName: cityDetails.city,
      date: checkIn,
      apiType: 'hotel-availability',
      searchId: inquiryToken,
      timestamp: new Date().toISOString()
    },
    data: serviceRequestData
  }, null, 2)
);

// Step 5: Call hotel service for availability
const hotelResponse = await hotelAvailabilityService.fetchHotelAvailability(serviceRequestData);

// Save default_response.json
await fs.writeFile(
  path.join(basePath, 'default_response.json'),
  JSON.stringify({
    metadata: {
      inquiryToken,
      cityName: cityDetails.city,
      date: checkIn,
      apiType: 'hotel-availability',
      searchId: inquiryToken,
      timestamp: new Date().toISOString()
    },
    data: hotelResponse
  }, null, 2)
);

// Log API request and response at controller level
await logApiData({
  inquiryToken,
  cityName: cityDetails.city,
  date: checkIn,
  apiType: 'hotel-availability',
  requestData: serviceRequestData,
  responseData: hotelResponse
});

    // Step 6: Process the response
    if (hotelResponse && hotelResponse.hotels?.length > 0) {
      const search_id = hotelResponse.search_id;

      // Process each hotel to find rates and prices
      const hotelsWithAveragePrice = hotelResponse.hotels.map(processHotelRates);

      // Find the hotel with the lowest average rate price
      const lowestPricedHotel = hotelsWithAveragePrice.reduce((prev, current) =>
        current.averageRatePrice < prev.averageRatePrice ? current : prev
      );

      // Store original rate before recheck
      const originalRate = { ...lowestPricedHotel.lowestRate };

      try {
        // console.log('Request to Hotel Recheck Service:', {
        //   search_id,
        //   checkIn,
        //   group_code: originalRate.group_code,
        //   rate_key: originalRate.rate_key,
        //   inquiryToken,
        //   cityName: cityDetails.city
        // });

        // Perform rate recheck
        const recheckResponse = await hotelRecheckService.recheckRate(
          search_id,
          checkIn,
          originalRate.group_code,
          originalRate.rate_key,
          inquiryToken,
          cityDetails.city
        );

        // Process and validate recheck response
        const processedRecheckResponse = processRecheckResponse(
          recheckResponse,
          inquiryToken,
          cityDetails.city,
          originalRate
        );

        // Format and return hotel details
        return formatHotelDetails(
          lowestPricedHotel,
          search_id,
          processedRecheckResponse,
          originalRate
        );

      } catch (recheckError) {
        throw recheckError;
      }
    }

    return null;
  } catch (error) {
    console.error('Error processing hotels:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get available hotels
 */
const getAvailableHotels = async (req, res) => {
  const { inquiryToken, cityName, date } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;

  try {
    const basePath = path.join(
      process.cwd(),
      'JSON',
      inquiryToken,
      cityName,
      date,
      'hotel-availability'
    );

    try {
      // Read both required files
      const [defaultRequestFile, hotelCodesFile] = await Promise.all([
        fs.readFile(path.join(basePath, 'default_request.json'), 'utf8'),
        fs.readFile(path.join(basePath, 'hotel_codes.json'), 'utf8')
      ]);

      const defaultRequest = JSON.parse(defaultRequestFile);
      const hotelCodes = JSON.parse(hotelCodesFile);

      // Process hotel codes in batches
      const batchPromises = [];
      const batchResponses = {}; // Store responses to get search_id later

      for (let i = 0; i < hotelCodes.hotelCodes.length; i += BATCH_SIZE) {
        const batchHotelCodes = hotelCodes.hotelCodes.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE);
        const batchResponsePath = path.join(basePath, `batch_${batchNumber}_response.json`);

        const batchPromise = (async () => {
          try {
            // Check if batch response exists
            try {
              const existingBatchResponse = await fs.readFile(batchResponsePath, 'utf8');
              const parsedResponse = JSON.parse(existingBatchResponse);
              if (parsedResponse.data?.hotels) {
                batchResponses[batchNumber] = parsedResponse.data;
                return {
                  hotels: parsedResponse.data.hotels,
                  search_id: parsedResponse.data.search_id,
                  batchNumber
                };
              }
            } catch (err) {
              // Batch file doesn't exist, proceed with API call
            }

            // Prepare request data
            const requestData = {
              hotelCodes: batchHotelCodes,
              checkIn: defaultRequest.data.checkIn,
              checkOut: defaultRequest.data.checkOut,
              travelers: defaultRequest.data.travelers,
              nationality: defaultRequest.data.nationality,
              currency: defaultRequest.data.currency
            };

            // Make API call
            const response = await hotelAvailabilityService.fetchHotelAvailability(requestData);

            // Save batch response
            await fs.mkdir(path.dirname(batchResponsePath), { recursive: true });
            await fs.writeFile(
              batchResponsePath,
              JSON.stringify({
                metadata: {
                  inquiryToken,
                  cityName,
                  date,
                  apiType: 'hotel-availability',
                  batchNumber,
                  timestamp: new Date().toISOString()
                },
                data: response
              }, null, 2)
            );

            batchResponses[batchNumber] = response;
            return {
              hotels: response.hotels || [],
              search_id: response.search_id,
              batchNumber
            };
          } catch (error) {
            console.error(`Error processing batch ${batchNumber}:`, error);
            return { hotels: [], batchNumber };
          }
        })();

        batchPromises.push(batchPromise);
      }

      // Wait for all batches to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Combine results and attach search_id to each hotel
      let allHotels = [];
      batchResults.forEach(({ hotels, search_id, batchNumber }) => {
        const hotelsWithSearchId = hotels.map(hotel => ({
          ...hotel,
          search_id: search_id // Attach the batch's search_id to each hotel
        }));
        allHotels = allHotels.concat(hotelsWithSearchId);
      });

      // Apply pagination
      const start = (page - 1) * pageSize;
      const paginatedHotels = allHotels.slice(start, start + pageSize);

      // Return paginated results
      return res.json({
        success: true,
        data: {
          hotels: paginatedHotels,
          total: allHotels.length,
          hasMore: start + pageSize < allHotels.length,
          currentPage: page
        }
      });

    } catch (fileError) {
      // Fall back to default_response.json
      try {
        const defaultResponse = await fs.readFile(
          path.join(basePath, 'default_response.json'),
          'utf8'
        );
        const parsedResponse = JSON.parse(defaultResponse);
        const hotels = parsedResponse.data.hotels || [];
        const start = (page - 1) * pageSize;
        const paginatedHotels = hotels.slice(start, start + pageSize);

        return res.json({
          success: true,
          data: {
            hotels: paginatedHotels,
            total: hotels.length,
            hasMore: start + pageSize < hotels.length,
            currentPage: page
          }
        });
      } catch (fallbackError) {
        throw new Error('No hotel data available');
      }
    }

  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotels',
      error: error.message
    });
  }
};
/**
 * Recheck hotel rate
 */
const recheckHotelRate = async (req, res) => {
  const { searchId, groupCode, rateKey, checkIn } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    const recheckResponse = await hotelRecheckService.recheckRate(  // Use the service
      searchId,
      checkIn,
      groupCode,
      rateKey,
      inquiryToken
    );

    if (!recheckResponse?.hotel?.rate || recheckResponse.hotel.rate.rate_type !== 'bookable') {
      // If rate not bookable or expired, get fresh availability
      const availabilityResponse = await hotelAvailabilityService.fetchHotelAvailability({
        hotelCodes: [recheckResponse.hotel.hotel_code], 
        checkIn, 
        checkOut: checkIn, // Assuming 1 day for simplicity
        inquiryToken
      });

      if (!availabilityResponse?.hotels?.length) {
        throw new Error('Hotel no longer available');
      }

      // Get new rate key and recheck
      const newHotel = availabilityResponse.hotels[0];
      const newRateKey = newHotel.rate.rate_key;
      const newGroupCode = newHotel.rate.group_code;

      const newRecheckResponse = await hotelRecheckService.recheckRate(  // Use the service again
        availabilityResponse.search_id,
        checkIn,
        newGroupCode,
        newRateKey,
        inquiryToken
      );

      if (!newRecheckResponse?.hotel?.rate || newRecheckResponse.hotel.rate.rate_type !== 'bookable') {
        throw new Error('Hotel rate not bookable after refresh');
      }

      return res.json(newRecheckResponse);
    }

    res.json(recheckResponse);

  } catch (error) {
    console.error('Error rechecking hotel rate:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Validate hotel request
 */
const validateHotelRequest = (cityDetails, inquiry) => {
  if (!cityDetails || !cityDetails.city || !cityDetails.country) {
    throw new Error('Invalid city details provided');
  }
  if (!cityDetails.startDate || !cityDetails.endDate) {
    throw new Error('Invalid dates provided');
  }
  if (!inquiry || !inquiry.preferences || !inquiry.preferences.budget) {
    throw new Error('Invalid preferences provided');
  }
  if (!inquiry.travelersDetails || !inquiry.travelersDetails.rooms) {
    throw new Error('Invalid travelers details provided');
  }

  // Validate each room's travelers information
  inquiry.travelersDetails.rooms.forEach((room, index) => {
    if (!room.adults || (room.adults.length === 0 && !Number.isInteger(room.adults))) {
      throw new Error(`Invalid number of adults in room ${index + 1}`);
    }
    if (room.children && !Array.isArray(room.children)) {
      throw new Error(`Invalid children ages format in room ${index + 1}`);
    }
  });

  // Validate dates
  const startDate = new Date(cityDetails.startDate);
  const endDate = new Date(cityDetails.endDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (endDate <= startDate) {
    throw new Error('End date must be after start date');
  }
};


/**
 * Export all functions
 */
module.exports = {
  // Main functions
  searchHotels: processHotelsForCity,
  getAvailableHotels,
  recheckHotelRate,
  validateHotelRequest,
  processHotelsForCity,
  getHotelsForCity,

  // Helper functions
  helpers: {
    getCountryCode2Letter,
    getCityCode,
    getAllHotelsForCity,
    processHotelRates,
    processRecheckResponse,
    formatHotelDetails,  // Add this line
    logApiData
  }
};