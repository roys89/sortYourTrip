import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for updating booking status
export const updateBookingStatus = createAsyncThunk(
  'bookingConfirmation/updateBookingStatus',
  async ({ 
    itineraryToken, 
    inquiryToken,
    cityName, 
    date, 
    bookingType, 
    bookingStatus,
    activityCode,
    itineraryCode,
    code,
    quotation_id
  }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/booking-status`,
        { 
          itineraryToken,
          inquiryToken,
          cityName, 
          date,
          bookingType,
          bookingStatus,
          ...(bookingType === 'activity' && { activityCode }),
          ...(bookingType === 'flight' && { itineraryCode }),
          ...(bookingType === 'hotel' && { code }),
          ...(bookingType === 'transfer' && { quotation_id })
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Status update failed' });
    }
  }
);

// Flight Booking Thunk
export const bookFlight = createAsyncThunk(
  'bookingConfirmation/bookFlight',
  async ({ bookingId, flight }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/flight`,
        { flight },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // If booking successful, update status
        await dispatch(updateBookingStatus({
          itineraryToken: flight.itineraryToken,
          inquiryToken: flight.inquiryToken,
          cityName: flight.city,
          date: flight.date,
          bookingType: 'flight',
          bookingStatus: 'confirmed',
          itineraryCode: flight.itineraryCode
        }));
        
        // Set final state after updateBookingStatus
        dispatch(setBookingStatus({
          type: 'flight',
          id: flight.flightData.flightCode,
          status: 'confirmed'
        }));
        
        return response.data;
      } else {
        // If booking fails, just set failed state (don't call updateBookingStatus)
        dispatch(setBookingStatus({
          type: 'flight',
          id: flight.flightData.flightCode,
          status: 'failed'
        }));
        
        throw new Error('Booking unsuccessful');
      }
    } catch (error) {
      // For any error, set failed state (don't call updateBookingStatus)
      dispatch(setBookingStatus({
        type: 'flight',
        id: flight.flightData.flightCode,
        status: 'failed'
      }));
      
      return rejectWithValue(error.response?.data || { message: 'Flight booking failed' });
    }
  }
);

// Hotel Booking Thunk
export const bookHotel = createAsyncThunk(
  'bookingConfirmation/bookHotel',
  async ({ bookingId, hotel }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/hotel`,
        { hotel },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await dispatch(updateBookingStatus({
          itineraryToken: hotel.itineraryToken,
          inquiryToken: hotel.inquiryToken,
          cityName: hotel.city,
          date: hotel.date,
          bookingType: 'hotel',
          bookingStatus: 'confirmed',
          code: hotel.code
        }));

        dispatch(setBookingStatus({
          type: 'hotel',
          id: hotel.traceId,
          status: 'confirmed'
        }));

        return response.data;
      } else {
        dispatch(setBookingStatus({
          type: 'hotel',
          id: hotel.traceId,
          status: 'failed'
        }));

        throw new Error('Booking unsuccessful');
      }
    } catch (error) {
      dispatch(setBookingStatus({
        type: 'hotel',
        id: hotel.traceId,
        status: 'failed'
      }));

      return rejectWithValue(error.response?.data || { message: 'Hotel booking failed' });
    }
  }
);

// Activity Booking Thunk
export const bookActivity = createAsyncThunk(
  'bookingConfirmation/bookActivity',
  async ({ bookingId, activity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/activity`,
        { activity },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await dispatch(updateBookingStatus({
          itineraryToken: activity.transformedActivity.itineraryToken,
          inquiryToken: activity.transformedActivity.inquiryToken,
          cityName: activity.transformedActivity.cityName,
          date: activity.transformedActivity.fromDate,
          bookingType: 'activity',
          bookingStatus: 'confirmed',
          activityCode: activity.transformedActivity.activityCode
        }));

        dispatch(setBookingStatus({
          type: 'activity',
          id: activity.transformedActivity.activityCode,
          status: 'confirmed'
        }));

        return response.data;
      } else {
        dispatch(setBookingStatus({
          type: 'activity',
          id: activity.transformedActivity.activityCode,
          status: 'failed'
        }));

        throw new Error('Booking unsuccessful');
      }
    } catch (error) {
      dispatch(setBookingStatus({
        type: 'activity',
        id: activity.transformedActivity.activityCode,
        status: 'failed'
      }));

      return rejectWithValue(error.response?.data || { message: 'Activity booking failed' });
    }
  }
);

// Transfer Booking Thunk
export const bookTransfer = createAsyncThunk(
  'bookingConfirmation/bookTransfer',
  async ({ bookingId, transfer }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/transfer`,
        { transfer },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await dispatch(updateBookingStatus({
          itineraryToken: transfer.itineraryToken,
          inquiryToken: transfer.inquiryToken,
          cityName: transfer.cityName,
          date: transfer.bookingArray[0].booking_date,
          bookingType: 'transfer',
          bookingStatus: 'confirmed',
          quotation_id: transfer.quotationId
        }));

        dispatch(setBookingStatus({
          type: 'transfer',
          id: transfer.quotationId,
          status: 'confirmed'
        }));

        return response.data;
      } else {
        dispatch(setBookingStatus({
          type: 'transfer',
          id: transfer.quotationId,
          status: 'failed'
        }));

        throw new Error('Booking unsuccessful');
      }
    } catch (error) {
      dispatch(setBookingStatus({
        type: 'transfer',
        id: transfer.quotationId,
        status: 'failed'
      }));

      return rejectWithValue(error.response?.data || { message: 'Transfer booking failed' });
    }
  }
);

// Booking Confirmation Slice
const bookingConfirmationSlice = createSlice({
  name: 'bookingConfirmation',
  initialState: {
    bookingStatuses: {},
    errors: {},
    loading: false,
    bookingLoading: {}
  },
  reducers: {
    resetBookingStatus: (state) => {
      state.bookingStatuses = {};
      state.errors = {};
      state.loading = false;
      state.bookingLoading = {};
    },
    setBookingStatus: (state, action) => {
      const { type, id, status } = action.payload;
      const bookingKey = `${type}-${id}`;
      
      // Update both status and loading based on the status
      state.bookingStatuses[bookingKey] = status;
      state.bookingLoading[bookingKey] = status === 'loading';
    }
  },
  extraReducers: (builder) => {
    builder
      // Update Booking Status Reducers
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBookingStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.errors = action.payload;
      })

      // Flight Booking Reducers
      .addCase(bookFlight.pending, (state, action) => {
        const flightCode = action.meta.arg.flight.flightData?.flightCode;
        const bookingKey = `flight-${flightCode}`;
        state.errors[bookingKey] = null;
      })
      .addCase(bookFlight.rejected, (state, action) => {
        const flightCode = action.meta.arg.flight.flightData?.flightCode;
        const bookingKey = `flight-${flightCode}`;
        state.errors[bookingKey] = action.error.message;
      })

      // Hotel Booking Reducers
      .addCase(bookHotel.pending, (state, action) => {
        const traceId = action.meta.arg.hotel.traceId;
        const bookingKey = `hotel-${traceId}`;
        state.errors[bookingKey] = null;
      })
      .addCase(bookHotel.rejected, (state, action) => {
        const traceId = action.meta.arg.hotel.traceId;
        const bookingKey = `hotel-${traceId}`;
        state.errors[bookingKey] = action.error.message;
      })

      // Activity Booking Reducers
      .addCase(bookActivity.pending, (state, action) => {
        const activityCode = action.meta.arg.activity.transformedActivity.activityCode;
        const bookingKey = `activity-${activityCode}`;
        state.errors[bookingKey] = null;
      })
      .addCase(bookActivity.rejected, (state, action) => {
        const activityCode = action.meta.arg.activity.transformedActivity.activityCode;
        const bookingKey = `activity-${activityCode}`;
        state.errors[bookingKey] = action.error.message;
      })

      // Transfer Booking Reducers
      .addCase(bookTransfer.pending, (state, action) => {
        const quotationId = action.meta.arg.transfer.quotationId;
        const bookingKey = `transfer-${quotationId}`;
        state.errors[bookingKey] = null;
      })
      .addCase(bookTransfer.rejected, (state, action) => {
        const quotationId = action.meta.arg.transfer.quotationId;
        const bookingKey = `transfer-${quotationId}`;
        state.errors[bookingKey] = action.error.message;
      });
  }
});

export const {
  resetBookingStatus,
  setBookingStatus
} = bookingConfirmationSlice.actions;

export default bookingConfirmationSlice.reducer;