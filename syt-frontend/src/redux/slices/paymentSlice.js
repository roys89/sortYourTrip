import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper to convert seconds to minutes
// const getMinutesFromSeconds = (seconds) => {
//   if (!seconds && seconds !== 0) return null;
//   return Math.floor(seconds / 60);
// };

// Get Flight Itinerary Details Thunk
export const getFlightItineraryDetails = createAsyncThunk(
  'payment/getFlightItineraryDetails',
  async ({ 
    itineraryToken, 
    cityName, 
    date,
    itineraryCode,
    traceId,
    inquiryToken
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/itinerary/${itineraryToken}/flight-details`,
        {
          itineraryToken,
          cityName,
          date,
          itineraryCode,
          traceId,
          inquiryToken
        },
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

// Get Hotel Itinerary Details Thunk
export const getHotelItineraryDetails = createAsyncThunk(
  'payment/getHotelItineraryDetails',
  async ({ 
    itineraryToken, 
    cityName, 
    date,
    itineraryCode,
    traceId,
    hotelId,
    inquiryToken
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/itinerary/${itineraryToken}/hotel-details`,
        {
          itineraryToken,
          cityName,
          date,
          itineraryCode,
          traceId,
          hotelId,
          inquiryToken
        },
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

// Create Payment Order Thunk
export const createPaymentOrder = createAsyncThunk(
  'payment/createOrder',
  async ({ bookingId, amount, itinerary }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/payment/create-order',
        {
          bookingId,
          amount,
          itineraryToken: itinerary.itineraryToken,
          inquiryToken: itinerary.inquiryToken,
          totalAmount: itinerary.priceTotals.grandTotal,
          tcsAmount: itinerary.priceTotals.tcsAmount,
          tcsRate: itinerary.priceTotals.tcsRate,
          userInfo: itinerary.userInfo
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create order' });
    }
  }
);

// Verify Payment Thunk
export const verifyPayment = createAsyncThunk(
  'payment/verify',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/payment/verify',
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Payment verification failed' });
    }
  }
);

// Validate Itinerary Components Thunk
export const validateItineraryComponents = createAsyncThunk(
  'payment/validateItineraryComponents',
  async ({ itinerary, itineraryToken }, { dispatch, rejectWithValue }) => {
    try {
      const componentsToCheck = {
        immediate: [], 
        warning: [], 
        info: [], 
        error: [] 
      };

      // Add a safety mechanism to ensure components are processed
      const processComponents = async (components, type) => {
        const checks = await Promise.all(
          components.map(async (component) => {
            try {
              let details;
              if (type === 'flight') {
                details = await dispatch(
                  getFlightItineraryDetails({
                    itineraryToken,
                    cityName: component.flightData.origin,
                    date: component.flightData.departureDate,
                    itineraryCode: component.flightData.bookingDetails?.itineraryCode,
                    traceId: component.flightData.traceId,
                    inquiryToken: itinerary.inquiryToken
                  })
                ).unwrap();
              } else if (type === 'hotel') {
                details = await dispatch(
                  getHotelItineraryDetails({
                    itineraryToken,
                    cityName: component.data.hotelDetails.cityName,
                    date: component.data.hotelDetails.checkInDate,
                    itineraryCode: component.data.code,
                    traceId: component.data.traceId,
                    hotelId: component.data.staticContent[0].id,
                    inquiryToken: itinerary.inquiryToken
                  })
                ).unwrap();
              }

              // Comprehensive error checking
              if (!details.success) {
                const errorComponent = {
                  type,
                  [type]: component,
                  error: {
                    message: `${type.charAt(0).toUpperCase() + type.slice(1)} validation failed`,
                    details: details
                  }
                };
                componentsToCheck.error.push(errorComponent);
                componentsToCheck.immediate.push(errorComponent);
                return { valid: false, error: errorComponent };
              }

              // Extract remaining time with multiple fallback paths
              const remainingTime = 
                details.data?.results?.traceIdDetails?.remainingTime ||
                details.data?.results?.remainingTime ||
                details.results?.remainingTime ||
                details.remainingTime;

              const remainingMinutes = remainingTime !== null && remainingTime !== undefined 
                ? Math.floor(remainingTime / 60) 
                : null;

              const componentInfo = {
                type,
                [type]: component,
                remainingTime: remainingMinutes,
                origin: type === 'flight' 
                  ? component.flightData.origin 
                  : component.data.hotelDetails.name,
                destination: type === 'flight' 
                  ? component.flightData.destination 
                  : component.data.hotelDetails.cityName
              };

              // Categorize components based on remaining time
              if (remainingMinutes === null || remainingMinutes < 2) {
                componentsToCheck.immediate.push(componentInfo);
                componentsToCheck.error.push({
                  ...componentInfo,
                  error: { 
                    message: 'Remaining time is critically low', 
                    details: { remainingTime, remainingMinutes }
                  }
                });
              } else if (remainingMinutes < 3) {
                componentsToCheck.warning.push(componentInfo);
              } else {
                componentsToCheck.info.push(componentInfo);
              }

              return { valid: true, details, remainingTime: remainingMinutes };
            } catch (error) {
              console.error(`${type} validation error:`, error);
              const errorComponent = {
                type,
                [type]: component,
                error: {
                  message: `${type.charAt(0).toUpperCase() + type.slice(1)} validation failed`,
                  details: error
                }
              };
              componentsToCheck.error.push(errorComponent);
              componentsToCheck.immediate.push(errorComponent);
              return { valid: false, error };
            }
          })
        );

        return checks;
      };

      // Process flights and hotels
      const flightComponents = itinerary.cities.flatMap(city => 
        city.days.flatMap(day => day.flights || [])
      );
      const hotelComponents = itinerary.cities.flatMap(city => 
        city.days.flatMap(day => day.hotels || [])
      );

      await processComponents(flightComponents, 'flight');
      await processComponents(hotelComponents, 'hotel');

      // Final logging of components
      console.error('FINAL COMPONENTS TO CHECK:', {
        immediate: componentsToCheck.immediate.length,
        warning: componentsToCheck.warning.length,
        info: componentsToCheck.info.length,
        error: componentsToCheck.error.length
      });

      return {
        componentsToCheck,
        overallValidity: {
          flights: flightComponents.length === 0 || 
                   flightComponents.every(f => 
                     componentsToCheck.immediate.some(c => c.flight === f) === false
                   ),
          hotels: hotelComponents.length === 0 || 
                  hotelComponents.every(h => 
                    componentsToCheck.immediate.some(c => c.hotel === h) === false
                  )
        }
      };
    } catch (error) {
      console.error('FINAL VALIDATION ERROR:', error);
      return rejectWithValue({
        message: 'Comprehensive validation failed',
        error: error
      });
    }
  }
);
// Initial State
const initialState = {
  orderId: null,
  paymentId: null,
  signature: null,
  status: 'idle',
  error: null,
  termsAccepted: false,
  loading: false,
  itineraryValidation: {
    loading: false,
    error: null,
    flightChecks: [],
    hotelChecks: [],
    overallValidity: {
      flights: true,
      hotels: true
    }
  }
};

// Payment Slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setTermsAccepted: (state, action) => {
      state.termsAccepted = action.payload;
    },
    resetPayment: () => initialState,
    clearPaymentError: (state) => {
      state.error = null;
    },
    setPaymentLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = 'loading';
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orderId = action.payload.data.orderId;
        state.status = 'succeeded';
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create order';
        state.status = 'failed';
      })
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentId = action.payload.data.paymentId;
        state.status = 'succeeded';
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Payment verification failed';
        state.status = 'failed';
      })
      .addCase(validateItineraryComponents.pending, (state) => {
        state.itineraryValidation.loading = true;
        state.itineraryValidation.error = null;
      })
      .addCase(validateItineraryComponents.fulfilled, (state, action) => {
        state.itineraryValidation.loading = false;
        state.itineraryValidation.flightChecks = action.payload.flightChecks;
        state.itineraryValidation.hotelChecks = action.payload.hotelChecks;
        state.itineraryValidation.overallValidity = action.payload.overallValidity;
        state.itineraryValidation.componentsToCheck = action.payload.componentsToCheck;
      })
      .addCase(validateItineraryComponents.rejected, (state, action) => {
        state.itineraryValidation.loading = false;
        state.itineraryValidation.error = action.payload;
      });
  }
});

export const { 
  setTermsAccepted, 
  resetPayment, 
  clearPaymentError,
  setPaymentLoading
} = paymentSlice.actions;

export default paymentSlice.reducer;