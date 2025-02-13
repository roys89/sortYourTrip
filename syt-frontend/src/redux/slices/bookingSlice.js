// redux/slices/bookingSlice.js

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Create booking - save raw form data
export const createBooking = createAsyncThunk(
  'booking/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/booking/itinerary',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to create booking',
        errors: error.response?.data?.errors
      });
    }
  }
);

// Get booking by ID
export const getBookingById = createAsyncThunk(
  'booking/getById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/booking/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch booking'
      });
    }
  }
);

// Book all items in itinerary
export const bookAllItems = createAsyncThunk(
  'booking/bookAll',
  async ({ bookingId, itinerary }, { dispatch }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/book-all`,
        { itinerary },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

// Get item voucher
export const getItemVoucher = createAsyncThunk(
  'booking/getVoucher',
  async ({ bookingId, type, item }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/booking/${bookingId}/voucher/${type}/${item.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/pdf'
          },
          responseType: 'blob'
        }
      );

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voucher-${type}-${item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { type, itemId: item.id };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to download voucher',
        type,
        itemId: item.id
      });
    }
  }
);

const initialState = {
  currentBooking: null,
  loading: false,
  error: null,
  success: false,
  voucherStatuses: {} // Added for voucher tracking
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
    clearBookingSuccess: (state) => {
      state.success = false;
    },
    resetBookingState: () => initialState,
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.data;
        state.success = true;
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // Get booking by ID
      .addCase(getBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.data;
        state.error = null;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Book all items
      .addCase(bookAllItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookAllItems.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.data;
        state.success = true;
      })
      .addCase(bookAllItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get voucher
      .addCase(getItemVoucher.pending, (state, action) => {
        const { type, item } = action.meta.arg;
        state.voucherStatuses[`${type}-${item.id}`] = 'downloading';
      })
      .addCase(getItemVoucher.fulfilled, (state, action) => {
        const { type, itemId } = action.payload;
        state.voucherStatuses[`${type}-${itemId}`] = 'downloaded';
      })
      .addCase(getItemVoucher.rejected, (state, action) => {
        const { type, itemId } = action.payload;
        state.voucherStatuses[`${type}-${itemId}`] = 'failed';
      });
  }
});

export const {
  clearBookingError,
  clearBookingSuccess,
  resetBookingState,
  setCurrentBooking
} = bookingSlice.actions;

export default bookingSlice.reducer;