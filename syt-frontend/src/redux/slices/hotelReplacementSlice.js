import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk to search for replacement hotel
export const searchReplacementHotel = createAsyncThunk(
  'hotelReplacement/searchHotel',
  async ({ failedHotel, itinerary, inquiryToken }, { rejectWithValue }) => {
    try {

      // Get hotel data from failed allocation
      const hotelData = failedHotel.details.data || failedHotel.details;
      const address = hotelData.hotelDetails?.address;

      const response = await axios.post(
        'http://localhost:5000/api/hotels/search',
        {
          city: address?.city?.name,
          country: address?.country?.name,
          startDate: hotelData.searchRequestLog.checkIn,
          endDate: hotelData.searchRequestLog.checkOut,
          travelersDetails: itinerary.travelersDetails,
          preferences: itinerary.preferences,
          inquiryToken
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

// Thunk to update itinerary with new hotel
export const updateItineraryHotel = createAsyncThunk(
  'hotelReplacement/updateItinerary',
  async ({ itineraryToken, date, newHotelDetails, inquiryToken }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`,
        {
          cityName: newHotelDetails.hotelDetails.address.city.name || null,
          date,
          newHotelDetails
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
  replacementHotel: null,
  updatedItinerary: null
};

const hotelReplacementSlice = createSlice({
  name: 'hotelReplacement',
  initialState,
  reducers: {
    resetHotelReplacement: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Search hotel reducers
      .addCase(searchReplacementHotel.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchReplacementHotel.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.replacementHotel = action.payload;
      })
      .addCase(searchReplacementHotel.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })
      
      // Update itinerary reducers
      .addCase(updateItineraryHotel.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateItineraryHotel.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updatedItinerary = action.payload;
      })
      .addCase(updateItineraryHotel.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetHotelReplacement } = hotelReplacementSlice.actions;
export default hotelReplacementSlice.reducer;