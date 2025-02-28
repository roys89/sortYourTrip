import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const openFlightVoucher = createAsyncThunk(
  'voucher/openFlightVoucher',
  async ({ bmsBookingCode, itineraryToken, date, city, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/voucher/flight/${bmsBookingCode}`,
        { itineraryToken, date, city },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-inquiry-token': inquiryToken
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch flight voucher');
    }
  }
);

export const openHotelVoucher = createAsyncThunk(
  'voucher/openHotelVoucher',
  async ({ bookingCode, itineraryToken, date, city, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/voucher/hotel/${bookingCode}`,
        { itineraryToken, date, city },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-inquiry-token': inquiryToken
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch hotel voucher');
    }
  }
);

export const openActivityVoucher = createAsyncThunk(
  'voucher/openActivityVoucher',
  async ({ bookingReference, searchId, itineraryToken, date, city, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/voucher/activity/${bookingReference}`,
        { itineraryToken, date, city },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-inquiry-token': inquiryToken
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch activity voucher');
    }
  }
);

export const openTransferVoucher = createAsyncThunk(
  'voucher/openTransferVoucher',
  async ({ booking_id, itineraryToken, date, city, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/voucher/transfer/${booking_id}`,
        { itineraryToken, date, city },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-inquiry-token': inquiryToken
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch transfer voucher');
    }
  }
);

const voucherSlice = createSlice({
  name: 'voucher',
  initialState: {
    error: null,
    loading: false,
    voucherData: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVoucherData: (state) => {
      state.voucherData = null;
    }
  },
  extraReducers: (builder) => {
    // Flight voucher
    builder
      .addCase(openFlightVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.voucherData = null;
      })
      .addCase(openFlightVoucher.fulfilled, (state, action) => {
        state.loading = false;
        state.voucherData = action.payload;
      })
      .addCase(openFlightVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Hotel voucher
    builder
      .addCase(openHotelVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.voucherData = null;
      })
      .addCase(openHotelVoucher.fulfilled, (state, action) => {
        state.loading = false;
        state.voucherData = action.payload;
      })
      .addCase(openHotelVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Activity voucher
    builder
      .addCase(openActivityVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.voucherData = null;
      })
      .addCase(openActivityVoucher.fulfilled, (state, action) => {
        state.loading = false;
        state.voucherData = action.payload;
      })
      .addCase(openActivityVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Transfer voucher
    builder
      .addCase(openTransferVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.voucherData = null;
      })
      .addCase(openTransferVoucher.fulfilled, (state, action) => {
        state.loading = false;
        state.voucherData = action.payload;
      })
      .addCase(openTransferVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearVoucherData } = voucherSlice.actions;
export default voucherSlice.reducer;