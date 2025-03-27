const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

const API_URLS = {
  availabilityDetail: 'http://act-v2-prod.grnconnect.com/api/v3/activity/availability_detail'
};
const API_KEY = 'hhVblqFbLN8ojaRs';

const checkAvailabilityDetail = async (searchId, activityCode, groupCode, inquiryToken, cityName, date) => {
  const requestPayload = {
    searchId,
    code: activityCode,
    groupCode
  };

  try {
    // Log request
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-availability-detail',
      requestData: { 
        payload: requestPayload,
        headers: { 'api-key': API_KEY }
      },
      responseData: null,
      activityCode
    });

    const response = await axios.post(API_URLS.availabilityDetail, requestPayload, {
      headers: { 'api-key': API_KEY }
    });

    const options = response.data?.data?.options;
    if (!options || !Array.isArray(options)) {
      throw new Error('Invalid or missing options in availability detail response');
    }

    // Log response
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-availability-detail',
      requestData: requestPayload,
      responseData: response.data,
      activityCode
    });

    return options;
  } catch (error) {
    console.error('Error checking availability details:', error.message);
    return null;
  }
};

module.exports = { checkAvailabilityDetail };