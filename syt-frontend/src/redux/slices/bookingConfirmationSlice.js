import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { batch } from 'react-redux';

// Async thunk for updating booking status
export const updateBookingStatus = createAsyncThunk(
  'bookingConfirmation/updateBookingStatus',
  async ({ 
    bookingId,
    itineraryToken, 
    inquiryToken,
    cityName, 
    date, 
    bookingType, 
    bookingStatus,
    bookingResponse,
    activityCode,
    itineraryCode,
    code,
    quotation_id
  }, { rejectWithValue }) => {
    try {
      // For offline activities, skip API call
      if (bookingType === 'activity' && bookingResponse?.offlineDetails) {
        return { 
          success: true, 
          data: bookingResponse,
          offlineActivity: true 
        };
      }

      const response = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/booking-status`,
        { 
          bookingId,
          itineraryToken,
          inquiryToken,
          cityName, 
          date,
          bookingType,
          bookingStatus,
          bookingResponse,
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
    const flightId = flight.flightData.flightCode;
    
    try {
      dispatch(setBookingStatus({
        type: 'flight',
        id: flightId,
        status: 'loading'
      }));

      const response = await axios.post(
        `http://localhost:5000/api/booking/itinerary/${bookingId}/flight`,
        { flight },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await dispatch(updateBookingStatus({
          bookingId, 
          itineraryToken: flight.itineraryToken,
          inquiryToken: flight.inquiryToken,
          cityName: flight.city,
          date: flight.date,
          bookingType: 'flight',
          bookingStatus: 'confirmed',
          itineraryCode: flight.itineraryCode,
          bookingResponse: response.data
        })).unwrap();

        dispatch(setBookingStatus({
          type: 'flight',
          id: flightId,
          status: 'confirmed'
        }));

        return response.data;
      } else {
        throw new Error('Booking unsuccessful');
      }
    } catch (error) {
      dispatch(setBookingStatus({
        type: 'flight',
        id: flightId,
        status: 'failed',
        error: error.response?.data?.message || error.message
      }));

      return rejectWithValue(error.response?.data || { message: 'Flight booking failed' });
    }
  }
);

// Hotel Booking Thunk
export const bookHotel = createAsyncThunk(
  'bookingConfirmation/bookHotel',
  async ({ bookingId, hotel }, { dispatch, rejectWithValue }) => {
    const hotelId = hotel.traceId;

    try {
      dispatch(setBookingStatus({
        type: 'hotel',
        id: hotelId,
        status: 'loading'
      }));

      const response = await axios.post(
        `http://localhost:5000/api/booking/itinerary/${bookingId}/hotel`,
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
          bookingId, 
          itineraryToken: hotel.itineraryToken,
          inquiryToken: hotel.inquiryToken,
          cityName: hotel.city,
          date: hotel.date,
          bookingType: 'hotel',
          bookingStatus: 'confirmed',
          code: hotel.code,
          bookingResponse: response.data
        })).unwrap();

        dispatch(setBookingStatus({
          type: 'hotel',
          id: hotelId,
          status: 'confirmed'
        }));

        return response.data;
      } else {
        throw new Error('Booking unsuccessful');
      }
    } catch (error) {
      dispatch(setBookingStatus({
        type: 'hotel',
        id: hotelId,
        status: 'failed',
        error: error.response?.data?.message || error.message
      }));

      return rejectWithValue(error.response?.data || { message: 'Hotel booking failed' });
    }
  }
);

// Activity Booking Thunk
export const bookActivity = createAsyncThunk(
  'bookingConfirmation/bookActivity',
  async ({ bookingId, activity }, { dispatch, rejectWithValue }) => {
    const activityId = activity.transformedActivity.activityCode;

    try {
      // Handle offline activity
      if (activity.transformedActivity.activityType === 'offline') {
        const offlineDetails = {
          activityCode: activityId,
          date: activity.transformedActivity.fromDate,
          selectedTime: activity.transformedActivity.selectedTime,
          endTime: activity.transformedActivity.endTime,
          timeSlot: activity.transformedActivity.timeSlot,
          departureTime: activity.transformedActivity.departureTime,
          duration: activity.transformedActivity.duration
        };

        await dispatch(updateBookingStatus({
          bookingId, 
          itineraryToken: activity.transformedActivity.itineraryToken,
          inquiryToken: activity.transformedActivity.inquiryToken,
          cityName: activity.transformedActivity.cityName,
          date: activity.transformedActivity.fromDate,
          bookingType: 'activity',
          bookingStatus: 'confirmed',
          activityCode: activityId,
          bookingResponse: { 
            offlineDetails, 
            success: true 
          }
        })).unwrap();

        dispatch(setBookingStatus({
          type: 'activity',
          id: activityId,
          status: 'confirmed'
        }));

        return { success: true, data: offlineDetails };
      }

      dispatch(setBookingStatus({
        type: 'activity',
        id: activityId,
        status: 'loading'
      }));

      const response = await axios.post(
        `http://localhost:5000/api/booking/itinerary/${bookingId}/activity`,
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
          bookingId, 
          itineraryToken: activity.transformedActivity.itineraryToken,
          inquiryToken: activity.transformedActivity.inquiryToken,
          cityName: activity.transformedActivity.cityName,
          date: activity.transformedActivity.fromDate,
          bookingType: 'activity',
          bookingStatus: 'confirmed',
          activityCode: activityId,
          bookingResponse: response.data
        })).unwrap();

        dispatch(setBookingStatus({
          type: 'activity',
          id: activityId,
          status: 'confirmed'
        }));

        return response.data;
      } else {
        throw new Error('Booking unsuccessful');
      }
    } catch (error) {
      dispatch(setBookingStatus({
        type: 'activity',
        id: activityId,
        status: 'failed',
        error: error.response?.data?.message || error.message
      }));

      return rejectWithValue(error.response?.data || { message: 'Activity booking failed' });
    }
  }
);

// Transfer Booking Thunk
export const bookTransfer = createAsyncThunk(
  'bookingConfirmation/bookTransfer',
  async ({ bookingId, transfer }, { dispatch, rejectWithValue }) => {
    const transferId = transfer.quotationId;

    try {
      dispatch(setBookingStatus({
        type: 'transfer',
        id: transferId,
        status: 'loading'
      }));

      const response = await axios.post(
        `http://localhost:5000/api/booking/itinerary/${bookingId}/transfer`,
        { transfer },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check both response.data.success and that we have booking_id
      if (response.data.success && response.data.data?.data?.booking_id) {
        await dispatch(updateBookingStatus({
          bookingId, 
          itineraryToken: transfer.itineraryToken,
          inquiryToken: transfer.inquiryToken,
          cityName: transfer.cityName,
          date: transfer.bookingArray[0].booking_date,
          bookingType: 'transfer',
          bookingStatus: 'confirmed',
          quotation_id: transferId,
          bookingResponse: response.data || null
        })).unwrap();

        dispatch(setBookingStatus({
          type: 'transfer',
          id: transferId,
          status: 'confirmed'
        }));

        return response.data;
      } else {
        // More descriptive error
        const errorMsg = !response.data.success 
          ? 'Transfer booking failed' 
          : 'Missing booking ID in response';
        throw new Error(errorMsg);
      }
    } catch (error) {
      dispatch(setBookingStatus({
        type: 'transfer',
        id: transferId,
        status: 'failed',
        error: error.response?.data?.message || error.message
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
      const { type, id, status, error, bookingDetails } = action.payload;
      const bookingKey = `${type}-${id}`;
      
      batch(() => {
        state.bookingStatuses[bookingKey] = status;
        state.bookingLoading[bookingKey] = status === 'loading';
        
        if (error) {
          state.errors[bookingKey] = error;
        } else {
          delete state.errors[bookingKey];
        }

        // Optional: Store booking details if provided
        if (bookingDetails) {
          state[`${bookingKey}-details`] = bookingDetails;
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBookingStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.errors = action.payload;
      });
  }
});

export const {
  resetBookingStatus,
  setBookingStatus
} = bookingConfirmationSlice.actions;

export default bookingConfirmationSlice.reducer;