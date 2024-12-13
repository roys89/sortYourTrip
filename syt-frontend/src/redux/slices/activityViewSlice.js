import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchActivityDetails = createAsyncThunk(
  'activityView/fetchDetails',
  async ({ activityCode, city, date, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/activity/details/${activityCode}/${city}/${date}`,
        {
          headers: {
            'X-Inquiry-Token': inquiryToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity details');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const replaceActivity = createAsyncThunk(
  'activityView/replaceActivity',
  async ({ 
    itineraryToken, 
    cityName, 
    date, 
    oldActivityCode, 
    newActivityDetails,
    inquiryToken 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/activity/replace/${itineraryToken}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify({
            cityName,
            date,
            oldActivityCode,
            newActivityDetails,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to replace activity');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const activityViewSlice = createSlice({
  name: 'activityView',
  initialState: {
    activityDetails: null,
    loading: false,
    error: null,
    isModalOpen: false,
    selectedActivity: null,
    replacementStatus: 'idle',
    replacementError: null
  },
  reducers: {
    openActivityModal: (state, action) => {
      state.isModalOpen = true;
      state.selectedActivity = action.payload;
    },
    closeActivityModal: (state) => {
      state.isModalOpen = false;
      state.selectedActivity = null;
      state.activityDetails = null;
      state.error = null;
      state.replacementStatus = 'idle';
      state.replacementError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.activityDetails = action.payload;
      })
      .addCase(fetchActivityDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(replaceActivity.pending, (state) => {
        state.replacementStatus = 'loading';
        state.replacementError = null;
      })
      .addCase(replaceActivity.fulfilled, (state) => {
        state.replacementStatus = 'succeeded';
        state.isModalOpen = false;
      })
      .addCase(replaceActivity.rejected, (state, action) => {
        state.replacementStatus = 'failed';
        state.replacementError = action.payload;
      });
  },
});

export const { openActivityModal, closeActivityModal } = activityViewSlice.actions;
export default activityViewSlice.reducer;