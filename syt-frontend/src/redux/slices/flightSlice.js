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
      // Transform selections to include passenger information
      const transformedSelections = {
        ...selections,
        seatMap: selections.seatMap?.map(segment => ({
          ...segment,
          rows: segment.rows?.map(row => ({
            ...row,
            seats: row.seats?.map(seat => ({
              ...seat,
              // Ensure passenger information is included
              passengerId: seat.passengerId,
              passengerIndex: seat.passengerIndex,
              passengerName: seat.passengerName,
              passengerType: seat.passengerType
            }))
          }))
        })),
        baggageOptions: selections.baggageOptions?.map(segment => ({
          ...segment,
          options: segment.options?.map(option => ({
            ...option,
            // Include passenger information for baggage
            passengerId: option.passengerId,
            passengerIndex: option.passengerIndex,
            passengerName: option.passengerName,
            passengerType: option.passengerType
          }))
        })),
        mealOptions: selections.mealOptions?.map(segment => ({
          ...segment,
          options: segment.options?.map(option => ({
            ...option,
            // Include passenger information for meals
            passengerId: option.passengerId,
            passengerIndex: option.passengerIndex,
            passengerName: option.passengerName,
            passengerType: option.passengerType
          }))
        }))
      };

      const response = await axios.put(
        `${BASE_URL}/itinerary/${itineraryToken}/flight/seats`,
        transformedSelections,
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
    selectedMeal: null,
    activePassengerIndex: 0, // Add active passenger tracking
    passengers: [] // Add passengers array to store traveler information
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
      const { flight, travelersDetails, inquiryToken, itineraryToken } = action.payload;
      // Store travelersDetails directly on selectedFlight
      state.selectedFlight = {
        ...flight,
        travelersDetails,
        inquiryToken,
        itineraryToken
      };
      state.isSeatModalOpen = true;
      
      console.log('FlightSlice - Processing travelers:', travelersDetails);
      
      // Initialize passengers array from travelers details
      state.passengers = [];
      if (travelersDetails?.rooms) {
        travelersDetails.rooms.forEach((room, roomIndex) => {
          // Add adults
          if (room.adults) {
            room.adults.forEach((age, adultIndex) => {
              state.passengers.push({
                id: `r${roomIndex}a${adultIndex}`,
                type: 'Adult',
                age,
                name: room.adultNames?.[adultIndex] || `Adult ${state.passengers.length + 1}`,
                roomIndex,
                personIndex: adultIndex
              });
            });
          }
          // Add children
          if (room.children) {
            room.children.forEach((age, childIndex) => {
              state.passengers.push({
                id: `r${roomIndex}c${childIndex}`,
                type: 'Child',
                age,
                name: room.childNames?.[childIndex] || `Child ${state.passengers.length + 1}`,
                roomIndex,
                personIndex: childIndex
              });
            });
          }
        });
      }
      
      console.log('FlightSlice - Initialized passengers:', state.passengers);
      
      state.activePassengerIndex = 0;
    },
    closeSeatModal: (state) => {
      state.isSeatModalOpen = false;
      state.selectedFlight = null;
      state.seatSelectionError = null;
      state.activePassengerIndex = 0;
      state.passengers = [];
    },
    setActivePassengerIndex: (state, action) => {
      state.activePassengerIndex = action.payload;
    },
    clearSeatSelectionError: (state) => {
      state.seatSelectionError = null;
    },
    clearAllFlightStates: (state) => {
      state.selectedFlight = null;
      state.changeFlight = null;
      state.isModalOpen = false;
      state.isChangeModalOpen = false;
      state.isSeatModalOpen = false;
      state.seatSelectionLoading = false;
      state.seatSelectionError = null;
      state.selectedSeats = {};
      state.selectedBaggage = null;
      state.selectedMeal = null;
      state.activePassengerIndex = 0;
      state.passengers = [];
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
  setActivePassengerIndex,
  clearSeatSelectionError,
  clearAllFlightStates
} = flightSlice.actions;

export default flightSlice.reducer;