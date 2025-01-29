// guestAllocationSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  transformFlightBookings,
  transformHotelBookings
} from '../../utils/bookingDataTransformer';

// Flight Passenger Allocation Thunk
export const allocateFlightPassengers = createAsyncThunk(
  'guestAllocation/allocateFlightPassengers',
  async ({ 
    bookingId, 
    itineraryToken, 
    inquiryToken, 
    itinerary,
    flight,
    formData  // Added formData parameter
  }, { rejectWithValue }) => {
    try {
      // Extensive logging for debugging
      console.log('===== Allocate Flight Passengers =====');
      console.log('Booking ID:', bookingId);
      console.log('Form Data:', formData);
      console.log('Flight Data:', JSON.stringify(flight, null, 2));

      // Validate input parameters
      if (!bookingId || !formData) {
        throw new Error('Booking ID and form data are required');
      }

      if (!flight || !flight.flightData) {
        throw new Error('Invalid flight data');
      }

      // Extract travelers directly from form data
      const travelers = formData.rooms.flatMap(room => room.travelers);
      
      console.log('Extracted Travelers:', JSON.stringify(travelers, null, 2));

      // Validate travelers
      if (!travelers || travelers.length === 0) {
        throw new Error('No travelers found for flight allocation');
      }

      // Transform flight data for API
      const flightData = transformFlightBookings(
        flight.flightData,
        travelers
      );

      console.log('Transformed Flight Data:', JSON.stringify(flightData, null, 2));

      // Prepare API payload
      const payload = {
        flightData: flightData,
        flightCode: flight.flightData.flightCode,
        resultIndex: flight.flightData.resultIndex,
        itineraryCode: flight.flightData.bookingDetails?.itineraryCode,
        bookingId: bookingId,
        itineraryToken: itineraryToken,
        inquiryToken: inquiryToken
      };

      console.log('API Payload:', JSON.stringify(payload, null, 2));

      // Make API call with enhanced error handling
      const response = await axios.post(
        `http://localhost:5000/api/guest-allocation/${bookingId}/allocate-flight`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Itinerary-Token': itineraryToken,
            'X-Inquiry-Token': inquiryToken
          },
          timeout: 30000
        }
      );

      return {
        bookingId,
        flightCode: flight.flightData.flightCode,
        resultIndex: flight.flightData.resultIndex,
        response: response.data
      };

    } catch (error) {
      console.error('Flight Allocation Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });

      return rejectWithValue({
        bookingId,
        flightCode: flight?.flightData?.flightCode,
        message: error.response?.data?.message || error.message || 'Flight allocation failed',
        status: error.response?.status,
        errors: error.response?.data?.errors || []
      });
    }
  }
);

// Hotel Room Allocation Thunk
export const allocateHotelRooms = createAsyncThunk(
  'guestAllocation/allocateHotelRooms',
  async ({ 
    bookingId, 
    itineraryToken, 
    inquiryToken, 
    itinerary,
    hotel,
    formData  // Added formData parameter
  }, { rejectWithValue }) => {
    try {
      // Extensive logging for debugging
      console.log('===== Allocate Hotel Rooms =====');
      console.log('Booking ID:', bookingId);
      console.log('Form Data:', formData);
      console.log('Hotel Data:', JSON.stringify(hotel, null, 2));

      // Validate input parameters
      if (!bookingId || !formData) {
        throw new Error('Booking ID and form data are required');
      }

      if (!hotel || !hotel.data) {
        throw new Error('Invalid hotel data');
      }

      // Extract travelers directly from form data
      const travelers = formData.rooms.flatMap(room => room.travelers);

      console.log('Extracted Travelers:', JSON.stringify(travelers, null, 2));

      // Validate travelers
      if (!travelers || travelers.length === 0) {
        throw new Error('No travelers found for hotel allocation');
      }

      // Transform hotel data for API
      const hotelData = transformHotelBookings(
        hotel.data,
        travelers,
        hotel
      );

      console.log('Transformed Hotel Data:', JSON.stringify(hotelData, null, 2));

      // Prepare API payload
      const payload = {
        hotelData: hotelData,
        hotelId: hotel.data.staticContent[0].id,
        itineraryCode: hotel.data.code,
        traceId: hotel.data.traceId,
        bookingId: bookingId,
        itineraryToken: itineraryToken,
        inquiryToken: inquiryToken
      };

      console.log('API Payload:', JSON.stringify(payload, null, 2));

      // Make API call with enhanced error handling
      const response = await axios.post(
        `http://localhost:5000/api/guest-allocation/${bookingId}/allocate-hotel`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Itinerary-Token': itineraryToken,
            'X-Inquiry-Token': inquiryToken
          },
          timeout: 30000
        }
      );

      return {
        bookingId,
        hotelId: hotel.data.staticContent[0].id,
        hotelCode: hotel.data.code,
        response: response.data
      };

    } catch (error) {
      console.error('Hotel Allocation Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });

      return rejectWithValue({
        bookingId,
        hotelId: hotel?.data?.staticContent?.[0]?.id,
        message: error.response?.data?.message || error.message || 'Hotel allocation failed',
        status: error.response?.status,
        errors: error.response?.data?.errors || []
      });
    }
  }
);

// Check Allocation Status Thunk
export const checkAllocationStatus = createAsyncThunk(
  'guestAllocation/checkStatus',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/guest-allocation/${bookingId}/allocation-status`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to check allocation status',
        error: error
      });
    }
  }
);

// Initial State
const initialState = {
  flightAllocations: [],
  hotelAllocations: [],
  loading: false,
  error: null,
  failedAllocations: [],
  status: {
    totalAllocations: 0,
    flightAllocations: 0,
    hotelAllocations: 0,
    isComplete: false,
    lastUpdated: null
  },
  progress: {
    current: 0,
    total: 0,
    percentage: 0
  }
};

// Create Slice
const guestAllocationSlice = createSlice({
  name: 'guestAllocation',
  initialState,
  reducers: {
    resetAllocationState: () => initialState,
    
    updateProgress: (state, action) => {
      state.progress = {
        ...state.progress,
        ...action.payload,
        percentage: Math.round((action.payload.current / action.payload.total) * 100)
      };
    },

    setAllocationStatus: (state, action) => {
      state.status = {
        ...state.status,
        ...action.payload,
        lastUpdated: new Date().toISOString()
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Flight allocation reducers
      .addCase(allocateFlightPassengers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(allocateFlightPassengers.fulfilled, (state, action) => {
        state.loading = false;
        state.flightAllocations.push(action.payload);
        state.status.flightAllocations += 1;
        state.progress.current += 1;
        state.status.lastUpdated = new Date().toISOString();
      })
      .addCase(allocateFlightPassengers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.failedAllocations.push({
          type: 'flight',
          ...action.payload
        });
      })

      // Hotel allocation reducers
      .addCase(allocateHotelRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(allocateHotelRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.hotelAllocations.push(action.payload);
        state.status.hotelAllocations += 1;
        state.progress.current += 1;
        state.status.lastUpdated = new Date().toISOString();
      })
      .addCase(allocateHotelRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.failedAllocations.push({
          type: 'hotel',
          ...action.payload
        });
      })

      // Status check reducers
      .addCase(checkAllocationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAllocationStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = {
          ...state.status,
          ...action.payload.data,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(checkAllocationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const { 
  resetAllocationState,
  updateProgress,
  setAllocationStatus
} = guestAllocationSlice.actions;

// Export selectors
export const selectAllocationStatus = (state) => state.guestAllocation.status;
export const selectAllocationProgress = (state) => state.guestAllocation.progress;
export const selectAllocationError = (state) => state.guestAllocation.error;
export const selectFailedAllocations = (state) => state.guestAllocation.failedAllocations;

// Export reducer
export default guestAllocationSlice.reducer;