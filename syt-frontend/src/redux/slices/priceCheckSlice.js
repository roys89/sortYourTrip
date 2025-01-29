// redux/slices/priceCheckSlice.js
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

// Thunks
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

          const flightResult = {
            ...flightDetails,
            newPrice: response.data.data.newPrice,
            priceChanged: response.data.data.priceChanged,
            difference: response.data.data.difference,
            percentageChange: response.data.data.percentageChange,
            status: 'completed'
          };

          totalNewPrice += response.data.data.newPrice;
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

export const recheckHotelPrices = createAsyncThunk(
  'priceCheck/hotels',
  async ({ itineraryToken, inquiryToken }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/itinerary/${itineraryToken}/recheck-hotels`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'X-Inquiry-Token': inquiryToken
          }
        }
      );

      const hotelData = response.data.data;

      // Process hotel results
      if (hotelData.details && Array.isArray(hotelData.details)) {
        hotelData.details.forEach(hotel => {
          dispatch(updateHotelCheckProgress({
            currentHotel: {
              traceId: hotel.traceId,
              name: hotel.hotelName,
              roomType: hotel.roomType
            },
            result: {
              ...hotel,
              status: 'completed'
            },
            isChecking: false,
            isCompleted: true
          }));
        });
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const recheckActivityPrices = createAsyncThunk(
  'priceCheck/activities',
  async ({ itineraryToken, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/itinerary/${itineraryToken}/recheck-activities`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'X-Inquiry-Token': inquiryToken
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
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
  activities: {
    loading: false,
    error: null,
    data: null,
    retryCount: 0
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

      // Activity reducers
      .addCase(recheckActivityPrices.pending, (state) => {
        state.activities.loading = true;
        state.activities.error = null;
      })
      .addCase(recheckActivityPrices.fulfilled, (state, action) => {
        state.activities.loading = false;
        state.activities.data = action.payload;
        state.activities.error = null;
      })
      .addCase(recheckActivityPrices.rejected, (state, action) => {
        state.activities.loading = false;
        state.activities.error = action.payload;
      });
  }
});

export const {
  resetPriceCheck,
  setOverallStatus,
  resetComponentState,
  incrementRetryCount,
  updateFlightCheckProgress,
  updateHotelCheckProgress
} = priceCheckSlice.actions;

// Selectors
export const selectFlightProgress = state => state.priceCheck.flights.progress;
export const selectHotelProgress = state => state.priceCheck.hotels.progress;
export const selectOverallStatus = state => state.priceCheck.overallStatus;

export default priceCheckSlice.reducer;