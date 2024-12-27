//services/flightServices/flightAuthService.js

const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightAuthService {
  static async login(inquiryToken) {
    try {
      // Exact URL as specified
      const url = 'https://trav-auth-sandbox.travclan.com/authentication/internal/service/login';

      // Exact request body as specified
      const requestBody = {
        merchant_id: "mereqlpg5os",
        user_id: "fcbade0ac",
        api_key: "a2ec89f8-2b0c-42d0-bdbd-df4e27f8ca63"
      };

      // Make API call with exact headers as specified
      const response = await axios({
        method: 'post',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: requestBody
      });

      // Log API data
      const logData = {
        inquiryToken,
        cityName: 'auth',
        date: new Date().toISOString(),
        apiType: 'flight_auth',
        requestData: {
          url,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            merchant_id: requestBody.merchant_id,
            user_id: requestBody.user_id,
            api_key: requestBody.api_key
          }
        },
        responseData: response.data
      };

      apiLogger.logApiData(logData);

      return {
        success: true,
        token: response.data.AccessToken
      };

    } catch (error) {
      // Log error
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName: 'auth',
        date: new Date().toISOString(),
        apiType: 'flight_auth_error',
        requestData: {
          url: 'https://trav-auth-sandbox.travclan.com/authentication/internal/service/login'
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

module.exports = FlightAuthService;