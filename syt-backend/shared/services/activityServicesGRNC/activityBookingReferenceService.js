const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

const API_URLS = {
  bookingReference: 'http://act-v2-prod.grnconnect.com/api/v3/activity/referance'
};
const API_KEY = 'hhVblqFbLN8ojaRs';

const createActivityReference = async (params, inquiryToken, cityName, date) => {
  const { productcode: activityCode, searchId, starttime, productoptioncode } = params;

  // Create payload dynamically, only including starttime if it exists
  const requestPayload = {
    productcode: activityCode,
    searchId,
    productoptioncode
  };

  if (starttime) {
    requestPayload.starttime = starttime;
  }

  try {
    // Log request
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-booking-reference',
      requestData: {
        payload: requestPayload,
        headers: { 'api-key': API_KEY }
      },
      responseData: null,
      activityCode
    });

    const response = await axios.post(API_URLS.bookingReference, requestPayload, {
      headers: { 'api-key': API_KEY }
    });

    if (!response.data?.bookingref) {
      throw new Error('Invalid booking reference response');
    }

    // Log response
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-booking-reference',
      requestData: requestPayload,
      responseData: response.data,
      activityCode
    });

    return {
      bookingRef: response.data.bookingref,
      priceValidUntil: response.data.pricevaliduntil,
      timeElapsed: response.data.timeElapsed,
      supplierPrice: response.data.supplierprice,
      price: response.data.price,
      availabilityValidUntil: response.data.availabilityValiduntil
    };
  } catch (error) {
    console.error('Error creating activity reference:', error);
    throw error;
  }
};

module.exports = { createActivityReference };