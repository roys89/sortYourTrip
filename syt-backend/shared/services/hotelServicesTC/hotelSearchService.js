const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelSearchService {
  static async searchHotels(searchParams, accessToken, inquiryToken) {
    // Create variables outside try/catch for access in both success and error cases
    let requestBody;
    let requestBodyForLogging;

    try {
      // --- Construct the request body based on external API spec ---
      requestBody = {
        checkIn: searchParams.checkIn, // Will be formatted later
        checkOut: searchParams.checkOut, // Will be formatted later
        filterBy: {
          freeBreakfast: searchParams.filterBy?.freeBreakfast ?? false,
          isRefundable: searchParams.filterBy?.isRefundable ?? false,
          subLocationIds: searchParams.filterBy?.subLocationIds ?? null, // Default to null if not provided
          ratings: searchParams.filterBy?.ratings ?? null, // Default to null, will be formatted
          hotelName: searchParams.filterBy?.hotelName ?? null,
          facilities: searchParams.filterBy?.facilities ?? null, // Default to null, will be formatted
          type: searchParams.filterBy?.type ?? null,
          tags: searchParams.filterBy?.tags ?? null, // Default to null, will be formatted
          reviewRatings: searchParams.filterBy?.reviewRatings ?? null // Default to null, will be formatted
        },
        nationality: searchParams.nationality ?? 'IN', // Default to 'IN' or null based on requirements
        occupancies: searchParams.occupancies, // Will be formatted later
        locationId: searchParams.locationId ?? null,
        // Handle hotelIds array or single hotelId
        hotelIds: null,
        // Default sort order if not provided
        sortBy: searchParams.sortBy ?? { finalRate: 'default', id: 1, value: 1, label: 'Relevance' }, 
        page: searchParams.page ? parseInt(searchParams.page) : 1, // Default page 1
        traceId: searchParams.traceId ?? null // Use traceId if provided for pagination/continuity
      };
      
      // Handle hotelId vs hotelIds appropriately
      if (searchParams.hotelIds) {
        // If hotelIds is provided, use it directly
        requestBody.hotelIds = Array.isArray(searchParams.hotelIds) ? searchParams.hotelIds : [searchParams.hotelIds];
      } else if (searchParams.hotelId) {
        // If only hotelId is provided, use it directly as a single value - DO NOT WRAP IN ARRAY
        delete requestBody.hotelIds; // Remove hotelIds field
        requestBody.hotelId = searchParams.hotelId; // Set hotelId directly
        console.log("Using direct hotel ID:", searchParams.hotelId);
      }
      
      // --- Validation --- 
      // Validate required fields - Either locationId, hotelId, or hotelIds must be present
      if (!requestBody.locationId && !requestBody.hotelId && (!requestBody.hotelIds || requestBody.hotelIds.length === 0)) {
        console.error("Hotel search validation failed: Missing required parameters", {
          locationId: requestBody.locationId,
          hotelId: requestBody.hotelId,
          hotelIds: requestBody.hotelIds,
          originalHotelId: searchParams.hotelId
        });
        throw new Error('Either Location ID or Hotel ID is required for hotel search');
      }

      // Format and Validate dates
      if (!requestBody.checkIn || !requestBody.checkOut) {
          throw new Error('Check-in and Check-out dates are required');
      }
      requestBody.checkIn = new Date(requestBody.checkIn).toISOString().split('T')[0];
      requestBody.checkOut = new Date(requestBody.checkOut).toISOString().split('T')[0];

      const checkInDate = new Date(requestBody.checkIn);
      const checkOutDate = new Date(requestBody.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }

      // Format and Validate occupancies
      if (!requestBody.occupancies || !Array.isArray(requestBody.occupancies) || requestBody.occupancies.length === 0) {
          throw new Error('Occupancies are required');
      }
      requestBody.occupancies = requestBody.occupancies.map(occupancy => ({
        numOfAdults: parseInt(occupancy.numOfAdults) || 1,
        childAges: Array.isArray(occupancy.childAges) ? occupancy.childAges.map(age => parseInt(age)).filter(age => !isNaN(age) && age >= 0 && age <= 17) : []
      }));
      if (requestBody.occupancies.some(occ => occ.numOfAdults < 1)) {
         throw new Error("Invalid occupancy data: Each room must have at least one adult.");
      }

      // Format filterBy arrays (ensure they are arrays of correct types or null)
      if (requestBody.filterBy) {
        if (requestBody.filterBy.ratings) {
          requestBody.filterBy.ratings = Array.isArray(requestBody.filterBy.ratings)
            ? requestBody.filterBy.ratings.map(r => parseInt(r)).filter(r => !isNaN(r))
            : null;
          if (requestBody.filterBy.ratings && requestBody.filterBy.ratings.length === 0) requestBody.filterBy.ratings = null;
        }
        if (requestBody.filterBy.reviewRatings) {
          requestBody.filterBy.reviewRatings = Array.isArray(requestBody.filterBy.reviewRatings)
            ? requestBody.filterBy.reviewRatings.map(r => parseInt(r)).filter(r => !isNaN(r))
            : null;
           if (requestBody.filterBy.reviewRatings && requestBody.filterBy.reviewRatings.length === 0) requestBody.filterBy.reviewRatings = null;
        }
        if (requestBody.filterBy.facilities) {
          requestBody.filterBy.facilities = Array.isArray(requestBody.filterBy.facilities)
            ? requestBody.filterBy.facilities.map(f => String(f))
            : null;
           if (requestBody.filterBy.facilities && requestBody.filterBy.facilities.length === 0) requestBody.filterBy.facilities = null;
        }
        if (requestBody.filterBy.tags) {
          requestBody.filterBy.tags = Array.isArray(requestBody.filterBy.tags)
            ? requestBody.filterBy.tags.map(t => String(t))
            : null;
           if (requestBody.filterBy.tags && requestBody.filterBy.tags.length === 0) requestBody.filterBy.tags = null;
        }
        if (requestBody.filterBy.subLocationIds) {
          requestBody.filterBy.subLocationIds = Array.isArray(requestBody.filterBy.subLocationIds)
            ? requestBody.filterBy.subLocationIds.map(id => parseInt(id)).filter(id => !isNaN(id))
            : null;
           if (requestBody.filterBy.subLocationIds && requestBody.filterBy.subLocationIds.length === 0) requestBody.filterBy.subLocationIds = null;
        }
      }
      
      // --- NEW: Validate sortBy object structure (example validation) ---
      if (requestBody.sortBy && typeof requestBody.sortBy === 'object') {
          // Ensure finalRate, if present, is a number
          if (requestBody.sortBy.hasOwnProperty('finalRate') && typeof requestBody.sortBy.finalRate !== 'number') {
              console.warn("HotelSearchService: Invalid finalRate in sortBy, removing.", requestBody.sortBy);
              delete requestBody.sortBy.finalRate;
          }
          
          // IMPORTANT: If finalRate doesn't exist at all, set it to 'default'
          if (!requestBody.sortBy.hasOwnProperty('finalRate')) {
              requestBody.sortBy.finalRate = 'default';
              console.log("HotelSearchService: Added default finalRate='default' to sortBy", requestBody.sortBy);
          }
          
          // IMPORTANT: Check if id and value are missing, add defaults if needed
          if (!requestBody.sortBy.hasOwnProperty('id') || !requestBody.sortBy.hasOwnProperty('value')) {
              if (requestBody.sortBy.label === 'Relevance') {
                  // For relevance sort, add default id and value
                  requestBody.sortBy.id = 1;
                  requestBody.sortBy.value = 1;
                  console.log("HotelSearchService: Added default id/value for Relevance sort", requestBody.sortBy);
              }
          }
      } else {
          // If sortBy is invalid or missing, default it
          console.warn("HotelSearchService: Invalid or missing sortBy, using default.", requestBody.sortBy);
          requestBody.sortBy = { id: 1, value: 1, label: 'Relevance', finalRate: 'default' };
      }
      // --- END: Validate sortBy ---
      
      // --- Create a deep copy for logging BEFORE deleting null fields ---
      requestBodyForLogging = JSON.parse(JSON.stringify(requestBody));
      
      // --- Remove null/empty fields from the ACTUAL request body sent to the API ---
      if (requestBody.filterBy) {
          for (const key in requestBody.filterBy) {
              if (requestBody.filterBy[key] === null || (Array.isArray(requestBody.filterBy[key]) && requestBody.filterBy[key].length === 0)) {
                  delete requestBody.filterBy[key];
              }
          }
          // If filterBy becomes empty, remove it entirely (optional, depends on API)
          if (Object.keys(requestBody.filterBy).length === 0) {
              delete requestBody.filterBy;
          }
      }
      // Clean up hotelIds if empty
      if (!requestBody.hotelIds || requestBody.hotelIds.length === 0) {
          delete requestBody.hotelIds;
      }
      // Clean up hotelId if null
      if (requestBody.hotelId === null || requestBody.hotelId === undefined) {
          delete requestBody.hotelId;
      }
      // Clean up locationId if null
      if (requestBody.locationId === null) {
          delete requestBody.locationId;
      }
      // Clean up traceId if null
      if (requestBody.traceId === null) {
          delete requestBody.traceId;
      }
       // Remove nationality if it was defaulted and should be omitted
      // if (requestBody.nationality === 'IN' && !searchParams.nationality) { 
      //     delete requestBody.nationality;
      // }

      // --- Make API Call (using the modified requestBody) ---
      const response = await axios.post(
        'https://hms-api-sandbox.travclan.com/hms/external/api/v1/hotels/search',
        requestBody, // Send the pruned body
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Authorization-Type': 'external-service',
            'source': 'website',
            'Content-Type': 'application/json'
          }
        }
      );

      // --- Log API data (using the copy made BEFORE deleting fields) ---
      const logData = {
        inquiryToken,
        cityName: searchParams.cityName, // Keep for logging context
        date: requestBodyForLogging.checkIn, // Use date from logged body
        apiType: 'hotel_search',
        requestData: { // Log the intended request structure
          ...requestBodyForLogging,
          headers: {
            'Authorization': 'Bearer [REDACTED]',
            'Authorization-Type': 'external-service',
            'source': 'website'
          }
        },
        responseData: response.data
      };
      await apiLogger.logApiData(logData);

      return response.data;

    } catch (error) {
      // Use the same requestBodyForLogging for error cases that was created for success
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName: searchParams.cityName, 
        date: searchParams.checkIn, 
        apiType: 'hotel_search_error',
        requestData: requestBodyForLogging ? {
          ...requestBodyForLogging,
          headers: {
            'Authorization': 'Bearer [REDACTED]',
            'Authorization-Type': 'external-service',
            'source': 'website'
          }
        } : {
          // If requestBodyForLogging wasn't created yet, create a similar structure
          originalSearchParams: searchParams,
          hotelId: searchParams.hotelId,
          locationId: searchParams.locationId,
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          occupancies: searchParams.occupancies
        },
        responseData: { 
          error: error.message,
          details: error.response?.data || {}
        }
      };
      
      await apiLogger.logApiData(errorLogData);
      throw error; 
    }
  }
}

module.exports = HotelSearchService;