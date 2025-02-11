// src/redux/slices/lockSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Create locks for multiple items
export const createInventoryLocks = createAsyncThunk(
  'lock/createLocks',
  async ({ itineraryToken, inquiryToken, items }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/itinerary/${itineraryToken}/locks`,
        { items },
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

// Release specific lock
export const releaseInventoryLock = createAsyncThunk(
  'lock/releaseLock',
  async ({ itineraryToken, inquiryToken, itemId, type }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/itinerary/${itineraryToken}/locks/${type}/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'X-Inquiry-Token': inquiryToken
          }
        }
      );
      return { itemId, type, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Check lock status
export const checkLockStatus = createAsyncThunk(
  'lock/checkStatus',
  async ({ itineraryToken, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/itinerary/${itineraryToken}/locks/status`,
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

// Extend lock duration
export const extendLockDuration = createAsyncThunk(
  'lock/extendDuration',
  async ({ itineraryToken, inquiryToken, itemId, type, additionalTime }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/locks/${type}/${itemId}/extend`,
        { additionalTime },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'X-Inquiry-Token': inquiryToken
          }
        }
      );
      return { itemId, type, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  locks: {},
  loading: false,
  error: null,
  lockTimer: null,
  expiryTime: null
};

const lockSlice = createSlice({
  name: 'lock',
  initialState,
  reducers: {
    setLockTimer: (state, action) => {
      state.lockTimer = action.payload;
    },
    setExpiryTime: (state, action) => {
      state.expiryTime = action.payload;
    },
    clearLocks: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Create locks reducers
      .addCase(createInventoryLocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInventoryLocks.fulfilled, (state, action) => {
        state.loading = false;
        state.locks = {
          ...state.locks,
          ...action.payload.locks
        };
        state.expiryTime = action.payload.expiryTime;
      })
      .addCase(createInventoryLocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Release lock reducers
      .addCase(releaseInventoryLock.fulfilled, (state, action) => {
        const { itemId, type } = action.payload;
        delete state.locks[`${type}-${itemId}`];
      })

      // Check status reducers
      .addCase(checkLockStatus.fulfilled, (state, action) => {
        state.locks = action.payload.locks;
        state.expiryTime = action.payload.expiryTime;
      })

      // Extend duration reducers
      .addCase(extendLockDuration.fulfilled, (state, action) => {
        const { itemId, type, expiryTime } = action.payload;
        state.locks[`${type}-${itemId}`] = {
          ...state.locks[`${type}-${itemId}`],
          expiryTime
        };
      });
  }
});

export const { setLockTimer, setExpiryTime, clearLocks } = lockSlice.actions;
export default lockSlice.reducer;