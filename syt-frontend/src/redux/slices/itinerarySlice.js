// itinerarySlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// Log helper
const logResponse = (actionName, data) => {
 console.log(`${actionName} response:`, {
   data,
   hasTravelersDetails: !!data?.travelersDetails,
   travelersDetails: data?.travelersDetails
 });
};

// Async Thunks
export const checkExistingItinerary = createAsyncThunk(
 'itinerary/checkExisting',
 async (inquiryToken, { rejectWithValue }) => {
   try {
     const response = await axios.get(`http://localhost:5000/api/itinerary/inquiry/${inquiryToken}`);
     logResponse('checkExistingItinerary', response.data);
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
     // First check for existing itinerary
     const existingItinerary = await dispatch(checkExistingItinerary(inquiryToken)).unwrap();
     
     if (existingItinerary) {
       logResponse('createItinerary using existing', existingItinerary);
       return existingItinerary;
     }
     
     // If no existing itinerary, create new one
     const response = await axios.post(`http://localhost:5000/api/itinerary/${inquiryToken}`);
     
     // Validate response
     if (!response.data || typeof response.data === 'string') {
       throw new Error('Invalid response format from server');
     }
     
     logResponse('createItinerary new', response.data);
     return response.data;
   } catch (error) {
     if (error.response?.data?.message) {
       return rejectWithValue(error.response.data.message);
     } else if (error.message) {
       return rejectWithValue(error.message);
     }
     return rejectWithValue('Failed to create itinerary');
   }
 }
);

export const fetchItinerary = createAsyncThunk(
 'itinerary/fetchItinerary',
 async ({ itineraryToken, inquiryToken }, { rejectWithValue }) => {
   try {
     const response = await axios.get(`http://localhost:5000/api/itinerary/${itineraryToken}`, {
       headers: { 
         'X-Inquiry-Token': inquiryToken,
       }
     });
     
     if (!response.data || typeof response.data === 'string') {
       throw new Error('Invalid response format from server');
     }
     
     logResponse('fetchItinerary', response.data);
     return response.data;
   } catch (error) {
     if (error.response?.data?.message) {
       return rejectWithValue(error.response.data.message);
     }
     return rejectWithValue(error.message || 'Failed to fetch itinerary');
   }
 }
);

// Slice
const itinerarySlice = createSlice({
 name: 'itinerary',
 initialState: {
   data: null,
   loading: false,
   error: null,
   itineraryToken: null,
   checkingExisting: false
 },
 reducers: {
   clearItineraryError: (state) => {
     state.error = null;
   },
   clearItineraryData: (state) => {
     state.data = null;
     state.itineraryToken = null;
     state.error = null;
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
       console.log('checkExistingItinerary.fulfilled:', {
         payload: action.payload,
         hasTravelersDetails: !!action.payload?.travelersDetails,
         travelersDetails: action.payload?.travelersDetails
       });

       state.checkingExisting = false;
       if (action.payload) {
         state.data = action.payload;
         state.itineraryToken = action.payload.itineraryToken;
       }
     })
     .addCase(checkExistingItinerary.rejected, (state, action) => {
       state.checkingExisting = false;
       state.error = typeof action.payload === 'object' ? action.payload.message : action.payload;
     })
     
     // Create Itinerary cases
     .addCase(createItinerary.pending, (state) => {
       state.loading = true;
       state.error = null;
     })
     .addCase(createItinerary.fulfilled, (state, action) => {
       console.log('createItinerary.fulfilled:', {
         payload: action.payload,
         hasTravelersDetails: !!action.payload?.travelersDetails,
         travelersDetails: action.payload?.travelersDetails
       });

       state.loading = false;
       state.data = action.payload;
       state.itineraryToken = action.payload.itineraryToken;
       state.error = null;
     })
     .addCase(createItinerary.rejected, (state, action) => {
       state.loading = false;
       state.error = typeof action.payload === 'object' ? action.payload.message : action.payload;
     })
     
     // Fetch Itinerary cases
     .addCase(fetchItinerary.pending, (state) => {
       state.loading = true;
       state.error = null;
     })
     .addCase(fetchItinerary.fulfilled, (state, action) => {
       console.log('fetchItinerary.fulfilled:', {
         payload: action.payload,
         hasTravelersDetails: !!action.payload?.travelersDetails,
         travelersDetails: action.payload?.travelersDetails
       });

       state.loading = false;
       state.data = action.payload;
       state.error = null;
     })
     .addCase(fetchItinerary.rejected, (state, action) => {
       state.loading = false;
       state.error = typeof action.payload === 'object' ? action.payload.message : action.payload;
     });
 },
});

export const { clearItineraryError, clearItineraryData } = itinerarySlice.actions;
export default itinerarySlice.reducer;