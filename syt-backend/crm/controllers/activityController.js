const { checkActivityAvailability } = require('../../shared/services/activityServicesGRNC/activityAvailabilityService');
const { checkProductInfo } = require('../../shared/services/activityServicesGRNC/activityProductInfoService');
const { createActivityReference: createReference } = require('../../shared/services/activityServicesGRNC/activityBookingReferenceService');
const ActivityBookingService = require('../../shared/services/activityServicesGRNC/activityBookingService');
const apiLogger = require('../../shared/helpers/apiLogger');
const ActivityDestination = require('../../shared/models/itineraryModel/ActivityDestination');
const { checkAvailabilityDetail } = require('../../shared/services/activityServicesGRNC/activityAvailabilityDetailService');

const searchActivities = async (req, res) => {
  try {
    const {
      provider = 'GRNC', // Default to GRNC if not specified
      currency,
      fromDate,
      toDate,
      adults,
      childAges,
      cities
    } = req.body;

    // Validate required fields
    if (!fromDate || !cities || !cities.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromDate and cities are required'
      });
    }

    // Generate a unique inquiry token for logging
    const inquiryToken = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check availability for each city
    const availabilityPromises = cities.map(async (city) => {
      try {
        // Find the activity destination using the destination_id
        const activityDestination = await ActivityDestination.findOne({ 
          destination_id: city.destination_id 
        });

        if (!activityDestination) {
          return {
            cityId: city.destination_id,
            success: false,
            message: 'Activity destination not found'
          };
        }

        const cityData = {
          code: activityDestination.destination_code,
          name: activityDestination.name,
          country: activityDestination.country
        };

        const travelers = {
          adults: Array(adults).fill({ age: 30 }), // Default age for adults
          childAges: childAges || []
        };

        const availability = await checkActivityAvailability(cityData, fromDate, travelers, inquiryToken);
        return {
          cityId: city.destination_id,
          cityData,
          availability
        };
      } catch (error) {
        console.error(`Error checking availability for city ${city.destination_id}:`, error);
        return {
          cityId: city.destination_id,
          success: false,
          message: 'Failed to check availability'
        };
      }
    });

    const results = await Promise.all(availabilityPromises);

    // Process and format the results
    const formattedResults = results.map(result => {
      if (!result.availability) {
        return {
          cityId: result.cityId,
          success: false,
          message: result.message || 'No availability found'
        };
      }

      // Transform the availability data into a more frontend-friendly format
      const activities = result.availability.data.map(activity => ({
        code: activity.code,
        title: activity.title,
        shortDesc: activity.shortDesc,
        duration: activity.duration,
        startTime: activity.startTime,
        amount: activity.amount,
        currency: activity.currency,
        rating: activity.rating,
        imgURL: activity.imgURL || 'https://via.placeholder.com/400x300',
        groupCode: activity.groupCode,
        catids: activity.catids ? activity.catids.split(',') : [],
        subcatids: activity.subcatids !== 'No subcat' ? activity.subcatids.split(',') : [],
        sortOrder: activity.sortOrder,
        searchId: result.availability.searchId,
        dateStamp: result.availability.dateStamp,
        errorType: result.availability.errorType,
        extraInfo: result.availability.extraInfo,
        errorCodes: result.availability.errorCodes,
        errorMessages: result.availability.errorMessages
      }));

      return {
        cityId: result.cityId,
        success: true,
        activities,
        searchId: result.availability.searchId,
        dateStamp: result.availability.dateStamp,
        errorType: result.availability.errorType,
        extraInfo: result.availability.extraInfo,
        errorCodes: result.availability.errorCodes,
        errorMessages: result.availability.errorMessages
      };
    });

    res.json({
      success: true,
      data: formattedResults
    });

  } catch (error) {
    console.error('Error searching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search activities',
      error: error.message
    });
  }
};

const getActivityDetails = async (req, res) => {
  try {
    const { code, groupCode, searchId } = req.body;

    // Validate required fields
    if (!code || !groupCode || !searchId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, groupCode, and searchId are required'
      });
    }

    // Generate a unique inquiry token for logging
    const inquiryToken = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare travelers data (default to 1 adult)
    const travelers = {
      adults: [{ age: 30 }],
      childAges: []
    };

    // Call the product info service
    const productInfo = await checkProductInfo(
      code,
      travelers,
      groupCode,
      searchId,
      inquiryToken,
      'City Name', // This will be replaced with actual city name if needed
      new Date().toISOString().split('T')[0] // Current date as default
    );

    if (!productInfo) {
      return res.status(404).json({
        success: false,
        message: 'Activity details not found'
      });
    }

    res.json({
      success: true,
      data: productInfo
    });

  } catch (error) {
    console.error('Error getting activity details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity details',
      error: error.message
    });
  }
};

const bookActivity = async (req, res) => {
  try {
    const bookingData = req.body;
    const provider = req.params.provider || 'GRNC';
    
    // Generate a unique inquiry token for logging
    const inquiryToken = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log the incoming data
    await apiLogger.logApiData({
      inquiryToken,
      cityName: bookingData.cityName || 'Unknown',
      date: bookingData.fromDate || new Date().toISOString().split('T')[0],
      apiType: 'activity_booking_request',
      requestData: {
        ...bookingData,
        // Don't log sensitive data
        QuestionAnswers: bookingData.QuestionAnswers ? `[${bookingData.QuestionAnswers.length} answers]` : null
      },
      activityCode: bookingData.activityCode
    });

    // Validate required fields
    if (!bookingData.bookingRef || !bookingData.lead || !bookingData.QuestionAnswers || !bookingData.travellers) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking data: bookingRef, lead, QuestionAnswers, or travellers'
      });
    }
    
    // Validate lead traveler info
    if (!bookingData.lead.name || !bookingData.lead.surname || !bookingData.lead.clientNationality) {
      return res.status(400).json({
        success: false,
        message: 'Missing required lead traveler information'
      });
    }

    // Adapt the incoming data to match what the service expects
    const transformedActivity = {
      searchId: bookingData.searchId,
      activityCode: bookingData.activityCode,
      lead: {
        title: bookingData.lead.title,
        name: bookingData.lead.name,
        surname: bookingData.lead.surname,
        clientNationality: bookingData.lead.clientNationality,
        age: String(bookingData.lead.age) // Ensure age is a string
      },
      agentRef: bookingData.agentRef,
      // Use ratekey directly, don't reassign it
      ratekey: bookingData.ratekey,
      groupCode: bookingData.groupCode,
      hotelId: bookingData.hotelId || null,
      languageGuide: bookingData.languageGuide,
      QuestionAnswers: bookingData.QuestionAnswers,
      // Ensure traveller data is formatted correctly
      travellers: bookingData.travellers.map(traveller => ({
        title: traveller.title,
        name: traveller.name,
        surname: traveller.surname,
        type: traveller.type,
        age: String(traveller.age) // Ensure age is a string
      }))
    };
    
    // Call the booking service
    const result = await ActivityBookingService.bookActivity({
      inquiryToken,
      cityName: bookingData.cityName || 'Dubai',
      date: bookingData.fromDate || new Date().toISOString().split('T')[0],
      transformedActivity
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Booking failed',
        details: result.data
      });
    }
    
    // Log successful booking
    await apiLogger.logApiData({
      inquiryToken,
      cityName: bookingData.cityName || 'Unknown',
      date: bookingData.fromDate || new Date().toISOString().split('T')[0],
      apiType: 'activity_booking_success',
      responseData: {
        bookingId: result.data.bookingId,
        status: result.data.status
      },
      activityCode: bookingData.activityCode
    });

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error booking activity:', error);
    
    // Log the error
    apiLogger.logApiData({
      inquiryToken: `ERROR_${Date.now()}`,
      cityName: req.body.cityName || 'Unknown',
      date: req.body.fromDate || new Date().toISOString().split('T')[0],
      apiType: 'activity_booking_error',
      requestData: {
        activityCode: req.body.activityCode
      },
      responseData: {
        error: error.message,
        stack: error.stack
      },
      activityCode: req.body.activityCode
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to book activity',
      error: error.message
    });
  }
};

const getBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider = 'GRNC' } = req.params;

    // TODO: Implement booking status check
    // This would typically involve:
    // 1. Fetching the booking from your database
    // 2. Checking the status with the provider
    // 3. Updating the status in your database
    // 4. Returning the current status

    res.json({
      success: true,
      message: 'Booking status endpoint to be implemented'
    });
  } catch (error) {
    console.error('Error getting booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking status',
      error: error.message
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider = 'GRNC' } = req.params;

    // TODO: Implement booking cancellation
    // This would typically involve:
    // 1. Validating the booking exists and can be cancelled
    // 2. Calling the provider's cancellation API
    // 3. Updating the booking status in your database
    // 4. Handling any refunds if applicable

    res.json({
      success: true,
      message: 'Booking cancellation endpoint to be implemented'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

const getActivityAvailabilityDetails = async (req, res) => {
  try {
    const { searchId, code, groupCode } = req.body;
    const provider = req.params.provider || 'GRNC';

    // Validate required fields
    if (!searchId || !code || !groupCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: searchId, code, and groupCode are required'
      });
    }

    // Generate a simple inquiry token using timestamp
    const inquiryToken = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get city name from the searchId (you might need to extract this from your search results)
    const cityName = 'Dubai'; // This should come from your search results or be passed in the request

    // Get current date
    const date = new Date().toISOString().split('T')[0];

    // Call the availability service
    const options = await checkAvailabilityDetail(
      searchId,
      code,
      groupCode,
      inquiryToken,
      cityName,
      date
    );

    if (!options) {
      return res.status(404).json({
        success: false,
        message: 'No availability found for the specified criteria'
      });
    }

    res.json({
      success: true,
      data: {
        options,
        groupCode,
        Code: code
      }
    });
  } catch (error) {
    console.error('Error checking activity availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check activity availability',
      error: error.message
    });
  }
};

const createActivityReference = async (req, res) => {
  try {
    const { productcode, searchId, starttime, productoptioncode } = req.body;

    // Validate required fields
    if (!productcode || !searchId || !productoptioncode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productcode, searchId, and productoptioncode are required'
      });
    }

    // Generate a unique inquiry token for logging
    const inquiryToken = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create reference payload
    const params = {
      productcode,
      searchId,
      productoptioncode
    };

    // Add starttime if provided
    if (starttime) {
      params.starttime = starttime;
    }

    // Call the reference service
    const referenceData = await createReference(params, inquiryToken, 'City Name', new Date().toISOString().split('T')[0]);

    if (!referenceData || !referenceData.bookingRef) {
      return res.status(404).json({
        success: false,
        message: 'Failed to create activity reference'
      });
    }

    res.json({
      success: true,
      data: referenceData
    });

  } catch (error) {
    console.error('Error creating activity reference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity reference',
      error: error.message
    });
  }
};

module.exports = {
  searchActivities,
  getActivityDetails,
  bookActivity,
  getBookingStatus,
  cancelBooking,
  getActivityAvailabilityDetails,
  createActivityReference
}; 