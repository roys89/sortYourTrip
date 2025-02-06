// src/redux/slices/bookingConfirmationSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for booking an activity
export const bookActivity = createAsyncThunk(
  'bookingConfirmation/bookActivity',
  async ({ bookingId, activity, travelers, specialRequirements }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/activity`,
        { activity, travelers, specialRequirements },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { activityId: activity.activityCode, ...response.data };
    } catch (error) {
      return rejectWithValue({
        activityId: activity.activityCode,
        error: error.response?.data?.message || 'Failed to book activity'
      });
    }
  }
);

// Async thunk for booking a hotel
export const bookHotel = createAsyncThunk(
  'bookingConfirmation/bookHotel',
  async ({ bookingId, hotel, travelers }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/hotel`,
        { hotel, travelers },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { hotelId: hotel.traceId, ...response.data };
    } catch (error) {
      return rejectWithValue({
        hotelId: hotel.traceId,
        error: error.response?.data?.message || 'Failed to book hotel'
      });
    }
  }
);

// Async thunk for booking a flight
export const bookFlight = createAsyncThunk(
  'bookingConfirmation/bookFlight',
  async ({ bookingId, flight, travelers }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/flight`,
        { flight, travelers },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { flightId: flight.flightCode, ...response.data };
    } catch (error) {
      return rejectWithValue({
        flightId: flight.flightCode,
        error: error.response?.data?.message || 'Failed to book flight'
      });
    }
  }
);

// Async thunk for booking a transfer
export const bookTransfer = createAsyncThunk(
  'bookingConfirmation/bookTransfer',
  async ({ bookingId, transfer, travelers }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/transfer`,
        { transfer, travelers },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { transferId: transfer.transferId, ...response.data };
    } catch (error) {
      return rejectWithValue({
        transferId: transfer.transferId,
        error: error.response?.data?.message || 'Failed to book transfer'
      });
    }
  }
);

const initialState = {
  bookingStatuses: {},  // Stores status for each booking item
  errors: {},           // Stores errors for each booking item
  loading: false,
  vouchers: {},         // Stores voucher download statuses
  overallStatus: 'pending' // Overall booking status
};

const bookingConfirmationSlice = createSlice({
  name: 'bookingConfirmation',
  initialState,
  reducers: {
    resetBookingStatus: () => initialState,
    setVoucherStatus: (state, action) => {
      const { itemId, status } = action.payload;
      state.vouchers[itemId] = status;
    },
    setBookingStatus: (state, action) => {
      const { type, id, status } = action.payload;
      state.bookingStatuses[`${type}-${id}`] = status;
    }
  },
  extraReducers: (builder) => {
    // Activity booking
    builder
      .addCase(bookActivity.pending, (state, action) => {
        const activityId = action.meta.arg.activity.activityCode;
        state.bookingStatuses[`activity-${activityId}`] = 'loading';
        state.loading = true;
      })
      .addCase(bookActivity.fulfilled, (state, action) => {
        const activityId = action.meta.arg.activity.activityCode;
        state.bookingStatuses[`activity-${activityId}`] = 'confirmed';
        state.loading = false;
      })
      .addCase(bookActivity.rejected, (state, action) => {
        const activityId = action.meta.arg.activity.activityCode;
        state.bookingStatuses[`activity-${activityId}`] = 'failed';
        state.errors[`activity-${activityId}`] = action.error.message;
        state.loading = false;
      })

    // Hotel booking
    builder
      .addCase(bookHotel.pending, (state, action) => {
        const hotelId = action.meta.arg.hotel.traceId;
        state.bookingStatuses[`hotel-${hotelId}`] = 'loading';
        state.loading = true;
      })
      .addCase(bookHotel.fulfilled, (state, action) => {
        const hotelId = action.meta.arg.hotel.traceId;
        state.bookingStatuses[`hotel-${hotelId}`] = 'confirmed';
        state.loading = false;
      })
      .addCase(bookHotel.rejected, (state, action) => {
        const hotelId = action.meta.arg.hotel.traceId;
        state.bookingStatuses[`hotel-${hotelId}`] = 'failed';
        state.errors[`hotel-${hotelId}`] = action.error.message;
        state.loading = false;
      })

    // Flight booking
    builder
      .addCase(bookFlight.pending, (state, action) => {
        const flightId = action.meta.arg.flight.flightCode;
        state.bookingStatuses[`flight-${flightId}`] = 'loading';
        state.loading = true;
      })
      .addCase(bookFlight.fulfilled, (state, action) => {
        const flightId = action.meta.arg.flight.flightCode;
        state.bookingStatuses[`flight-${flightId}`] = 'confirmed';
        state.loading = false;
      })
      .addCase(bookFlight.rejected, (state, action) => {
        const flightId = action.meta.arg.flight.flightCode;
        state.bookingStatuses[`flight-${flightId}`] = 'failed';
        state.errors[`flight-${flightId}`] = action.error.message;
        state.loading = false;
      })

    // Transfer booking
    builder
      .addCase(bookTransfer.pending, (state, action) => {
        const transferId = action.meta.arg.transfer.transferId;
        state.bookingStatuses[`transfer-${transferId}`] = 'loading';
        state.loading = true;
      })
      .addCase(bookTransfer.fulfilled, (state, action) => {
        const transferId = action.meta.arg.transfer.transferId;
        state.bookingStatuses[`transfer-${transferId}`] = 'confirmed';
        state.loading = false;
      })
      .addCase(bookTransfer.rejected, (state, action) => {
        const transferId = action.meta.arg.transfer.transferId;
        state.bookingStatuses[`transfer-${transferId}`] = 'failed';
        state.errors[`transfer-${transferId}`] = action.error.message;
        state.loading = false;
      });
  }
});

export const { resetBookingStatus, setVoucherStatus, setBookingStatus } = bookingConfirmationSlice.actions;
export default bookingConfirmationSlice.reducer;