// slices/flightSlice.js

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const updateFlightSeats = createAsyncThunk(
  'flights/updateSeats',
  async ({ 
    itineraryToken, 
    inquiryToken, 
    selections 
  }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/itinerary/${itineraryToken}/flight/seats`,
        selections,
        {
          headers: {
            'X-Inquiry-Token': inquiryToken,
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        'Failed to update seats, baggage, and meal'
      );
    }
  }
);

const flightSlice = createSlice({
  name: 'flights',
  initialState: {
    selectedFlight: null,
    changeFlight: null,
    isModalOpen: false,
    isChangeModalOpen: false,
    isSeatModalOpen: false,
    seatSelectionLoading: false,
    seatSelectionError: null,
    selectedSeats: {},
    selectedBaggage: null,
    selectedMeal: null
  },
  reducers: {
    setSelectedFlight: (state, action) => {
      state.selectedFlight = action.payload;
      state.isModalOpen = true;
    },
    setChangeFlight: (state, action) => {
      state.changeFlight = action.payload;
      state.isChangeModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.selectedFlight = null;
    },
    closeChangeModal: (state) => {
      state.isChangeModalOpen = false;
      state.changeFlight = null;
    },
    openSeatModal: (state, action) => {
      state.selectedFlight = action.payload;
      state.isSeatModalOpen = true;
    },
    closeSeatModal: (state) => {
      state.isSeatModalOpen = false;
      state.selectedFlight = null;
      state.seatSelectionError = null;
    },
    clearSeatSelectionError: (state) => {
      state.seatSelectionError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateFlightSeats.pending, (state) => {
        state.seatSelectionLoading = true;
        state.seatSelectionError = null;
      })
      .addCase(updateFlightSeats.fulfilled, (state, action) => {
        state.seatSelectionLoading = false;
        state.selectedSeats = action.payload.selectedSeats || {};
        state.selectedBaggage = action.payload.selectedBaggage || null;
        state.selectedMeal = action.payload.selectedMeal || null;
        state.isSeatModalOpen = false;
      })
      .addCase(updateFlightSeats.rejected, (state, action) => {
        state.seatSelectionLoading = false;
        state.seatSelectionError = action.payload;
      });
  }
});

export const { 
  setSelectedFlight, 
  setChangeFlight, 
  closeModal, 
  closeChangeModal,
  openSeatModal,
  closeSeatModal,
  clearSeatSelectionError
} = flightSlice.actions;

export default flightSlice.reducer;