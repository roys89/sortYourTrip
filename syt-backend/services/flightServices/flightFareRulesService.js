//services/flightServices/flightFareRulesService.js

const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightFareRulesService {
  static async getFareRules(params) {
    try {
      const {
        traceId,
        resultIndex,
        inquiryToken,
        cityName,
        date,
        token
      } = params;

      const requestBody = {
        traceId,
        resultIndex
      };

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'source': 'website',
          'authorization-type': 'external-service'
        }
      };

      const response = await axios.post(
        'https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/fare-rules',
        requestBody,
        config
      );

      // Log API data
      const logData = {
        inquiryToken,
        cityName,
        date,
        apiType: 'flight_fare_rules',
        requestData: {
          ...requestBody
        },
        responseData: response.data
      };

      apiLogger.logApiData(logData);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      const errorLogData = {
        inquiryToken: params.inquiryToken || 'unknown',
        cityName: params.cityName,
        date: params.date,
        apiType: 'flight_fare_rules_error',
        requestData: {
          traceId: params.traceId,
          resultIndex: params.resultIndex
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      apiLogger.logApiData(errorLogData);

      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FlightFareRulesService;