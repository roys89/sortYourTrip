const Activity = require('../../models/itineraryModel/Activity');
const path = require('path');
const fs = require('fs');
const apiLogger = require('../../helpers/apiLogger');
const activityAvailabilityService = require('../../services/activityServices/activityAvailabilityService');
const activityProductInfoService = require('../../services/activityServices/activityProductInfoService');
const activityAvailabilityDetailService = require('../../services/activityServices/activityAvailabilityDetailService');
const ActivityBookingService = require('../../services/activityServices/activityBookingService');
const { createActivityReference } = require('../../services/activityServices/activityBookingReferenceService');

// Constants
const DURATION_CATEGORIES = {
  QUARTER_DAY: 'quarter_day', // 1-3 hours
  HALF_DAY: 'half_day',      // 3-6 hours
  FULL_DAY: 'full_day'       // 6-12 hours
};

const TIME_SLOTS = {
  MORNING: 'morning',     // 9:00 - 12:00
  AFTERNOON: 'afternoon', // 12:00 - 16:00
  EVENING: 'evening'      // 16:00 - 20:00
};

const DEFAULT_TIMES = {
  [TIME_SLOTS.MORNING]: '09:00',
  [TIME_SLOTS.AFTERNOON]: '13:00',
  [TIME_SLOTS.EVENING]: '16:00'
};

// Helper function to get duration category
const getDurationCategory = (duration) => {
  if (!duration || duration <= 0) return null;
  if (duration <= 3) return DURATION_CATEGORIES.QUARTER_DAY;
  if (duration <= 6) return DURATION_CATEGORIES.HALF_DAY;
  return DURATION_CATEGORIES.FULL_DAY;
};

// Helper function to parse time
const parseTime = (timeStr) => {
  if (timeStr === 'Flexible') return -1;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes / 60);
};

// Helper function to format time
const formatTime = (hour) => {
  const wholeHours = Math.floor(hour);
  const minutes = Math.round((hour - wholeHours) * 60);
  return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper function to validate and normalize time
const validateAndNormalizeTime = (timeStr) => {
  if (timeStr === 'Flexible') return timeStr;
  
  // Parse hours and minutes
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Validate time
  if (isNaN(hours) || isNaN(minutes) || 
      hours < 0 || hours >= 24 || 
      minutes < 0 || minutes >= 60) {
    return null;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper function to determine time slot based on hour
const getTimeSlot = (timeStr) => {
  if (timeStr === 'Flexible') return null;
  const hour = parseInt(timeStr.split(':')[0]);
  
  if (hour >= 9 && hour < 12) return TIME_SLOTS.MORNING;
  if (hour >= 12 && hour < 16) return TIME_SLOTS.AFTERNOON;
  if (hour >= 16 && hour < 20) return TIME_SLOTS.EVENING;
  return null;
};

// Helper function to calculate end time
const calculateEndTime = (startTimeStr, duration) => {
  if (startTimeStr === 'Flexible') return 'Flexible';
  
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + (minutes || 0) + (duration * 60);
  
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  // If end time would be after 20:00, adjust duration
  if (endHours >= 20) {
    return '20:00';
  }
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Helper function to get available time slot
const getAvailableTimeSlot = (existingActivities, newActivityDuration) => {
  const timeSlots = {
    [TIME_SLOTS.MORNING]: { start: 9, end: 12, available: true },
    [TIME_SLOTS.AFTERNOON]: { start: 12, end: 16, available: true },
    [TIME_SLOTS.EVENING]: { start: 16, end: 20, available: true }
  };

  // Mark slots as unavailable based on existing activities
  existingActivities.forEach(activity => {
    if (activity.selectedTime === 'Flexible') return;
    
    const startHour = parseInt(activity.selectedTime.split(':')[0]);
    const endHour = parseInt(calculateEndTime(activity.selectedTime, activity.duration).split(':')[0]);
    
    Object.entries(timeSlots).forEach(([slot, time]) => {
      if (startHour < time.end && endHour > time.start) {
        time.available = false;
      }
    });
  });

  // Find first available slot that can fit the new activity
  for (const [slot, time] of Object.entries(timeSlots)) {
    if (time.available && (time.end - time.start) >= newActivityDuration) {
      return slot;
    }
  }

  return null;
};

// Helper function to check if two time slots overlap
const doTimeSlotsOverlap = (slot1Start, slot1End, slot2Start, slot2End) => {
  const start1 = parseTime(slot1Start);
  const end1 = parseTime(slot1End);
  const start2 = parseTime(slot2Start);
  const end2 = parseTime(slot2End);

  return start1 < end2 && end1 > start2;
};

// Helper function to find available time slot
const findAvailableTimeSlot = (timeline, activity) => {
  // Don't process invalid activities
  if (!activity.duration) return null;

  // Define possible start times throughout the day
  const possibleStartTimes = [
    { time: '09:00', slot: TIME_SLOTS.MORNING },
    { time: '10:30', slot: TIME_SLOTS.MORNING },
    { time: '13:00', slot: TIME_SLOTS.AFTERNOON },
    { time: '14:30', slot: TIME_SLOTS.AFTERNOON },
    { time: '16:00', slot: TIME_SLOTS.EVENING },
    { time: '17:30', slot: TIME_SLOTS.EVENING }
  ];

  // If activity has preferred time and it's valid, try that first
  if (activity.departureTimes?.[0]?.time && 
      activity.departureTimes[0].time !== 'Flexible') {
    const preferredTime = validateAndNormalizeTime(activity.departureTimes[0].time);
    if (preferredTime) {
      const endTime = calculateEndTime(preferredTime, activity.duration);
      const isSlotAvailable = !timeline.some(entry => 
        doTimeSlotsOverlap(
          preferredTime, 
          endTime,
          entry.startTime,
          entry.endTime
        )
      );

      if (isSlotAvailable) {
        return {
          startTime: preferredTime,
          endTime: endTime
        };
      }
    }
  }

  // Try each possible start time
  for (const { time: startTime } of possibleStartTimes) {
    const endTime = calculateEndTime(startTime, activity.duration);
    
    // Skip if activity would end after 20:00
    if (parseTime(endTime) > parseTime('20:00')) continue;

    // Check if this slot conflicts with any existing activities
    const isSlotAvailable = !timeline.some(entry => 
      doTimeSlotsOverlap(
        startTime,
        endTime,
        entry.startTime,
        entry.endTime
      )
    );

    if (isSlotAvailable) {
      return {
        startTime,
        endTime
      };
    }
  }

  return null;
};

// Helper function to calculate activity quality score
const calculateActivityQualityScore = (activity) => {
  let score = 0;
  
  // Mandatory activities get highest priority
  if (activity.mandatory) score += 100;
  
  // Consider ranking (0-10 scale)
  score += (activity.ranking || 0) * 5;
  
  // Consider rating (usually 0-5 scale)
  score += (activity.rating || 0) * 10;
  
  // Prefer activities with more detailed information
  if (activity.description) score += 5;
  if (activity.imageUrl) score += 3;
  if (activity.inclusions?.length > 0) score += 2;
  
  // Consider timing flexibility
  if (activity.isFlexibleTiming) score += 2;
  
  return score;
};

// Helper functions for different day types
const selectFirstDayActivities = (categorized) => {
  const selected = [];
  
  // For first day, prioritize afternoon and evening activities
  // Try to get 2 quarter-day activities for afternoon/evening
  const quarterDayActivities = categorized[DURATION_CATEGORIES.QUARTER_DAY]
    .filter(activity => 
      !activity.timeSlot || 
      activity.timeSlot === 'afternoon' || 
      activity.timeSlot === 'evening' ||
      activity.isFlexibleTiming
    )
    .slice(0, 2);

  // Add one half-day activity if available and timing is suitable
  const suitableHalfDay = categorized[DURATION_CATEGORIES.HALF_DAY]
    .find(activity => 
      !activity.timeSlot || 
      activity.timeSlot === 'afternoon' ||
      activity.isFlexibleTiming
    );

  if (suitableHalfDay) {
    selected.push(suitableHalfDay);
  }
  selected.push(...quarterDayActivities);

  return selected;
};

const selectLastDayActivities = (categorized) => {
  const selected = [];
  
  // For last day, only morning activities
  // Try to get 2 quarter-day activities for morning
  const quarterDayActivities = categorized[DURATION_CATEGORIES.QUARTER_DAY]
    .filter(activity => 
      !activity.timeSlot || 
      activity.timeSlot === 'morning' ||
      activity.isFlexibleTiming
    )
    .slice(0, 2);

  // Add one half-day morning activity if available
  const morningHalfDay = categorized[DURATION_CATEGORIES.HALF_DAY]
    .find(activity => 
      !activity.timeSlot || 
      activity.timeSlot === 'morning' ||
      activity.isFlexibleTiming
    );

  if (morningHalfDay && morningHalfDay.duration <= 4) {
    selected.push(morningHalfDay);
  }
  selected.push(...quarterDayActivities);

  return selected;
};

const selectRegularDayActivities = (categorized) => {
  const selected = [];
  
  // Try to get 3 quarter-day activities first
  const quarterDayActivities = categorized[DURATION_CATEGORIES.QUARTER_DAY].slice(0, 3);
  if (quarterDayActivities.length === 3) {
    return quarterDayActivities;
  }

  // If we don't have enough quarter-day activities, try 2 half-day activities
  const halfDayActivities = categorized[DURATION_CATEGORIES.HALF_DAY].slice(0, 2);
  if (halfDayActivities.length === 2) {
    return halfDayActivities;
  }

  // If we don't have enough half-day activities, try one full-day activity
  if (categorized[DURATION_CATEGORIES.FULL_DAY].length > 0) {
    return [categorized[DURATION_CATEGORIES.FULL_DAY][0]];
  }

  // If we couldn't fulfill any of the ideal patterns, mix and match what we have
  // Try to fill the day as much as possible
  const remainingQuarterDay = quarterDayActivities.length;
  const remainingHalfDay = halfDayActivities.length;

  if (remainingQuarterDay + (remainingHalfDay * 2) <= 3) {
    selected.push(...quarterDayActivities);
    selected.push(...halfDayActivities);
  } else {
    // If we have too many activities, prioritize based on quality score
    const allPossibleActivities = [
      ...quarterDayActivities,
      ...halfDayActivities,
      ...categorized[DURATION_CATEGORIES.FULL_DAY]
    ];

    // Sort by quality score and pick top activities that fit within a day
    allPossibleActivities.sort((a, b) => b.qualityScore - a.qualityScore);
    
    let totalDuration = 0;
    for (const activity of allPossibleActivities) {
      if (totalDuration + activity.duration <= 8) { // Maximum 8 hours per day
        selected.push(activity);
        totalDuration += activity.duration;
      }
    }
  }

  return selected;
};

// Enhanced selectActivities function with better distribution
const selectActivities = (activities, dayContext = {}) => {
  // First categorize by duration
  const durationsCategories = {
    [DURATION_CATEGORIES.QUARTER_DAY]: [],
    [DURATION_CATEGORIES.HALF_DAY]: [],
    [DURATION_CATEGORIES.FULL_DAY]: []
  };

  // Then subcategorize by time preference
  activities.forEach(activity => {
    const durationCategory = getDurationCategory(activity.duration);
    if (durationCategory) {
      activity.qualityScore = calculateActivityQualityScore(activity);
      durationsCategories[durationCategory].push(activity);
    }
  });

  // Sort each category by quality score
  Object.values(durationsCategories).forEach(categoryActivities => {
    categoryActivities.sort((a, b) => b.qualityScore - a.qualityScore);
  });

  return dayContext.isFirstDay ? 
    selectFirstDayActivities(durationsCategories) :
    dayContext.isLastDay ? 
      selectLastDayActivities(durationsCategories) :
      selectRegularDayActivities(durationsCategories);
};
// Helper function to add buffer time to a time string
const addBufferToTime = (timeStr, bufferMinutes) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + bufferMinutes;
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

// Updated assignTimeSlots function
const assignTimeSlots = (selectedActivities) => {
  const timeline = [];
  const processedActivities = [];
  const BUFFER_TIME = 60; // 60 minutes buffer between activities

  // Sort activities by preferred time if available
  const sortedActivities = [...selectedActivities].sort((a, b) => {
    const aTime = a.departureTimes?.[0]?.time || 'Flexible';
    const bTime = b.departureTimes?.[0]?.time || 'Flexible';
    if (aTime === 'Flexible' && bTime === 'Flexible') return 0;
    if (aTime === 'Flexible') return 1;
    if (bTime === 'Flexible') return -1;
    return parseTime(aTime) - parseTime(bTime);
  });

  for (const activity of sortedActivities) {
    // Find available slot with buffer time
    const slot = findAvailableTimeSlot(timeline, activity);
    if (!slot) continue;

    const processedActivity = {
      ...activity,
      selectedTime: slot.startTime,
      endTime: slot.endTime,
      timeSlot: getTimeSlot(slot.startTime),
      departureTime: {
        time: slot.startTime,
        code: activity.departureTimes?.[0]?.code || 'DEFAULT'
      }
    };

    timeline.push({
      startTime: slot.startTime,
      endTime: addBufferToTime(slot.endTime, BUFFER_TIME),
      activity: processedActivity
    });

    processedActivities.push(processedActivity);
  }

  return processedActivities;
};
// 4. Add Activity Validation
const validateActivity = (activity) => {
  if (!activity.activityCode || !activity.duration) {
    console.log(`Invalid activity: ${activity.activityName}`);
    return false;
  }

  if (activity.departureTimes?.length === 0) {
    console.log(`No departure times for activity: ${activity.activityName}`);
    return false;
  }

  return true;
};

// Helper function to extract offline activity details
const extractOfflineActivityDetails = (activity) => {
  return {
    street: activity.street,
    city: activity.city,
    state: activity.state,
    country: activity.country,
    continent: activity.continent,
    postalCode: activity.postalCode,
    lat: activity.lat,
    long: activity.long,
    budget: activity.budget,
    openTime: activity.openTime,
    closeTime: activity.closeTime,
    activityPeriod: activity.activityPeriod,
    category: activity.category,
    imageUrl: activity.imageUrl,
    rating: activity.rating,
    ranking: activity.ranking,
    preference: activity.preference,
    mandatory: activity.mandatory,
    fullAddress: activity.fullAddress,
    description: activity.description,
    inclusions: activity.inclusion,
    exclusions: activity.exclusion,
    packageDetails: {
      amount: 0,
      currency: 'INR',
    },
    availabilityDetails: null,
    searchId: null,
    bookingStatus: 'pending' 
  };
};

// Process online activity with external service calls
const processOnlineActivity = async (
  baseDetails,
  activity,
  city,
  travelers,
  inquiryToken,
  itineraryDates
) => {
  try {
    const availabilityResponse = await activityAvailabilityService.checkActivityAvailability(
      { code: city.code, name: city.name || city.city },
      itineraryDates.fromDate,
      travelers,
      inquiryToken
    );

    if (!availabilityResponse?.data?.[0]?.groupCode) {
      return null;
    }

    const { searchId } = availabilityResponse;
    const groupCode = availabilityResponse.data[0].groupCode;

    const productInfo = await activityProductInfoService.checkProductInfo(
      activity.activityCode,
      travelers,
      groupCode,
      searchId,
      inquiryToken,
      city.name || city.city,
      itineraryDates.fromDate
    );

    if (!productInfo) return null;

    const options = await activityAvailabilityDetailService.checkAvailabilityDetail(
      searchId,
      activity.activityCode,
      productInfo.modifiedGroupCode,
      inquiryToken,
      city.name || city.city,
      itineraryDates.fromDate
    );

    if (!options?.length) return null;

    const selectedOption = options.find(opt => 
      opt.departureTime === activity.departureTime.time
    ) || options[0];

    const tourGrade = productInfo.tourGrades.find(grade => 
      grade.encryptgradeCode === selectedOption.code
    );

    return {
      ...baseDetails,
      activityType: 'online',
      activityProvider: 'GRNC',
      searchId,
      bookingStatus: 'pending',  // Set initial booking status
      packageDetails: {
        amount: selectedOption?.amount || 0,
        currency: selectedOption?.currency || '',
        ratekey: selectedOption?.ratekey,
        title: selectedOption?.title,
        departureTime: selectedOption?.departureTime,
        description: selectedOption?.description,
      },
      images: productInfo.images,
      description: productInfo.description,
      inclusions: productInfo.inclusions,
      exclusions: productInfo.exclusions,
      itinerary: productInfo.itinerary,
      additionalInfo: productInfo.additionalInfo,
      bookingQuestions: productInfo.bookingQuestions,
      cancellationFromTourDate: productInfo.cancellationFromTourDate,
      groupCode: selectedOption.code,
      tourGrade: tourGrade,
      ageBands: productInfo.ageBands,
      bookingRequirements: productInfo.bookingRequirements,
      pickupHotellist: productInfo.PickupHotellist
    };
  } catch (error) {
    console.error('Error processing online activity:', error);
    return null;
  }
};

// Get activity counts for cities
const getActivityCountsForCities = async (cityCodes) => {
  try {
    const activityCounts = await Activity.aggregate([
      { $match: { destinationCode: { $in: cityCodes } } },
      { $group: { _id: "$destinationCode", count: { $sum: 1 } } },
    ]);
    return activityCounts.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching activity counts for cities:", error);
    return {};
  }
};

// Get filtered activities
const getFilteredActivities = async (city, userPreferences, excludedActivityCodes = [], day = null) => {
  const baseQuery = {
    $and: [
      {
        $or: [
          { destinationCode: city.code },
          { city: city.name }
        ]
      },
      // Ensure activityCode is not in the excluded list
      { activityCode: { $nin: excludedActivityCodes } }
    ]
  };

  if (userPreferences.selectedInterests?.length > 0) {
    baseQuery.$and.push({
      preference: { $in: userPreferences.selectedInterests }
    });
  }

  if (userPreferences.budget) {
    baseQuery.$and.push({ budget: userPreferences.budget });
  }

  if (day?.isFirstDay) {
    baseQuery.$and.push({
      $or: [
        { timeSlot: { $in: ['afternoon', 'evening', 'Any'] } },
        { isFlexibleTiming: true }
      ]
    });
  }

  console.log('Excluded activity codes:', excludedActivityCodes);
  
  const activities = await Activity.find(baseQuery)
    .sort({ mandatory: -1, ranking: -1 })
    .lean();

  console.log(`Found ${activities.length} activities for ${city.name} after excluding ${excludedActivityCodes.length} activities`);
  return activities;
};

// Main function to get city activities
const getCityActivities = async (req) => {
  console.log(`Processing activities for city: ${req.body.city.name}`);
  const { 
    city, 
    userPreferences, 
    itineraryDates, 
    travelers, 
    inquiryToken,
    excludedActivityCodes = [], 
    day = null 
  } = req.body;

  try {
    // Get filtered activities, excluding previously selected ones
    const activities = await getFilteredActivities(
      city, 
      userPreferences, 
      excludedActivityCodes, 
      day
    );
    
    // Select activities based on day context
    const selectedActivities = selectActivities(activities, {
      isFirstDay: day?.isFirstDay,
      isLastDay: day?.isLastDay
    });
    
    // Assign time slots
    const optimizedActivities = assignTimeSlots(selectedActivities);

    // Process and enrich each activity with details
    const enrichedActivities = await Promise.all(
      optimizedActivities.map(async (activity) => {
        const baseDetails = {
          activityCode: activity.activityCode,
          activityName: activity.activityName,
          activityType: activity.activityType,
          duration: activity.duration,
          durationCategory: getDurationCategory(activity.duration),
          selectedTime: activity.selectedTime,
          endTime: activity.endTime,
          timeSlot: activity.timeSlot,
          isFlexibleTiming: activity.isFlexibleTiming,
          departureTime: activity.departureTime
        };

        if (activity.activityType === 'offline') {
          return {
            ...baseDetails,
            activityProvider: 'Self',
            ...extractOfflineActivityDetails(activity)
          };
        }

        return await processOnlineActivity(
          baseDetails,
          activity,
          city,
          travelers,
          inquiryToken,
          itineraryDates
        );
      })
    );

    // Filter out null activities and return
    const validActivities = enrichedActivities.filter(activity => activity !== null);

    // Log the selected activity codes for debugging
    console.log('Selected activity codes:', validActivities.map(a => a.activityCode));

    return validActivities;

  } catch (error) {
    console.error('Detailed error in getCityActivities:', {
      error: error.message,
      city: req.body.city.name,
      date: req.body.itineraryDates.fromDate,
      stack: error.stack
    });
    return [];
  }
};

// Get activity details endpoint
const getActivityDetails = async (req, res) => {
  const { activityCode } = req.params;
  const inquiryToken = req.headers['x-inquiry-token'];
  const { city, date, travelersDetails } = req.body;

  try {
    const availabilityFilePath = path.join(
      process.cwd(),
      'JSON',
      inquiryToken,
      city.name,
      date,
      'activity-availability',
      'default_response.json'
    );

    if (!fs.existsSync(availabilityFilePath)) {
      throw new Error('Availability data not found');
    }

    const fileContent = fs.readFileSync(availabilityFilePath, 'utf8');
    const availabilityData = JSON.parse(fileContent);

    const activityInfo = availabilityData.data.data.find(item => item.code === activityCode);
    
    if (!activityInfo || !activityInfo.groupCode) {
      throw new Error('Activity not found or missing groupCode');
    }

    const { searchId } = availabilityData.data;
    const groupCode = activityInfo.groupCode;

    // Transform travelers data
    const travelers = {
      adults: travelersDetails.rooms.reduce((acc, room) => {
        return [...acc, ...room.adults.map(age => ({ age: parseInt(age) }))];
      }, []),
      childAges: travelersDetails.rooms.reduce((acc, room) => {
        return [...acc, ...(room.children || []).map(age => parseInt(age))];
      }, [])
    };

    const productInfo = await activityProductInfoService.checkProductInfo(
      activityCode,
      travelers,
      groupCode,
      searchId,
      inquiryToken,
      city.name,
      date
    );

    if (productInfo) {
      const availabilityDetails = await activityAvailabilityDetailService.checkAvailabilityDetail(
        searchId,
        activityCode,
        productInfo.modifiedGroupCode,
        inquiryToken,
        city.name,
        date
      );

      res.json({
        productInfo,
        availabilityDetails
      });
    } else {
      throw new Error('Failed to fetch product info');
    }
  } catch (error) {
    console.error('Error fetching activity details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get available activities endpoint
const getAvailableActivities = async (req, res) => {
  const { inquiryToken, cityName, date } = req.params;

  try {
    const filePath = path.join(
      process.cwd(),
      'JSON',
      inquiryToken,
      cityName,
      date,
      'activity-availability',
      'default_response.json'
    );

    if (!fs.existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      return res.status(404).json({
        message: 'Activities not found'
      });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const activityData = JSON.parse(fileContent);

    if (!activityData?.data) {
      return res.status(404).json({
        message: 'No activity data found'
      });
    }

    res.json(activityData.data);
  } catch (error) {
    console.error('Error reading activities:', error);
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

// Create activity booking reference endpoint
const createActivityBookingReference = async (req, res) => {
  const { activityCode, searchId, startTime, gradeCode } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];
  const { cityName, date } = req.query;

  try {
    const reference = await createActivityReference({
      productcode: activityCode,
      searchId: searchId,
      starttime: startTime,
      productoptioncode: gradeCode
    }, inquiryToken, cityName, date);

    res.json(reference);
  } catch (error) {
    console.error('Error creating activity booking reference:', error);
    res.status(500).json({ error: error.message });
  }
};


const bookActivity = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const activityData = req.body.activity;

    if (!activityData) {
      return res.status(400).json({
        success: false,
        error: 'Activity data is required',
        data: null
      });
    }

    // Validate booking ID match
    if (bookingId !== activityData.bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID mismatch',
        data: null
      });
    }

    // Validate booking data
    try {
      await ActivityBookingService.validateBookingData(activityData);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.message,
        data: null
      });
    }

    // Prepare booking parameters
    const bookingParams = {
      ...activityData,
      cityName: "Activity Booking",
      date: activityData.transformedActivity.fromDate,
      inquiryToken: activityData.transformedActivity.inquiryToken || 'unknown'
    };

    // Book activity
    const bookingResponse = await ActivityBookingService.bookActivity(bookingParams);

    // Return complete response maintaining the success flag
    res.status(200).json({
      success: bookingResponse.success,
      error: bookingResponse.error,
      data: bookingResponse.data
    });

  } catch (error) {
    console.error('Error in bookActivity:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      data: error.response?.data || error // Include complete error response
    });
  }
};

// Export all functions
module.exports = {
  bookActivity,
  getCityActivities,
  getActivityCountsForCities,
  getActivityDetails,
  getAvailableActivities,
  createActivityBookingReference,
  // Export helper functions for testing
  getDurationCategory,
  validateAndNormalizeTime,
  calculateEndTime,
  assignTimeSlots,
  selectActivities
};