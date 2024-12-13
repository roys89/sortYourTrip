// slices/flightSlice.js

import { createSlice } from '@reduxjs/toolkit';

const flightSlice = createSlice({
  name: 'flights',
  initialState: {
    selectedFlight: null,
    changeFlight: null,
    isModalOpen: false,
    isChangeModalOpen: false
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
    }
  }
});

export const { setSelectedFlight, setChangeFlight, closeModal, closeChangeModal } = flightSlice.actions;
export default flightSlice.reducer;