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
    formData
  }, { rejectWithValue }) => {
    try {
      // Validate input parameters
      if (!bookingId || !formData) {
        throw new Error('Booking ID and form data are required');
      }

      if (!flight || !flight.flightData) {
        throw new Error('Invalid flight data');
      }

      // Extract travelers directly from form data
      const travelers = formData.rooms.flatMap(room => room.travelers);
      
      // Validate travelers
      if (!travelers || travelers.length === 0) {
        throw new Error('No travelers found for flight allocation');
      }

      // Transform flight data for API
      const flightData = transformFlightBookings(
        flight.flightData,
        travelers
      );

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

      // Make API call
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
      // console.log('Flight Allocation Error - Original:', error);
      // console.log('Flight Allocation Error - Response:', error.response?.data);
      
      // Prefer the API's error response data if available
      const errorResponse = error.response?.data || {
        success: false,
        errorCode: error.response?.status,
        message: error.response?.data?.message || error.message,
        status: error.response?.status
      };
      return rejectWithValue(errorResponse);
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
    formData
  }, { rejectWithValue }) => {
    try {
      // Validate input parameters
      if (!bookingId || !formData) {
        throw new Error('Booking ID and form data are required');
      }

      if (!hotel || !hotel.data) {
        throw new Error('Invalid hotel data');
      }

      // Extract travelers directly from form data
      const travelers = formData.rooms.flatMap(room => room.travelers);

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

      // Make API call
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
      const errorResponse = error.response?.data;
      return rejectWithValue({
        bookingId,
        hotelId: hotel?.data?.staticContent?.[0]?.id,
        error: errorResponse,
        message: error.message,
        status: error.response?.status
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
        error: error.response?.data
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
        const failedAllocation = {
          type: 'flight',
          details: action.meta.arg.flight.flightData,
          error: {
            success: false,
            errorCode: action.payload.errorCode,
            message: action.payload.message,
            status: action.payload.status
          }
        };
      
        // console.log('Created Failed Allocation:', failedAllocation);
        
        state.loading = false;
        state.error = action.payload;
        state.failedAllocations.push(failedAllocation);
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
        // Preserve the full error structure in the failed allocation
        const errorData = action.payload.error;
        
        state.loading = false;
        state.error = action.payload;
        state.failedAllocations.push({
          type: 'hotel',
          details: action.meta.arg.hotel.data.staticContent[0],
          error: errorData // Keep the complete error structure from the API
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