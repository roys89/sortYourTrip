// frontend/src/redux/slices/markupSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchMarkupSettings = createAsyncThunk(
  'markup/fetchSettings',
  async () => {
    const response = await axios.get('http://localhost:5000/api/markup');
    return response.data;
  }
);

export const saveMarkupSettings = createAsyncThunk(
  'markup/saveSettings',
  async (settings) => {
    const response = await axios.post('http://localhost:5000/api/markup', settings);
    return response.data;
  }
);

const initialState = {
  markups: {
    activities: 0,
    hotels: 0,
    flights: 0,
    transfers: 0
  },
  tcsRates: {
    default: 0,
    highValue: 0,
    threshold: 0
  },
  loading: false,
  error: null,
  lastUpdated: null
};

const markupSlice = createSlice({
  name: 'markup',
  initialState,
  reducers: {
    updateMarkup: (state, action) => {
      const { category, value } = action.payload;
      state.markups[category] = value;
    },
    updateTcsRate: (state, action) => {
      const { type, value } = action.payload;
      state.tcsRates[type] = value;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarkupSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMarkupSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.markups = action.payload.markups;
        state.tcsRates = action.payload.tcsRates;
        state.lastUpdated = action.payload.lastUpdated;
      })
      .addCase(fetchMarkupSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(saveMarkupSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveMarkupSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.markups = action.payload.markups;
        state.tcsRates = action.payload.tcsRates;
        state.lastUpdated = action.payload.lastUpdated;
      })
      .addCase(saveMarkupSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { updateMarkup, updateTcsRate } = markupSlice.actions;
export default markupSlice.reducer;