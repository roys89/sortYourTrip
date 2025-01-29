// services/hotelServices/hotelRecheckService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelRecheckService {
  static async recheckHotels(hotelQueries, token, inquiryToken) {
    try {
      const results = [];
      let totalPrice = 0;

      for (const query of hotelQueries) {
        try {
          const url = `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/${query.itineraryCode}/check-price/?traceId=${query.traceId}`;

          const response = await axios.get(
            url,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'source': 'website',
                'authorization-type': 'external-service'
              }
            }
          );

          // Log the API call
          apiLogger.logApiData({
            inquiryToken,
            apiType: 'hotel_price_recheck',
            date: new Date().toISOString().split('T')[0],
            searchId: query.traceId,
            quotationId: query.itineraryCode,
            requestData: {},
            responseData: response.data
          });

          // Process response based on the example response provided
          const hotelData = response.data.results?.[0]?.data?.[0];
          if (hotelData) {
            const newPrice = hotelData.rates?.[0]?.finalRate || 0;
            totalPrice += newPrice;
            
            results.push({
              itineraryCode: query.itineraryCode,
              traceId: query.traceId,
              newPrice,
              priceChanged: Math.abs(newPrice - query.originalPrice) > 0,
              difference: newPrice - query.originalPrice,
              percentageChange: ((newPrice - query.originalPrice) / query.originalPrice) * 100,
              details: {
                baseRate: hotelData.rates?.[0]?.baseRate || 0,
                taxes: hotelData.rates?.[0]?.taxes || []
              }
            });
          }

        } catch (error) {
          const errorResponse = this.handlePriceCheckError(error, query);
          results.push(errorResponse);

          apiLogger.logApiData({
            inquiryToken,
            apiType: 'hotel_price_recheck_error',
            date: new Date().toISOString().split('T')[0],
            searchId: query.traceId,
            quotationId: query.itineraryCode,
            requestData: {},
            responseData: {
              error: error.response?.data || {},
              message: error.message,
              status: error.response?.status,
              errorType: errorResponse.type
            }
          });
        }
      }

      return {
        total: totalPrice,
        details: results
      };

    } catch (error) {
      console.error('Error in HotelRecheckService:', error);
      throw error;
    }
  }

  static handlePriceCheckError(error, query) {
    const errorResponse = {
      itineraryCode: query.itineraryCode,
      traceId: query.traceId,
      status: 'error',
      message: error.message
    };

    if (error.response?.data?.error?.code === 'HOTEL_NOT_AVAILABLE') {
      errorResponse.message = 'Hotel no longer available';
      errorResponse.type = 'AVAILABILITY';
    } else if (error.response?.status === 429) {
      errorResponse.message = 'Too many requests. Please try again later';
      errorResponse.type = 'RATE_LIMIT';
    }

    return errorResponse;
  }
}

module.exports = HotelRecheckService;