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
          },
          responseType: 'text'
        }
      );

      const voucherWindow = window.open('', '_blank');
      if (voucherWindow) {
        voucherWindow.document.write(response.data);
        voucherWindow.document.close();
        return response.data;
      } else {
        throw new Error('Failed to open voucher window. Please allow popups.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to open flight voucher');
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
          },
          responseType: 'text'
        }
      );

      const voucherWindow = window.open('', '_blank');
      if (voucherWindow) {
        voucherWindow.document.write(response.data);
        voucherWindow.document.close();
        return response.data;
      } else {
        throw new Error('Failed to open voucher window. Please allow popups.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to open hotel voucher');
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
          },
          responseType: 'text'
        }
      );

      const voucherWindow = window.open('', '_blank');
      if (voucherWindow) {
        voucherWindow.document.write(response.data);
        voucherWindow.document.close();
        return response.data;
      } else {
        throw new Error('Failed to open voucher window. Please allow popups.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to open activity voucher');
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
          },
          responseType: 'text'
        }
      );

      const voucherWindow = window.open('', '_blank');
      if (voucherWindow) {
        voucherWindow.document.write(response.data);
        voucherWindow.document.close();
        return response.data;
      } else {
        throw new Error('Failed to open voucher window. Please allow popups.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to open transfer voucher');
    }
  }
);

const voucherSlice = createSlice({
  name: 'voucher',
  initialState: {
    error: null,
    loading: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(openFlightVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(openFlightVoucher.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(openFlightVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(openHotelVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(openHotelVoucher.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(openHotelVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(openActivityVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(openActivityVoucher.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(openActivityVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(openTransferVoucher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(openTransferVoucher.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(openTransferVoucher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = voucherSlice.actions;
export default voucherSlice.reducer;