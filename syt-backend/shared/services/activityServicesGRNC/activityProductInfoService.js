const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

const API_URLS = {
  productInfo: 'http://act-v2-prod.grnconnect.com/api/v3/activity/ProductInfo'
};
const API_KEY = 'hhVblqFbLN8ojaRs';

const checkProductInfo = async (activityCode, travelers, availabilityGroupCode, searchId, inquiryToken, cityName, date) => {
  try {
    const requestData = { 
      code: activityCode,
      groupCode: availabilityGroupCode,
      searchId
    };

    // Log request
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-productinfo',
      requestData: { 
        url: `${API_URLS.productInfo}?code=${activityCode}`,
        headers: { 'api-key': API_KEY },
        payload: requestData
      },
      responseData: null,
      activityCode
    });

    const response = await axios.get(`${API_URLS.productInfo}?code=${activityCode}`, {
      headers: { 'api-key': API_KEY }
    });

    const { ageBands } = response.data;
    if (!ageBands || !Array.isArray(ageBands)) {
      throw new Error('Invalid or missing ageBands in ProductInfo response');
    }

    // Log original response data
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-productinfo',
      requestData: requestData,
      responseData: response.data,
      activityCode
    });

    return response.data;
  } catch (error) {
    console.error(`Error in ProductInfo API for activityCode: ${activityCode}`, error.message);
    return null;
  }
};

module.exports = { checkProductInfo };