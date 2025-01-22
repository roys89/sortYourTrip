// redux/slices/bookingSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api/booking/itinerary';

// Generate Item ID based on type
const getItemId = (item, type) => {
  switch (type) {
    case 'flight':
      return item.flightCode;
    case 'hotel':
      return item.traceId;
    case 'activity':
      return item.bookingRef;
    case 'transfer':
      return item.quotation_id;
    default:
      return null;
  }
};

// Create booking
export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        API_BASE_URL,
        bookingData,
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

// Get user bookings
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
        `${API_BASE_URL}?${queryParams}`,
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

// Get booking by ID
export const getBookingById = createAsyncThunk(
  'booking/getById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/${bookingId}`,
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

// Book individual item
export const bookItem = createAsyncThunk(
  'booking/bookItem',
  async ({ bookingId, type, item }, { rejectWithValue }) => {
    try {
      const itemId = getItemId(item, type);
      if (!itemId) {
        throw new Error('Invalid item type or missing ID');
      }

      const response = await axios.post(
        `${API_BASE_URL}/${bookingId}/book`,
        {
          type,
          itemId,
          itemData: item
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return {
        ...response.data,
        itemId,
        type
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to book item',
        type,
        itemId: getItemId(item, type)
      });
    }
  }
);

// Book all items in an itinerary
export const bookAllItems = createAsyncThunk(
  'booking/bookAll',
  async ({ bookingId, itinerary }, { dispatch }) => {
    const bookingPromises = [];

    // Helper function to book items
    const bookItems = (items, type) => {
      if (!items) return;
      items.forEach(item => {
        bookingPromises.push(
          dispatch(bookItem({ bookingId, type, item }))
        );
      });
    };

    // Process each city's items
    itinerary.cities.forEach(city => {
      city.days.forEach(day => {
        // Book flights
        if (day.flights) {
          bookItems(day.flights.map(f => f.flightData), 'flight');
        }

        // Book hotels
        if (day.hotels) {
          bookItems(day.hotels.map(h => h.data), 'hotel');
        }

        // Book activities
        if (day.activities) {
          bookItems(day.activities, 'activity');
        }

        // Book transfers
        if (day.transfers) {
          bookItems(day.transfers.map(t => t.details), 'transfer');
        }
      });
    });

    // Wait for all bookings to complete
    return await Promise.allSettled(bookingPromises);
  }
);

// Get item voucher
export const getItemVoucher = createAsyncThunk(
  'booking/getVoucher',
  async ({ bookingId, type, item }, { rejectWithValue }) => {
    try {
      const itemId = getItemId(item, type);
      const response = await axios.get(
        `${API_BASE_URL}/${bookingId}/voucher/${type}/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob'
        }
      );

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voucher-${type}-${itemId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { type, itemId };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to download voucher',
        type,
        itemId: getItemId(item, type)
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
        `${API_BASE_URL}/${bookingId}/cancel`,
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
  bookingStatuses: {},
  voucherStatuses: {},
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
    },
    updateItemStatus: (state, action) => {
      const { type, itemId, status } = action.payload;
      state.bookingStatuses[`${type}-${itemId}`] = status;
    },
    clearItemStatuses: (state) => {
      state.bookingStatuses = {};
      state.voucherStatuses = {};
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
        state.bookingStatuses = {};
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

      // Book item
      .addCase(bookItem.pending, (state, action) => {
        const { type, item } = action.meta.arg;
        const itemId = getItemId(item, type);
        state.bookingStatuses[`${type}-${itemId}`] = 'pending';
      })
      .addCase(bookItem.fulfilled, (state, action) => {
        const { type, itemId } = action.payload;
        state.bookingStatuses[`${type}-${itemId}`] = 'confirmed';
      })
      .addCase(bookItem.rejected, (state, action) => {
        const { type, itemId } = action.payload;
        state.bookingStatuses[`${type}-${itemId}`] = 'failed';
      })

      // Get voucher
      .addCase(getItemVoucher.pending, (state, action) => {
        const { type, item } = action.meta.arg;
        const itemId = getItemId(item, type);
        state.voucherStatuses[`${type}-${itemId}`] = 'downloading';
      })
      .addCase(getItemVoucher.fulfilled, (state, action) => {
        const { type, itemId } = action.payload;
        state.voucherStatuses[`${type}-${itemId}`] = 'downloaded';
      })
      .addCase(getItemVoucher.rejected, (state, action) => {
        const { type, itemId } = action.payload;
        state.voucherStatuses[`${type}-${itemId}`] = 'failed';
      })

      // Cancel booking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.data;
        state.success = true;
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearBookingError,
  clearBookingSuccess,
  resetBookingState,
  setCurrentBooking,
  updateItemStatus,
  clearItemStatuses
} = bookingSlice.actions;

export default bookingSlice.reducer;