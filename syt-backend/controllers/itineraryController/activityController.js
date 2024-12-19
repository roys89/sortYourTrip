const Activity = require('../../models/itineraryModel/Activity');
const path = require('path');
const fs = require('fs');
const apiLogger = require('../../helpers/apiLogger');
const activityAvailabilityService = require('../../services/activityServices/activityAvailabilityService');
const activityProductInfoService = require('../../services/activityServices/activityProductInfoService');
const activityAvailabilityDetailService = require('../../services/activityServices/activityAvailabilityDetailService');


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
    console.error("Error fetching activity counts for cities:", error.message);
    return {};
  }
};

const getFilteredActivities = async (city, userPreferences, excludedActivityCodes = []) => {
  return await Activity.find({
    destinationCode: city.code,
    preference: { $in: userPreferences.selectedInterests },
    budget: userPreferences.budget,
    activityCode: { $nin: excludedActivityCodes }
  }).sort({ ranking: -1 }).lean();
};

const getMatchingTourGrade = (tourGrades, selectedOptionCode) => {
  if (!tourGrades || !selectedOptionCode) return null;
  return tourGrades.find(grade => grade.encryptgradeCode === selectedOptionCode);
};

const getCityActivities = async (req) => {
  const { city, userPreferences, itineraryDates, travelers, inquiryToken, excludedActivityCodes = [] } = req.body;

  try {
    const activities = await getFilteredActivities(city, userPreferences, excludedActivityCodes);

    const onlineActivities = activities.filter((activity) => activity.activityType === 'online');
    const offlineActivities = activities.filter((activity) => activity.activityType === 'offline');

    let selectedActivities;
    if (offlineActivities.length === 0) {
      selectedActivities = onlineActivities.slice(0, 3);
    } else if (onlineActivities.length === 0) {
      selectedActivities = offlineActivities.slice(0, 3);
    } else {
      selectedActivities = [
        ...onlineActivities.slice(0, 2),
        ...offlineActivities.slice(0, 1),
      ];
    }

    const availabilityResponse = await activityAvailabilityService.checkActivityAvailability(
      {
        code: city.code,
        name: city.name || city.city // Ensure we have a name for logging
      },
      itineraryDates.fromDate,
      travelers,
      inquiryToken
    );

    if (!availabilityResponse?.data?.[0]?.groupCode) {
      console.error('No availability response or missing groupCode');
      return [];
    }

    const { searchId } = availabilityResponse;
    const groupCode = availabilityResponse.data[0].groupCode;

    const activityDetails = await Promise.all(
      selectedActivities.map(async (activity) => {
        if (activity.activityType === 'offline') {
          return { 
            activityCode: activity.activityCode,
            activityName: activity.activityName,
            activityType: 'offline',
            activityProvider: 'Self',
            duration: activity.duration,
            street: activity.street,
            city: activity.city,
            state: activity.state,
            country: activity.country,
            continent: activity.continent,
            postalCode: activity.postalCode,
            lat: activity.lat,
            long: activity.long,
            budget: activity.budget,
            timeSlot: activity.timeSlot,
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
            packageDetails:{
              amount: 0,
              currency: 'INR',
            },
            availabilityDetails: null,
            searchId: null,
          };
        }
    
        const productInfo = await activityProductInfoService.checkProductInfo(
          activity.activityCode,
          travelers,
          groupCode,
          searchId,
          inquiryToken,
          city.name || city.city,
          itineraryDates.fromDate
        );

        if (!productInfo) {
          return null;
        }
    
        const options = await activityAvailabilityDetailService.checkAvailabilityDetail(
          searchId,
          activity.activityCode,
          productInfo.modifiedGroupCode,
          inquiryToken,
          city.name || city.city,
          itineraryDates.fromDate
        );
    
        if (!options?.length) {
          return null;
        }
    
        let selectedOption;
        switch (userPreferences.budget) {
          case 'Luxury':
            selectedOption = options.reduce((prev, current) => (prev.amount > current.amount ? prev : current));
            break;
          case 'Somewhere in Between':
            const sortedOptions = options.sort((a, b) => a.amount - b.amount);
            selectedOption = sortedOptions[Math.floor(sortedOptions.length / 2)];
            break;
          case 'Pocket Friendly':
            selectedOption = options.reduce((prev, current) => (prev.amount < current.amount ? prev : current));
            break;
          default:
            selectedOption = options[0];
        }

        const tourGrade = productInfo.tourGrades.find(grade => 
          grade.encryptgradeCode === selectedOption.code
        );
    
        return {
          searchId: searchId,
          activityType: 'online',
          activityProvider: 'GRNC',
          activityCode: activity.activityCode,
          activityName: productInfo.title,
          lat: activity.lat,
          long: activity.long,
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
          tourGrade: tourGrade, // Only including the matching tour grade
          ageBands: productInfo.ageBands,
          bookingRequirements: productInfo.bookingRequirements,
          pickupHotellist: productInfo.PickupHotellist
        };
      })
    );


    return activityDetails.filter((activity) => activity !== null);
  } catch (error) {
    console.error('Error fetching city activities:', error.message);
    return [];
  }
};


const getActivityDetails = async (req, res) => {
  const { activityCode } = req.params;
  const inquiryToken = req.headers['x-inquiry-token'];
  const { city, date, travelersDetails } = req.body;

  try {
    // First get the saved availability response
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

    // Find the specific activity in the availability response
    const activityInfo = availabilityData.data.data.find(item => item.code === activityCode);
    
    if (!activityInfo || !activityInfo.groupCode) {
      throw new Error('Activity not found or missing groupCode');
    }

    const { searchId } = availabilityData.data;
    const groupCode = activityInfo.groupCode;

    // Transform travelersDetails for services
    const travelers = {
      adults: travelersDetails.rooms.reduce((acc, room) => {
        return [...acc, ...room.adults.map(age => ({ age: parseInt(age) }))];
      }, []),
      childAges: travelersDetails.rooms.reduce((acc, room) => {
        return [...acc, ...(room.children || []).map(age => parseInt(age))];
      }, [])
    };

    // Get product info with the groupCode from the matching activity
    const productInfo = await activityProductInfoService.checkProductInfo(
      activityCode,
      travelers,
      groupCode,
      searchId,
      inquiryToken,
      city.name,
      date
    );

    if (!productInfo) {
      throw new Error('Failed to fetch product info');
    }

    // Use modifiedGroupCode from productInfo for availability details
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
  } catch (error) {
    console.error('Error fetching activity details:', error);
    res.status(500).json({ error: error.message });
  }
};



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

    if (!activityData || !activityData.data) {
      return res.status(404).json({
        message: 'No activity data found'
      });
    }


    // Add travelers info to response
    const responseData = {
      ...activityData.data
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error reading activities:', error);
    console.error('Request details:', {
      params: { inquiryToken, cityName, date },
      travelersDetails
    });
    
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

const { createActivityReference } = require('../../services/activityServices/activityBookingReferenceService');

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


module.exports = {
  getCityActivities,
  getActivityCountsForCities,
  getActivityDetails,
  getAvailableActivities,
  createActivityBookingReference
};