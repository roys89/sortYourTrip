const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class FlightRecheckService {
  static async recheckFlights(flightQueries, token) {
    try {
      const results = [];

      for (const query of flightQueries) {
        try {
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
            requestData: payload,
            responseData: response.data
          });

          // Enhanced error handling for different response scenarios
          if (response.data.error) {
            const errorResponse = this.handleErrorResponse(response.data.error, query);
            results.push(errorResponse);

            apiLogger.logApiData({
              inquiryToken: query.inquiryToken,
              apiType: 'flight_price_recheck_error',
              date: new Date().toISOString().split('T')[0],
              searchId: query.traceId,
              itineraryCode: query.itineraryCode,
              requestData: { traceId: query.traceId },
              responseData: {
                error: response.data.error,
                errorType: errorResponse.type
              }
            });

            continue;
          }

          // Check for valid results
          if (!response.data.results || response.data.results.length === 0) {
            console.error('No results in response:', response.data);
            const noResultsError = this.handleNoResultsError(query);
            results.push(noResultsError);
            continue;
          }

          const {
            previousTotalAmount,
            totalAmount,
            isPriceChanged,
            isBaggageChanged,
            baseFare,
            taxAndSurcharge,
            insuranceAmount = 0
          } = response.data.results; 

          results.push({
            itineraryCode: query.itineraryCode,
            traceId: query.traceId,
            status: 'success',
            previousTotalAmount,
            totalAmount,
            isPriceChanged,
            isBaggageChanged,
            priceChangeAmount: isPriceChanged ? totalAmount - previousTotalAmount : 0,
            details: {
              baseFare,
              taxAndSurcharge,
              insuranceAmount
            }
          });

        } catch (error) {
          console.error('Error processing flight query:', {
            itineraryCode: query.itineraryCode,
            error: error.message,
            response: error.response?.data
          });

          const errorResponse = this.handleFareQuoteError(error, query);
          results.push(errorResponse);

          apiLogger.logApiData({
            inquiryToken: query.inquiryToken,
            apiType: 'flight_price_recheck_error',
            date: new Date().toISOString().split('T')[0],
            searchId: query.traceId,
            itineraryCode: query.itineraryCode,
            requestData: { traceId: query.traceId },
            responseData: {
              error: error.response?.data || {},
              message: error.message,
              status: error.response?.status,
              errorType: errorResponse.type
            }
          });
        }
      }

      // Calculate total from successful results only
      const totalAmount = results
        .filter(result => result.status === 'success')
        .reduce((sum, result) => sum + (result.totalAmount || 0), 0);

      return {
        total: totalAmount,
        details: results
      };

    } catch (error) {
      console.error('Error in FlightRecheckService:', error);
      throw error;
    }
  }

  static handleErrorResponse(errorData, query) {
    const errorResponse = {
      itineraryCode: query.itineraryCode,
      traceId: query.traceId,
      status: 'error',
      message: errorData.error?.errorMessage || 'Unknown error occurred'
    };

    // Map specific error codes
    switch (errorData.error?.errorCode) {
      case 6:
        errorResponse.type = 'RESULTS_EXPIRED';
        errorResponse.message = 'Results have expired. Please try again.';
        break;
      case 1000:
        errorResponse.type = 'AVAILABILITY';
        errorResponse.message = 'Flight no longer available';
        break;
      default:
        errorResponse.type = 'API_ERROR';
    }

    return errorResponse;
  }

  static handleNoResultsError(query) {
    return {
      itineraryCode: query.itineraryCode,
      traceId: query.traceId,
      status: 'error',
      type: 'NO_RESULTS',
      message: 'No flight results available'
    };
  }

  static handleFareQuoteError(error, query) {
    const errorResponse = {
      itineraryCode: query.itineraryCode,
      traceId: query.traceId,
      status: 'error',
      message: error.message || 'Unknown error occurred'
    };

    if (error.response?.data?.error?.errorCode === '1000') {
      errorResponse.message = 'Flight no longer available';
      errorResponse.type = 'AVAILABILITY';
    } else if (error.response?.status === 429) {
      errorResponse.message = 'Too many requests. Please try again later';
      errorResponse.type = 'RATE_LIMIT';
    } else if (!error.response) {
      errorResponse.type = 'NETWORK_ERROR';
    } else if (error.response?.data?.error) {
      // Handle error responses with specific error objects
      const errorData = error.response.data.error;
      errorResponse.message = errorData.errorMessage || errorResponse.message;
      
      switch (errorData.errorCode) {
        case 6:
          errorResponse.type = 'RESULTS_EXPIRED';
          errorResponse.message = 'Results have expired. Please try again.';
          break;
        default:
          errorResponse.type = 'API_ERROR';
      }
    } else {
      errorResponse.type = 'API_ERROR';
    }

    return errorResponse;
  }
}

module.exports = FlightRecheckService;