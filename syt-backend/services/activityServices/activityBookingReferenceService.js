// services/activityServices/activityBookingReferenceService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

const API_URLS = {
  bookingReference: 'http://act-v2-prod.grnconnect.com/api/v3/activity/referance'
};
const API_KEY = 'hhVblqFbLN8ojaRs';

const createActivityReference = async (params, inquiryToken, cityName, date) => {
  const { productcode, searchId, starttime, productoptioncode } = params;

  try {
    // Log request
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-booking-reference',
      requestData: {
        payload: params,
        headers: { 'api-key': API_KEY }
      },
      responseData: null,
      activityCode: productcode
    });

    const response = await axios.post(API_URLS.bookingReference, {
      productcode,
      searchId, 
      starttime: starttime || '12:00',
      productoptioncode
    }, {
      headers: { 'api-key': API_KEY }
    });

    // Log response
    await apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'activity-booking-reference',
      requestData: params,
      responseData: response.data,
      activityCode: productcode
    });

    if (!response.data?.bookingref) {
      throw new Error('Invalid booking reference response');
    }

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