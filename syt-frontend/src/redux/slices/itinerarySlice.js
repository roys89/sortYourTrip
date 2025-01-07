import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Async Thunks
export const checkExistingItinerary = createAsyncThunk(
  'itinerary/checkExisting',
  async (inquiryToken, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/itinerary/inquiry/${inquiryToken}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to check existing itinerary');
    }
  }
);

export const createItinerary = createAsyncThunk(
  'itinerary/createItinerary',
  async (inquiryToken, { rejectWithValue, dispatch }) => {
    try {
      const existingItinerary = await dispatch(checkExistingItinerary(inquiryToken)).unwrap();
      
      if (existingItinerary) {
        return existingItinerary;
      }
      
      const response = await axios.post(`${BASE_URL}/itinerary/${inquiryToken}`);
      
      if (!response.data || typeof response.data === 'string') {
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create itinerary');
    }
  }
);

// New Thunk for Transfer Updates
export const updateTransfersForChange = createAsyncThunk(
  'itinerary/updateTransfers',
  async ({ 
    itineraryToken, 
    changeType, 
    changeDetails,
    inquiryToken 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/itinerary/${itineraryToken}/transfers/update`,
        { changeType, changeDetails },
        {
          headers: { 
            'X-Inquiry-Token': inquiryToken,
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Transfer update failed');
    }
  }
);

export const fetchItinerary = createAsyncThunk(
  'itinerary/fetchItinerary',
  async ({ itineraryToken, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/itinerary/${itineraryToken}`, {
        headers: { 
          'X-Inquiry-Token': inquiryToken,
        }
      });
      
      if (!response.data || typeof response.data === 'string') {
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message || 'Failed to fetch itinerary');
    }
  }
);

export const updateItineraryPrices = createAsyncThunk(
  'itinerary/updatePrices',
  async ({ itineraryToken, priceTotals }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${BASE_URL}/itinerary/${itineraryToken}/prices`, {
        priceTotals
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update prices');
    }
  }
);

export const addActivityToItinerary = createAsyncThunk(
  'itinerary/addActivity',
  async ({ itineraryToken, inquiryToken, cityName, date, activityDetails }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/itinerary/${itineraryToken}/activity`,
        {
          cityName,
          date,
          activityDetails
        },
        {
          headers: { 'X-Inquiry-Token': inquiryToken }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add activity');
    }
  }
);

export const removeActivityFromItinerary = createAsyncThunk(
  'itinerary/removeActivity',
  async ({ itineraryToken, inquiryToken, cityName, date, activityCode }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/itinerary/${itineraryToken}/activity`,
        {
          headers: { 'X-Inquiry-Token': inquiryToken },
          data: {
            cityName,
            date,
            activityCode
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove activity');
    }
  }
);

export const updateActivityInItinerary = createAsyncThunk(
  'itinerary/updateActivity',
  async ({ itineraryToken, inquiryToken, cityName, date, oldActivityCode, newActivityDetails }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/itinerary/${itineraryToken}/activity`,
        {
          cityName,
          date,
          oldActivityCode,
          newActivityDetails
        },
        {
          headers: { 'X-Inquiry-Token': inquiryToken }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update activity');
    }
  }
);

const initialState = {
  data: null,
  loading: false,
  error: null,
  itineraryToken: null,
  checkingExisting: false,
  transferUpdating: false, // New state for transfer updates
  transferUpdateError: null // New error state for transfer updates
};

const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState,
  reducers: {
    clearItineraryError: (state) => {
      state.error = null;
      state.transferUpdateError = null;
    },
    resetItineraryState: () => initialState,
    setItineraryToken: (state, action) => {
      state.itineraryToken = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Check Existing Itinerary cases
      .addCase(checkExistingItinerary.pending, (state) => {
        state.checkingExisting = true;
        state.error = null;
      })
      .addCase(checkExistingItinerary.fulfilled, (state, action) => {
        state.checkingExisting = false;
        if (action.payload) {
          state.data = action.payload;
          state.itineraryToken = action.payload.itineraryToken;
        }
      })
      .addCase(checkExistingItinerary.rejected, (state, action) => {
        state.checkingExisting = false;
        state.error = action.payload;
      })
      
      // Create Itinerary cases
      .addCase(createItinerary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createItinerary.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.itineraryToken = action.payload.itineraryToken;
        state.error = null;
      })
      .addCase(createItinerary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Itinerary cases
      .addCase(fetchItinerary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItinerary.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.itineraryToken = action.payload.itineraryToken;
        state.error = null;
      })
      .addCase(fetchItinerary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Prices cases
      .addCase(updateItineraryPrices.pending, (state) => {
        state.priceUpdating = true;
        state.priceError = null;
      })
      .addCase(updateItineraryPrices.fulfilled, (state, action) => {
        state.priceUpdating = false;
        state.data = action.payload;
      })
      .addCase(updateItineraryPrices.rejected, (state, action) => {
        state.priceUpdating = false;
        state.priceError = action.payload;
      })

      // Activity operations
      .addCase(addActivityToItinerary.pending, (state) => {
        state.activityUpdating = true;
        state.activityError = null;
      })
      .addCase(addActivityToItinerary.fulfilled, (state, action) => {
        state.activityUpdating = false;
        state.data = action.payload;
      })
      .addCase(addActivityToItinerary.rejected, (state, action) => {
        state.activityUpdating = false;
        state.activityError = action.payload;
      })

      .addCase(removeActivityFromItinerary.pending, (state) => {
        state.activityUpdating = true;
        state.activityError = null;
      })
      .addCase(removeActivityFromItinerary.fulfilled, (state, action) => {
        state.activityUpdating = false;
        state.data = action.payload;
      })
      .addCase(removeActivityFromItinerary.rejected, (state, action) => {
        state.activityUpdating = false;
        state.activityError = action.payload;
      })

      .addCase(updateActivityInItinerary.pending, (state) => {
        state.activityUpdating = true;
        state.activityError = null;
      })
      .addCase(updateActivityInItinerary.fulfilled, (state, action) => {
        state.activityUpdating = false;
        state.data = action.payload;
      })
      .addCase(updateActivityInItinerary.rejected, (state, action) => {
        state.activityUpdating = false;
        state.activityError = action.payload;
      })
      
     // New reducers for transfer updates
      .addCase(updateTransfersForChange.pending, (state) => {
        state.transferUpdating = true;
        state.transferUpdateError = null;
      })
      .addCase(updateTransfersForChange.fulfilled, (state, action) => {
        state.transferUpdating = false;
        state.data = action.payload; // Update entire itinerary with new transfers
        state.transferUpdateError = null;
      })
      .addCase(updateTransfersForChange.rejected, (state, action) => {
        state.transferUpdating = false;
        state.transferUpdateError = action.payload;
      });
  },
});

export const { 
  clearItineraryError, 
  resetItineraryState, 
  setItineraryToken 
} = itinerarySlice.actions;

export default itinerarySlice.reducer;