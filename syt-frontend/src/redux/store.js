// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import activityReducer from './slices/activitySlice';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import flightReplacementReducer from './slices/flightReplacementSlice'; // Add import
import flightReducer from './slices/flightSlice';
import guestAllocationSlice from './slices/guestAllocationSlice';
import hotelReducer from './slices/hotelSlice';
import itineraryReducer from './slices/itinerarySlice';
import markupReducer from './slices/markupSlice';
import notificationReducer from './slices/notificationsSlice';
import priceCheckReducer from './slices/priceCheckSlice';
import priceReducer from './slices/priceSlice';
import roomChangeReducer from './slices/roomChangeSlice';
import transferReducer from './slices/transferSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    itinerary: itineraryReducer,
    flights: flightReducer,
    hotels: hotelReducer,
    transfers: transferReducer,
    activities: activityReducer,
    markup: markupReducer, 
    price: priceReducer,
    notifications: notificationReducer,
    booking: bookingReducer,
    roomChange: roomChangeReducer,
    priceCheck: priceCheckReducer,
    guestAllocation: guestAllocationSlice,
    flightReplacement: flightReplacementReducer, // Add reducer
  }
});