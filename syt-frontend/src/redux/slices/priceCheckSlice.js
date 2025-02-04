import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper to extract flight details
const extractFlightDetails = (flight) => ({
  itineraryCode: flight.flightData.bookingDetails?.itineraryCode || null,
  traceId: flight.flightData.traceId,
  origin: flight.flightData.origin,
  destination: flight.flightData.destination,
  flightCode: flight.flightData.flightCode,
  originalPrice: flight.flightData.price || flight.flightData.fareDetails?.finalFare
});

export const recheckFlightPrices = createAsyncThunk(
  'priceCheck/flights',
  async ({ itineraryToken, inquiryToken, flights }, { dispatch, rejectWithValue }) => {
    try {
      const results = [];
      let totalNewPrice = 0;
      
      for (const flight of flights) {
        const flightDetails = extractFlightDetails(flight);
        
        try {
          dispatch(updateFlightCheckProgress({
            currentFlight: flightDetails,
            isChecking: true
          }));

          const response = await axios.post(
            `http://localhost:5000/api/itinerary/${itineraryToken}/recheck-flights`,
            { 
              flightQueries: [
                {
                  itineraryCode: flightDetails.itineraryCode,
                  traceId: flightDetails.traceId
                }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'X-Inquiry-Token': inquiryToken
              }
            }
          );

          // Extract flight data from the response
          const flightData = response.data.data.details[0];
          const newPrice = flightData.totalAmount;
          const priceChanged = flightData.isPriceChanged;
          const difference = newPrice - flightDetails.originalPrice;
          const percentageChange = (difference / flightDetails.originalPrice) * 100;

          const flightResult = {
            ...flightDetails,
            newPrice: newPrice,
            priceChanged: priceChanged,
            difference: difference,
            percentageChange: percentageChange,
            baseFare: flightData.details.baseFare,
            taxAndSurcharge: flightData.details.taxAndSurcharge,
            status: 'completed'
          };

          totalNewPrice += newPrice;
          results.push(flightResult);

          dispatch(updateFlightCheckProgress({
            currentFlight: flightDetails,
            result: flightResult,
            isChecking: false,
            isCompleted: true
          }));

        } catch (error) {
          results.push({
            ...flightDetails,
            error: error.response?.data?.message || error.message,
            status: 'failed'
          });

          dispatch(updateFlightCheckProgress({
            currentFlight: flightDetails,
            error: error.response?.data?.message || error.message,
            isChecking: false,
            isCompleted: true
          }));
        }
      }

      return {
        results,
        newPrice: totalNewPrice
      };

    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const extractHotelDetails = (hotel) => ({
  traceId: hotel.data.traceId,
  itineraryCode: hotel.data.code,  
  name: hotel.data.hotelDetails.name,
  roomType: hotel.data.items[0]?.selectedRoomsAndRates[0]?.room?.name,
  originalPrice: hotel.data.items[0]?.selectedRoomsAndRates[0]?.rate?.finalRate
});

export const recheckHotelPrices = createAsyncThunk(
  'priceCheck/hotels',
  async ({ itineraryToken, inquiryToken, hotels }, { dispatch, rejectWithValue }) => {
    try {
      const results = [];
      let totalNewPrice = 0;
      
      for (const hotel of hotels) {
        const hotelDetails = extractHotelDetails(hotel);
        
        try {
          dispatch(updateHotelCheckProgress({
            currentHotel: hotelDetails,
            isChecking: true
          }));

          const response = await axios.post(
            `http://localhost:5000/api/itinerary/${itineraryToken}/recheck-hotels`,
            { 
              hotelQueries: [
                {
                  traceId: hotelDetails.traceId,
                  itineraryCode: hotelDetails.itineraryCode
                }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'X-Inquiry-Token': inquiryToken
              }
            }
          );

          // Extract hotel data from the response
          const hotelData = response.data.data.details[0];
          const newPrice = hotelData.priceChangeData.currentTotalAmount;
          const priceChanged = hotelData.priceChangeData.isPriceChanged;
          const difference = newPrice - hotelDetails.originalPrice;
          const percentageChange = (difference / hotelDetails.originalPrice) * 100;

          const hotelResult = {
            ...hotelDetails,
            newPrice: newPrice,
            priceChanged: priceChanged,
            difference: difference,
            percentageChange: percentageChange,
            baseRate: hotelData.rateDetails.baseRate,
            finalRate: hotelData.rateDetails.finalRate,
            status: 'completed'
          };

          totalNewPrice += newPrice;
          results.push(hotelResult);

          dispatch(updateHotelCheckProgress({
            currentHotel: hotelDetails,
            result: hotelResult,
            isChecking: false,
            isCompleted: true
          }));

        } catch (error) {
          results.push({
            ...hotelDetails,
            error: error.response?.data?.message || error.message,
            status: 'failed'
          });

          dispatch(updateHotelCheckProgress({
            currentHotel: hotelDetails,
            error: error.response?.data?.message || error.message,
            isChecking: false,
            isCompleted: true
          }));
        }
      }

      return {
        results,
        total: totalNewPrice
      };

    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// Initial state with priceSummary
const initialState = {
  flights: {
    loading: false,
    error: null,
    data: null,
    retryCount: 0,
    progress: {
      currentFlight: null,
      results: [],
      completed: false,
      isChecking: false
    }
  },
  hotels: {
    loading: false,
    error: null,
    data: null,
    retryCount: 0,
    progress: {
      currentHotel: null,
      results: [],
      completed: false,
      isChecking: false
    }
  },
  priceSummary: {
    originalTotals: null,
    newTotals: null,
    difference: 0,
    percentageChange: 0,
    hasPriceChanged: false
  },
  overallStatus: 'idle' // idle, checking, completed, failed
};

const priceCheckSlice = createSlice({
  name: 'priceCheck',
  initialState,
  reducers: {
    resetPriceCheck: () => initialState,
    
    setOverallStatus: (state, action) => {
      state.overallStatus = action.payload;
    },
    
    resetComponentState: (state, action) => {
      const component = action.payload;
      if (state[component]) {
        state[component] = initialState[component];
      }
    },
    
    incrementRetryCount: (state, action) => {
      const component = action.payload;
      if (state[component]) {
        state[component].retryCount += 1;
      }
    },

    updateFlightCheckProgress: (state, action) => {
      const { currentFlight, result, error, isChecking, isCompleted } = action.payload;
      
      state.flights.progress = {
        ...state.flights.progress,
        currentFlight: isChecking ? currentFlight : null,
        isChecking,
        results: result 
          ? [...state.flights.progress.results, result]
          : state.flights.progress.results,
        error: error || null,
        completed: isCompleted || false
      };
    },

    updateHotelCheckProgress: (state, action) => {
      const { currentHotel, result, error, isChecking, isCompleted } = action.payload;
      
      state.hotels.progress = {
        ...state.hotels.progress,
        currentHotel: isChecking ? currentHotel : null,
        isChecking,
        results: result 
          ? [...state.hotels.progress.results, result]
          : state.hotels.progress.results,
        error: error || null,
        completed: isCompleted || false
      };
    },

    // New reducer to update price summary
    updatePriceSummary: (state, action) => {
      state.priceSummary = {
        ...state.priceSummary,
        ...action.payload
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Flight reducers
      .addCase(recheckFlightPrices.pending, (state) => {
        state.flights.loading = true;
        state.flights.error = null;
        state.flights.progress = { ...initialState.flights.progress };
      })
      .addCase(recheckFlightPrices.fulfilled, (state, action) => {
        state.flights.loading = false;
        state.flights.data = action.payload;
        state.flights.error = null;
        state.flights.progress.completed = true;
      })
      .addCase(recheckFlightPrices.rejected, (state, action) => {
        state.flights.loading = false;
        state.flights.error = action.payload;
        state.flights.progress.completed = true;
      })

      // Hotel reducers
      .addCase(recheckHotelPrices.pending, (state) => {
        state.hotels.loading = true;
        state.hotels.error = null;
        state.hotels.progress = { ...initialState.hotels.progress };
      })
      .addCase(recheckHotelPrices.fulfilled, (state, action) => {
        state.hotels.loading = false;
        state.hotels.data = action.payload;
        state.hotels.error = null;
        state.hotels.progress.completed = true;
      })
      .addCase(recheckHotelPrices.rejected, (state, action) => {
        state.hotels.loading = false;
        state.hotels.error = action.payload;
        state.hotels.progress.completed = true;
      })
  }
});

export const {
  resetPriceCheck,
  setOverallStatus,
  resetComponentState,
  incrementRetryCount,
  updateFlightCheckProgress,
  updateHotelCheckProgress,
  updatePriceSummary
} = priceCheckSlice.actions;

// Selectors
export const selectFlightProgress = state => state.priceCheck.flights.progress;
export const selectHotelProgress = state => state.priceCheck.hotels.progress;
export const selectOverallStatus = state => state.priceCheck.overallStatus;

export default priceCheckSlice.reducer;