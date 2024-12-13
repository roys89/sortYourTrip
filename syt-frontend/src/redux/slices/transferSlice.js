// slices/transferSlice.js
import { createSlice } from '@reduxjs/toolkit';

const transferSlice = createSlice({
  name: 'transfers',
  initialState: {
    selectedTransfer: null,
    changeTransfer: null,
    isModalOpen: false,
    isChangeModalOpen: false
  },
  reducers: {
    setSelectedTransfer: (state, action) => {
      state.selectedTransfer = action.payload;
      state.isModalOpen = true;
    },
    setChangeTransfer: (state, action) => {
      state.changeTransfer = action.payload;
      state.isChangeModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.selectedTransfer = null;
    },
    closeChangeModal: (state) => {
      state.isChangeModalOpen = false;
      state.changeTransfer = null;
    }
  }
});

export const { 
  setSelectedTransfer, 
  setChangeTransfer, 
  closeModal, 
  closeChangeModal 
} = transferSlice.actions;
export default transferSlice.reducer;