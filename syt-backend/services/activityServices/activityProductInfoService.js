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

    const ageBandCounts = getAgeBandCounts(ageBands, travelers);
    const modifiedGroupCode = `${availabilityGroupCode}-${ageBandCounts}`;
    const result = { ...response.data, modifiedGroupCode };

    // Log response
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-productinfo',
      requestData: requestData,
      responseData: result,
      activityCode
    });

    return result;
  } catch (error) {
    console.error(`Error in ProductInfo API for activityCode: ${activityCode}`, error.message);
    return null;
  }
};

// Helper functions remain the same...
const getAgeBandCounts = (ageBands, travelers) => {
  const counts = categorizeTravelersByAgeBand(travelers, ageBands);
  return `${counts.ADULT}|${counts.CHILD}|${counts.INFANT}|${counts.SENIOR}|${counts.YOUTH}`;
};

const categorizeTravelersByAgeBand = (travelers, ageBands) => {
  const counts = { ADULT: 0, CHILD: 0, INFANT: 0, SENIOR: 0, YOUTH: 0 };

  const matchAgeToBand = (age, counts, ageBands, defaultBand) => {
    let matched = false;
    ageBands.forEach(band => {
      if (age >= band.startAge && age <= band.endAge) {
        counts[band.ageBand]++;
        matched = true;
      }
    });
    if (!matched) counts[defaultBand]++;
  };

  travelers.adults.forEach(age => matchAgeToBand(parseInt(age), counts, ageBands, 'ADULT'));
  if (travelers.childAges) {
    travelers.childAges.forEach(age => matchAgeToBand(parseInt(age), counts, ageBands, 'CHILD'));
  }

  return counts;
};

module.exports = { checkProductInfo };