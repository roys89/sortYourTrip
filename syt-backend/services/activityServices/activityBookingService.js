const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class ActivityBookingService {
  static async bookActivity(params) {
    try {
      const {
        inquiryToken,
        cityName,
        date,
        transformedActivity
      } = params;

      const bookingPayload = {
        searchId: transformedActivity.searchId,
        lead: {
          title: transformedActivity.lead.title,
          name: transformedActivity.lead.name,
          surname: transformedActivity.lead.surname,
          clientNationality: transformedActivity.lead.clientNationality,
          age: transformedActivity.lead.age.toString()
        },
        agentRef: transformedActivity.agentRef,
        ratekey: transformedActivity.rateKey,
        fromDate: date,
        toDate: date,
        groupCode: transformedActivity.groupCode,
        hotelId: transformedActivity.hotelId || null,
        languageGuide: transformedActivity.languageGuide,
        QuestionAnswers: transformedActivity.QuestionAnswers,
        travellers: transformedActivity.travellers.map(traveller => ({
          title: traveller.title,
          name: traveller.name,
          surname: traveller.surname,
          type: traveller.type,
          age: traveller.age.toString()
        }))
      };

      const config = {
        method: 'post',
        url: 'http://act-v2-prod.grnconnect.com/api/v3/activity/book/',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.GRNC_API_KEY || 'hhVblqFbLN8ojaRs'
        },
        data: bookingPayload
      };

      const response = await axios.post(
        config.url,
        bookingPayload,
        { headers: config.headers }
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName,
        date,
        apiType: 'activity_booking',
        requestData: {
          ...bookingPayload,
          headers: {
            'api-key': '[REDACTED]'
          }
        },
        responseData: response.data,
        activityCode: transformedActivity.activityCode  // Add this
      };
      
      apiLogger.logApiData(logData);
      return {
        success: true,
        data: response.data.response || response.data
      };

    } catch (error) {
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.cityName || 'unknown',
        date: params.date,
        apiType: 'activity_booking_error',
        requestData: {
          activityCode: params.transformedActivity?.activityCode,
          searchId: params.transformedActivity?.searchId
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        },
        activityCode: params.transformedActivity?.activityCode  // Add this
      };

      apiLogger.logApiData(errorLogData);

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  static async validateBookingData(bookingData) {
    const { transformedActivity } = bookingData;
  
    const requiredFields = [
      { field: 'searchId', type: 'string' },
      { field: 'activityCode', type: 'string' },
      { field: 'lead.name', type: 'string', path: ['lead', 'name'] },
      { field: 'lead.surname', type: 'string', path: ['lead', 'surname'] },
      { field: 'rateKey', type: 'string' },
      { field: 'groupCode', type: 'string' },
      { field: 'travellers', type: 'array' }
    ];
  
    const missingFields = requiredFields.filter(req => {
      let value;
      
      // For nested fields
      if (req.path) {
        value = req.path.reduce((obj, key) => obj && obj[key], transformedActivity);
      } else {
        value = transformedActivity[req.field];
      }
  
      // Validate based on type
      if (req.type === 'string') {
        return !value || value.trim() === '';
      } else if (req.type === 'array') {
        return !Array.isArray(value) || value.length === 0;
      }
  
      return true;
    });
  
    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map(f => f.field).join(', ');
      throw new Error(`Missing required fields: ${missingFieldNames}`);
    }
  
    return true;
  }
}

module.exports = ActivityBookingService;