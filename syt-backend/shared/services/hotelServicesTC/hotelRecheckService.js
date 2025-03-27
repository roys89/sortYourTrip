const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class HotelRecheckService {
  static async recheckHotels(hotelQueries, token) {
    try {
      const results = [];
      let totalPrice = 0;

      for (const query of hotelQueries) {
        try {
          const url = `https://hotel-api-sandbox.travclan.com/api/v1/hotels/itineraries/${query.itineraryCode}/check-price`;
          
          const response = await axios.get(
            url,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'source': 'website',
                'authorization-type': 'external-service'
              },
              params: {
                traceId: query.traceId
              }
            }
          );

          // Log the API call
          apiLogger.logApiData({
            inquiryToken: query.inquiryToken,
            apiType: 'hotel_price_recheck',
            date: new Date().toISOString().split('T')[0],
            searchId: query.traceId,
            itineraryCode: query.itineraryCode,
            requestData: {
              traceId: query.traceId
            },
            responseData: response.data
          });

          const priceData = this.extractPriceData(response.data, query);
          if (priceData) {
            totalPrice += priceData.currentTotalAmount;
            results.push(priceData);
          }

        } catch (error) {
          const errorResponse = this.handlePriceCheckError(error, query);
          results.push(errorResponse);

          apiLogger.logApiData({
            inquiryToken: query.inquiryToken,
            apiType: 'hotel_price_recheck_error',
            date: new Date().toISOString().split('T')[0],
            searchId: query.traceId,
            itineraryCode: query.itineraryCode,
            requestData: {
              traceId: query.traceId
            },
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

  static extractPriceData(responseData, query) {
    const hotelResult = responseData.results?.find(result => 
      result.itineraryCode === query.itineraryCode
    );

    if (!hotelResult) return null;

    const { priceChangeData } = hotelResult;
    const hotelData = hotelResult.data?.[0];
    const rate = hotelData?.rates?.[0];

    if (!priceChangeData || !rate) return null;

    return {
      itineraryCode: query.itineraryCode,
      traceId: query.traceId,
      status: 'success',
      priceChangeData: {
        previousTotalAmount: priceChangeData.previousTotalAmount,
        currentTotalAmount: priceChangeData.currentTotalAmount,
        isPriceChanged: priceChangeData.isPriceChanged,
        priceChangeAmount: priceChangeData.isPriceChanged 
          ? priceChangeData.currentTotalAmount - priceChangeData.previousTotalAmount 
          : 0
      },
      rateDetails: {
        baseRate: rate.baseRate,
        finalRate: rate.finalRate,
        taxAmount: rate.taxAmount,
        taxes: rate.taxes || [],
        refundable: rate.refundable,
        cancellationPolicies: rate.cancellationPolicies
      }
    };
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