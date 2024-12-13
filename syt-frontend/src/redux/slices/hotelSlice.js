// redux/slices/hotelSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const hotelSlice = createSlice({
  name: 'hotels',
  initialState: {
    selectedHotel: null,
    changeHotel: null,
    isModalOpen: false,
    isChangeModalOpen: false
  },
  reducers: {
    setSelectedHotel: (state, action) => {
      state.selectedHotel = action.payload;
      state.isModalOpen = true;
    },
    setChangeHotel: (state, action) => {
      state.changeHotel = action.payload;
      state.isChangeModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.selectedHotel = null;
    },
    closeChangeModal: (state) => {
      state.isChangeModalOpen = false;
      state.changeHotel = null;
    },
    clearAllHotelStates: (state) => {
      state.selectedHotel = null;
      state.changeHotel = null;
      state.isModalOpen = false;
      state.isChangeModalOpen = false;
    }
  }
});

export const { 
  setSelectedHotel, 
  setChangeHotel, 
  closeModal, 
  closeChangeModal,
  clearAllHotelStates 
} = hotelSlice.actions;

export default hotelSlice.reducer;