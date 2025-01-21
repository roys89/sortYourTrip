// redux/slices/bookingSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const generateBookingId = () => {
  // Generate a booking ID with format: BK-YYYYMMDD-XXXXX
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `BK-${year}${month}${day}-${random}`;
};

// Create booking thunk
export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      // Add booking ID to the request payload
      const bookingWithId = {
        ...bookingData,
        bookingId: generateBookingId()
      };

      const response = await axios.post(
        'http://localhost:5000/api/booking/itinerary',
        bookingWithId,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.data?.errors) {
        return rejectWithValue({
          message: 'Validation failed',
          errors: error.response.data.errors
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to create booking'
      });
    }
  }
);

// Get user bookings thunk
export const getUserBookings = createAsyncThunk(
  'booking/getUserBookings',
  async ({ page = 1, limit = 10, status, startDate, endDate }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await axios.get(
        `http://localhost:5000/api/booking/itinerary?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch bookings'
      });
    }
  }
);

// Get single booking
export const getBooking = createAsyncThunk(
  'booking/getBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/booking/itinerary/${bookingId}`,
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

// Update booking status
export const updateBookingStatus = createAsyncThunk(
  'booking/updateStatus',
  async ({ bookingId, status, component, componentId }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/booking/itinerary/${bookingId}/status`,
        {
          status,
          component,
          componentId
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to update booking status'
      });
    }
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'booking/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/booking/itinerary/${bookingId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to cancel booking'
      });
    }
  }
);

const initialState = {
  currentBooking: null,
  userBookings: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  loading: false,
  error: null,
  success: false
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

      // Get user bookings
      .addCase(getUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get single booking
      .addCase(getBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.data;
        state.error = null;
      })
      .addCase(getBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update booking status
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.data;
        state.success = true;
        state.error = null;
        // Update booking in list if exists
        state.userBookings = state.userBookings.map(booking => 
          booking.bookingId === action.payload.data.bookingId ? action.payload.data : booking
        );
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // Cancel booking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.data;
        state.success = true;
        state.error = null;
        // Update booking in list if exists
        state.userBookings = state.userBookings.map(booking => 
          booking.bookingId === action.payload.data.bookingId ? action.payload.data : booking
        );
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
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