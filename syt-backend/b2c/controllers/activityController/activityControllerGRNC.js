const Activity = require('../../../shared/models/itineraryModel/Activity');
const path = require('path');
const fs = require('fs');
const apiLogger = require('../../../shared/helpers/apiLogger');
const activityAvailabilityService = require('../../../shared/services/activityServicesGRNC/activityAvailabilityService');
const activityProductInfoService = require('../../../shared/services/activityServicesGRNC/activityProductInfoService');
const activityAvailabilityDetailService = require('../../../shared/services/activityServicesGRNC/activityAvailabilityDetailService');
const ActivityBookingService = require('../../../shared/services/activityServicesGRNC/activityBookingService');
const { createActivityReference } = require('../../../shared/services/activityServicesGRNC/activityBookingReferenceService');

// Constants
const DURATION_CATEGORIES = {
  QUARTER_DAY: 'quarter_day', // 1-3 hours
  HALF_DAY: 'half_day',      // 3-6 hours
  FULL_DAY: 'full_day'       // 6-12 hours
};

const TIME_SLOTS = {
  MORNING: 'morning',     // 9:00 - 12:00 (180 mins)
  AFTERNOON: 'afternoon', // 12:00 - 16:00 (240 mins)
  EVENING: 'evening'      // 16:00 - 20:00 (240 mins)
};

const DEFAULT_TIMES = {
  [TIME_SLOTS.MORNING]: '09:00',
  [TIME_SLOTS.AFTERNOON]: '13:00',
  [TIME_SLOTS.EVENING]: '16:00'
};

// Helper function to get duration category based on minutes
const getDurationCategory = (durationInMinutes) => {
  if (!durationInMinutes || durationInMinutes <= 0) return null;
  if (durationInMinutes <= 180) return DURATION_CATEGORIES.QUARTER_DAY; // 0-3 hours
  if (durationInMinutes <= 360) return DURATION_CATEGORIES.HALF_DAY;      // 3-6 hours
  return DURATION_CATEGORIES.FULL_DAY;       // > 6 hours
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

// Helper function to calculate end time using duration in minutes
const calculateEndTime = (startTimeStr, durationInMinutes) => {
  if (startTimeStr === 'Flexible') return 'Flexible';
  
  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + (minutes || 0) + durationInMinutes; // Duration is now in minutes
  
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  // If end time would be after 20:00 (1200 minutes from midnight), adjust
  if (endHours >= 20) {
    return '20:00';
  }
  
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Helper function to get available time slot using duration in minutes
const getAvailableTimeSlot = (existingActivities, newActivityDurationMinutes) => {
  const timeSlots = {
    [TIME_SLOTS.MORNING]: { start: 9, end: 12, available: true },
    [TIME_SLOTS.AFTERNOON]: { start: 12, end: 16, available: true },
    [TIME_SLOTS.EVENING]: { start: 16, end: 20, available: true }
  };

  // Mark slots as unavailable based on existing activities
  existingActivities.forEach(activity => {
    if (activity.selectedTime === 'Flexible' || !activity.duration) return; // Skip if no time or duration
    
    const startHour = parseInt(activity.selectedTime.split(':')[0]);
    // Calculate end time using the updated function and duration (assuming it's in minutes now)
    const endTimeStr = calculateEndTime(activity.selectedTime, activity.duration);
    if (endTimeStr === 'Flexible') return; // Skip if end time calculation fails
    const endHour = parseInt(endTimeStr.split(':')[0]);
    
    Object.entries(timeSlots).forEach(([slot, time]) => {
      if (startHour < time.end && endHour > time.start) {
        time.available = false;
      }
    });
  });

  // Find first available slot that can fit the new activity
  // Convert slot duration (hours) to minutes for comparison
  const newActivityDurationHours = newActivityDurationMinutes / 60;
  for (const [slot, time] of Object.entries(timeSlots)) {
    if (time.available && (time.end - time.start) >= newActivityDurationHours) {
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

// Helper function to find available time slot using duration in minutes
const findAvailableTimeSlot = (timeline, activity) => {
  // Don't process invalid activities (duration now in minutes)
  if (!activity.duration || activity.duration <= 0) return null;

  // If activity has preferred time and it's valid, try that first
  if (activity.departureTimes?.[0]?.time && 
      activity.departureTimes[0].time !== 'Flexible') {
    const preferredTime = validateAndNormalizeTime(activity.departureTimes[0].time);
    if (preferredTime) {
      const endTime = calculateEndTime(preferredTime, activity.duration); // Use duration in minutes
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

  // Define possible start times throughout the day
  const possibleStartTimes = [
    { time: '09:00', slot: TIME_SLOTS.MORNING },
    { time: '10:30', slot: TIME_SLOTS.MORNING },
    { time: '13:00', slot: TIME_SLOTS.AFTERNOON },
    { time: '14:30', slot: TIME_SLOTS.AFTERNOON },
    { time: '16:00', slot: TIME_SLOTS.EVENING },
    { time: '17:30', slot: TIME_SLOTS.EVENING }
  ];

  // Try each possible start time
  for (const { time: startTime } of possibleStartTimes) {
    const endTime = calculateEndTime(startTime, activity.duration); // Use duration in minutes
    
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

  // Add one half-day morning activity if available and duration <= 4 hours (240 minutes)
  const morningHalfDay = categorized[DURATION_CATEGORIES.HALF_DAY]
    .find(activity => 
      (!activity.timeSlot || 
      activity.timeSlot === 'morning' ||
      activity.isFlexibleTiming) &&
      activity.duration <= 240 // Check duration in minutes
    );

  if (morningHalfDay) {
    selected.push(morningHalfDay);
  }
  selected.push(...quarterDayActivities);

  return selected;
};

// Updated logic for regular day selection using minutes
const selectRegularDayActivities = (categorized) => {
  const MAX_DAY_DURATION_MINUTES = 480; // Approx 8 hours
  const selected = [];
  let currentDuration = 0;

  // Prioritize mandatory activities first, regardless of duration, if they fit
  const mandatoryActivities = [
    ...categorized[DURATION_CATEGORIES.QUARTER_DAY],
    ...categorized[DURATION_CATEGORIES.HALF_DAY],
    ...categorized[DURATION_CATEGORIES.FULL_DAY]
  ].filter(a => a.mandatory);

  mandatoryActivities.sort((a, b) => b.qualityScore - a.qualityScore);

  for (const activity of mandatoryActivities) {
    if (currentDuration + activity.duration <= MAX_DAY_DURATION_MINUTES) {
      selected.push(activity);
      currentDuration += activity.duration;
    }
  }

  // Get remaining activities, sorted by quality
  const remainingActivities = [
    ...categorized[DURATION_CATEGORIES.QUARTER_DAY],
    ...categorized[DURATION_CATEGORIES.HALF_DAY],
    ...categorized[DURATION_CATEGORIES.FULL_DAY]
  ]
  .filter(a => !a.mandatory && !selected.some(s => s.activityCode === a.activityCode)) // Exclude already selected mandatory
  .sort((a, b) => b.qualityScore - a.qualityScore);


  // Try to fill the remaining time with highest quality activities
  for (const activity of remainingActivities) {
    if (currentDuration + activity.duration <= MAX_DAY_DURATION_MINUTES) {
       // Avoid adding duplicates if somehow mandatory selection failed
       if (!selected.some(s => s.activityCode === activity.activityCode)) {
           selected.push(activity);
           currentDuration += activity.duration;
       }
    }
  }

  return selected;
};

// Enhanced selectActivities function with better distribution
const selectActivities = (activities, dayContext = {}) => {
  // First categorize by duration (now using minutes)
  const durationsCategories = {
    [DURATION_CATEGORIES.QUARTER_DAY]: [],
    [DURATION_CATEGORIES.HALF_DAY]: [],
    [DURATION_CATEGORIES.FULL_DAY]: []
  };

  // Then subcategorize by time preference
  activities.forEach(activity => {
    // Assuming activity.duration is now in minutes
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
    selectFirstDayActivities(durationsCategories) : // First day logic might need review for minute-based duration limits if stricter time needed
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

// Updated assignTimeSlots function using duration in minutes
const assignTimeSlots = (selectedActivities) => {
  const timeline = [];
  const processedActivities = [];
  const BUFFER_TIME_MINUTES = 60; // 60 minutes buffer between activities

  // Sort activities by preferred time if available
  const sortedActivities = [...selectedActivities].sort((a, b) => {
    const aTime = a.departureTimes?.[0]?.time || 'Flexible';
    const bTime = b.departureTimes?.[0]?.time || 'Flexible';
    if (aTime === 'Flexible' && bTime === 'Flexible') return a.qualityScore - b.qualityScore; // Secondary sort by quality
    if (aTime === 'Flexible') return 1;
    if (bTime === 'Flexible') return -1;
    return parseTime(aTime) - parseTime(bTime);
  });

  for (const activity of sortedActivities) {
    // Duration is expected in minutes by findAvailableTimeSlot now
    const slot = findAvailableTimeSlot(timeline, activity); 
    if (!slot) {
      console.log(`Could not find slot for ${activity.activityName} (Duration: ${activity.duration} mins)`);
      continue;
    }

    const processedActivity = {
      ...activity, // Includes duration in minutes
      selectedTime: slot.startTime,
      endTime: slot.endTime,
      timeSlot: getTimeSlot(slot.startTime),
      departureTime: {
        time: slot.startTime,
        code: activity.departureTimes?.find(dt => dt.time === slot.startTime)?.code || activity.departureTimes?.[0]?.code || 'DEFAULT' // Try to find matching code
      }
    };

    // Add entry to timeline with buffer
    timeline.push({
      startTime: slot.startTime,
      // Use calculateEndTime to add buffer correctly
      endTime: calculateEndTime(slot.endTime, BUFFER_TIME_MINUTES), // Add buffer in minutes
      activity: processedActivity
    });
    // Sort timeline to ensure correct overlap checks for subsequent activities
    timeline.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

    processedActivities.push(processedActivity);
  }

  // Final sort of processed activities by assigned start time
  processedActivities.sort((a,b) => parseTime(a.selectedTime) - parseTime(b.selectedTime));

  return processedActivities;
};

// 4. Add Activity Validation
const validateActivity = (activity) => {
  // Duration validation assumes minutes now
  if (!activity.activityCode || !activity.duration || activity.duration <= 0) { 
    console.log(`Invalid activity: ${activity.activityName} (Code: ${activity.activityCode}, Duration: ${activity.duration})`);
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
  activity, // This is the activity from DB (now duration in minutes)
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

    // **Duration Conversion Point**: Assume productInfo.duration comes in hours (string/number)
    let durationInMinutes = activity.duration; // Use DB duration as default
    if (productInfo.duration) {
        try {
            // Handle both string ("1.5") and number (1.5) formats for hours
            const durationHours = parseFloat(productInfo.duration);
            if (!isNaN(durationHours)) {
                durationInMinutes = Math.round(durationHours * 60);
            }
        } catch (e) {
            console.warn(`Could not parse duration from productInfo (${productInfo.duration}), using DB duration ${activity.duration} mins.`);
        }
    }

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
      ...baseDetails, // Base details already use duration in minutes from DB activity
      duration: durationInMinutes, // Override with potentially more accurate duration from productInfo (converted to minutes)
      durationCategory: getDurationCategory(durationInMinutes), // Recalculate category based on final duration
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

  // **Convert duration from hours (DB) to minutes**
  const activitiesInMinutes = activities.map(activity => {
    let durationInMinutes = 0;
    if (typeof activity.duration === 'number' && activity.duration > 0) {
      durationInMinutes = Math.round(activity.duration * 60);
    } else {
      console.warn(`Activity ${activity.activityCode} has invalid or missing duration: ${activity.duration}. Setting duration to 0 minutes.`);
    }
    return {
      ...activity,
      duration: durationInMinutes // Overwrite duration with minutes value
    };
  });

  console.log(`Found ${activities.length} activities for ${city.name} after excluding ${excludedActivityCodes.length} activities`);
  return activitiesInMinutes; // Return activities with duration in minutes
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

    // Modify the success flag based on error conditions
    const modifiedResponse = {
      ...bookingResponse,
      success: bookingResponse.success && 
               (!bookingResponse.data.errorCodes || 
                bookingResponse.data.errorCodes.length === 0) &&
               (!bookingResponse.data.errorMessages || 
                bookingResponse.data.errorMessages.length === 0)
    };

    // Return complete response
    res.status(200).json(modifiedResponse);

  } catch (error) {
    console.error('Error in bookActivity:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      data: error.response?.data || error
    });
  }
};

const getActivityBookingDetails = async (req, res) => {
  const { bookingReference } = req.params;
  const inquiryToken = req.headers['x-inquiry-token'];
  const { city, date } = req.body;

  try {
    if (!bookingReference) {
      throw new Error('Booking reference is required');
    }

    const response = await ActivityBookingDetailsService.getBookingDetails({
      bookingReference,
      inquiryToken,
      city,
      date
    });

    if (!response.success) {
      throw new Error('Failed to get booking details');
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching activity booking details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export all functions
module.exports = {
  bookActivity,
  getCityActivities,
  getActivityCountsForCities,
  getAvailableActivities,
  createActivityBookingReference,
  // Export helper functions for testing (now using minutes)
  getDurationCategory,
  validateAndNormalizeTime,
  calculateEndTime,
  assignTimeSlots,
  selectActivities,
  getActivityBookingDetails
};