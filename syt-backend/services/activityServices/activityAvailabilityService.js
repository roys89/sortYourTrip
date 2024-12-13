const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

const API_URLS = {
  availability: 'http://act-v2-prod.grnconnect.com/api/v3/activity/availability/'
};
const API_KEY = 'hhVblqFbLN8ojaRs';

const checkActivityAvailability = async (city, date, travelers, inquiryToken) => {
  try {
    if (!city || !city.code) throw new Error('Invalid city object or missing city code');
    const destinationCode = parseInt(city.code, 10);
    if (isNaN(destinationCode)) throw new Error('Invalid destination code: must be a number');

    const requestPayload = {
      currency: 'INR',
      fromDate: date,
      toDate: date,
      adults: travelers.adults.length,
      childAges: travelers.childAges || [],
      destinationCode: destinationCode
    };

    // Log request
    await apiLogger.logApiData({
      inquiryToken,
      cityName: city.name,
      date,
      apiType: 'activity-availability',
      requestData: { payload: requestPayload, headers: { 'api-key': API_KEY } },
      responseData: null,
      activityCode: travelers.activityCode // Pass activityCode if available
    });

    const response = await axios.post(API_URLS.availability, requestPayload, {
      headers: { 'api-key': API_KEY }
    });

    // Log response
    await apiLogger.logApiData({
      inquiryToken,
      cityName: city.name,
      date,
      apiType: 'activity-availability',
      requestData: requestPayload,
      responseData: response.data,
      activityCode: travelers.activityCode // Pass activityCode if available
    });

    return response.data && response.data.data ? response.data : null;
  } catch (error) {
    console.error('Error checking activity availability:', error.message);
    return null;
  }
};

module.exports = { checkActivityAvailability };