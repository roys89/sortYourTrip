// services/hotelServices/hotelAuthService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelAuthService {
  static async getAuthToken(inquiryToken) {
    try {
      const url = 'https://trav-auth-sandbox.travclan.com/authentication/internal/service/login';
      const requestBody = {
        merchant_id: "mereg48qqz8",
        user_id: "97b6e108b",
        api_key: "1b0053b5-6005-4df6-b982-3711525e8e79"
      };

      const response = await axios({
        method: 'post',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: requestBody
      });

  // Console log successful message
  console.log(`Hotel Authentication Successful`);

      // Log API data
      const logData = {
        inquiryToken,
        cityName: 'auth',
        date: new Date().toISOString(),
        apiType: 'hotel_auth',
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

      return response.data.AccessToken;

    } catch (error) {
      // Log error
      const errorLogData = {
        inquiryToken: inquiryToken || 'unknown',
        cityName: 'auth',
        date: new Date().toISOString(),
        apiType: 'hotel_auth_error',
        requestData: {
          url: 'https://trav-auth-sandbox.travclan.com/authentication/internal/service/login'
        },
        responseData: {
          error: error.message,
          details: error.response?.data || {}
        }
      };

      apiLogger.logApiData(errorLogData);
      throw error;
    }
  }
}

module.exports = HotelAuthService;