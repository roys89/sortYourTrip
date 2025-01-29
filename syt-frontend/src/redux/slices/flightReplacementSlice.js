// redux/slices/flightReplacementSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper to extract flight search params from expired flight
const getFlightSearchParams = (expiredFlight, itinerary) => {
  const departureCity = {
    city: expiredFlight.origin,
    country: expiredFlight.originAirport.country,
    iata: expiredFlight.originAirport.code,
    name: expiredFlight.originAirport.name,
    latitude: expiredFlight.originAirport.location.latitude,
    longitude: expiredFlight.originAirport.location.longitude
  };

  const destinationCity = {
    city: expiredFlight.destination,
    country: expiredFlight.arrivalAirport.country,
    iata: expiredFlight.arrivalAirport.code,
    name: expiredFlight.arrivalAirport.name,
    latitude: expiredFlight.arrivalAirport.location.latitude,
    longitude: expiredFlight.arrivalAirport.location.longitude
  };

  return {
    departureCity,
    cities: [destinationCity],
    travelers: itinerary.travelersDetails,
    departureDates: {
      startDate: expiredFlight.departureDate,
      endDate: expiredFlight.departureDate
    },
    preferences: itinerary.preferences,
    type: expiredFlight.type,
  };
};

// Thunk to search for replacement flight
export const searchReplacementFlight = createAsyncThunk(
  'flightReplacement/searchFlight',
  async ({ expiredFlight, itinerary, inquiryToken }, { rejectWithValue }) => {
    try {
      const searchParams = getFlightSearchParams(expiredFlight, itinerary);
      
      const response = await axios.post(
        `http://localhost:5000/api/flights/search`,
        searchParams,
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

// Thunk to update itinerary with new flight
export const updateItineraryFlight = createAsyncThunk(
  'flightReplacement/updateItinerary',
  async ({ itineraryToken, cityName, date, newFlightDetails, type, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/itinerary/${itineraryToken}/replace-flight`,
        {
          cityName,
          date,
          newFlightDetails,
          type
        },
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

const initialState = {
  searchLoading: false,
  updateLoading: false,
  error: null,
  replacementFlight: null,
  updatedItinerary: null
};

const flightReplacementSlice = createSlice({
  name: 'flightReplacement',
  initialState,
  reducers: {
    resetFlightReplacement: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Search flight reducers
      .addCase(searchReplacementFlight.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchReplacementFlight.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.replacementFlight = action.payload;
      })
      .addCase(searchReplacementFlight.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })
      
      // Update itinerary reducers
      .addCase(updateItineraryFlight.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateItineraryFlight.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updatedItinerary = action.payload;
      })
      .addCase(updateItineraryFlight.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetFlightReplacement } = flightReplacementSlice.actions;
export default flightReplacementSlice.reducer;