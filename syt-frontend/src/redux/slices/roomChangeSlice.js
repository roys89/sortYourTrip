// src/redux/slices/roomChangeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isModalOpen: false,
  selectedHotel: null,
  modalData: null,
  isLoading: false,
  isRoomLoading: true, // Set initial loading to true
  error: null,
  initialized: false // Add initialized flag
};

const roomChangeSlice = createSlice({
  name: 'roomChange',
  initialState,
  reducers: {
    openRoomChangeModal: (state, action) => {
      state.isModalOpen = true;
      state.selectedHotel = action.payload.hotel;
      state.modalData = action.payload;
      state.isRoomLoading = true;
      state.error = null;
      state.initialized = true; // Set initialized when modal opens
    },
    closeRoomChangeModal: (state) => {
      state.isModalOpen = false;
      state.selectedHotel = null;
      state.modalData = null;
      state.isLoading = false;
      state.isRoomLoading = false;
      state.error = null;
      state.initialized = false; // Reset initialized on close
    },
    setRoomLoading: (state, action) => {
      state.isRoomLoading = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isRoomLoading = false;
    }
  }
});

export const { 
  openRoomChangeModal, 
  closeRoomChangeModal,
  setRoomLoading,
  setLoading,
  setError 
} = roomChangeSlice.actions;

export default roomChangeSlice.reducer;