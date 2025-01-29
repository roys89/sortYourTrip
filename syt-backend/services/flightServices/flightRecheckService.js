// services/flightServices/flightRecheckService.js
const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightRecheckService {
  static async recheckFlights(flightQueries, token) {
    try {
      const results = [];
      let totalPrice = 0;

      for (const query of flightQueries) {
        try {
          // Correct API structure - itineraryCode in URL, only traceId in body
          const url = `https://flight-aggregator-api-sandbox.travclan.com/api/v2/flights/itinerary/${query.itineraryCode}/fare-quote`;
          const payload = {
            traceId: query.traceId
          };

          const response = await axios.post(
            url,
            payload,
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
            inquiryToken: query.inquiryToken,
            apiType: 'flight_price_recheck',
            date: new Date().toISOString().split('T')[0],
            searchId: query.traceId,
            itineraryCode: query.itineraryCode,
            requestData: {
              traceId: query.traceId
            },
            responseData: response.data
          });

          const fareQuote = response.data.response?.fareQuote;
          if (this.validateFareQuote(fareQuote)) {
            totalPrice += fareQuote.finalFare;
            results.push({
              itineraryCode: query.itineraryCode,
              traceId: query.traceId,
              newPrice: fareQuote.finalFare,
              details: {
                baseFare: fareQuote.baseFare,
                tax: fareQuote.taxAndSurcharge
              }
            });
          }

        } catch (error) {
          const errorResponse = this.handleFareQuoteError(error, query);
          results.push(errorResponse);

          apiLogger.logApiData({
            inquiryToken: query.inquiryToken,
            apiType: 'flight_price_recheck_error',
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
      console.error('Error in FlightRecheckService:', error);
      throw error;
    }
  }

  // Rest of the class remains the same
  static validateFareQuote(fareQuote) {
    if (!fareQuote) return false;
    if (!fareQuote.baseFare || !fareQuote.taxAndSurcharge || !fareQuote.finalFare) {
      return false;
    }
    return true;
  }

  static handleFareQuoteError(error, query) {
    const errorResponse = {
      itineraryCode: query.itineraryCode,
      traceId: query.traceId,
      status: 'error',
      message: error.message
    };

    if (error.response?.data?.error?.errorCode === '1000') {
      errorResponse.message = 'Flight no longer available';
      errorResponse.type = 'AVAILABILITY';
    } else if (error.response?.status === 429) {
      errorResponse.message = 'Too many requests. Please try again later';
      errorResponse.type = 'RATE_LIMIT';
    }

    return errorResponse;
  }
}

module.exports = FlightRecheckService;