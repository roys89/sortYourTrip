// src/redux/slices/paymentSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Create payment record and get Razorpay order
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
          userInfo: itinerary.userInfo  // Pass it directly
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

// Verify payment after Razorpay success
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

const initialState = {
  orderId: null,
  paymentId: null,
  signature: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  termsAccepted: false,
  loading: false
};

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
      });
  }
});

export const { setTermsAccepted, resetPayment, clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;