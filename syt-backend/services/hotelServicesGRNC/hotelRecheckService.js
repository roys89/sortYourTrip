const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelRecheckService {
  constructor() {
    this.API_KEY = '659555342b7a9a1f910a45462672f3fb';
    this.BASE_URL = 'https://v3-api.grnconnect.com/api/v3/hotels/availability';
  }

  /**
   * Recheck hotel rate availability
   * @param {string} searchId - Search ID from previous availability response (e.g., ksuxyweppxo4sfrn4bgwglhz6i)
   * @param {string} groupCode - Group code from rates array (e.g., uwgal4tdxz5grbqn532cgsefxcgpbs5c6gyoi)
   * @param {string} rateKey - Rate key from rates array (e.g., 4dcf5skouvxxxlrdvttbmeg37sx5pbxpuxaz7wqfvjerl5xacdlhm)
   * @param {string} inquiryToken - Token for logging purposes
   * @param {string} cityName - City name for logging purposes
   * @returns {Promise<Object>} - Recheck response data
   */
  async recheckRate(searchId, checkIn, groupCode, rateKey, inquiryToken, cityName) {
    try {
      const url = `${this.BASE_URL}/${searchId}/rates/?action=recheck`;
  
      const requestBody = {
        group_code: groupCode,
        rate_key: rateKey
      };
  
      // console.log("Logging cityName:", cityName); // Log cityName before making the request
      // console.log("Hotel Recheck Request URL:", url);
      // console.log("Hotel Recheck Request Body:", JSON.stringify(requestBody, null, 2));
  
      const response = await axios({
        method: 'post',
        url: url,
        data: requestBody,
        headers: {
          'api-key': this.API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Accept-Encoding': 'application/gzip',
        }
      });
  
      // console.log("Hotel Recheck Response Data:", JSON.stringify(response.data, null, 2));
  
      // Log the API request and response
      await apiLogger.logApiData({
        inquiryToken,
        cityName,
        date: checkIn, // Pass checkIn date here
        apiType: 'hotel-recheck',
        url: url,
        requestData: {
            headers: {
                'api-key': '[REDACTED]',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Encoding': 'application/gzip',
            },
            body: requestBody
        },
        responseData: response.data,
        searchId: inquiryToken
    });
    
  
      return response.data;
    } catch (error) {
      console.error('Error in hotel recheck service:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Log the cityName for debugging
      console.log('Logging cityName:', cityName);
  
      // Log error details
      await apiLogger.logApiData({
        inquiryToken,
        cityName,
        apiType: 'hotel-recheck-error',
        error: {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        },
        searchId: inquiryToken
      });
  
      throw new Error(`Hotel recheck service error: ${error.message}`);
    }
  }
  
  
}

module.exports = new HotelRecheckService();