// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import activityReducer from './slices/activitySlice';
import authReducer from './slices/authSlice';
import bookingReducer from './slices/bookingSlice';
import flightReducer from './slices/flightSlice';
import hotelReducer from './slices/hotelSlice';
import itineraryReducer from './slices/itinerarySlice';
import markupReducer from './slices/markupSlice';
import notificationReducer from './slices/notificationsSlice';
import priceReducer from './slices/priceSlice';
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
    booking: bookingReducer
  }
});


