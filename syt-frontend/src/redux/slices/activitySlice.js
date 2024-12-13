// Modified activitySlice.js
import { createSlice } from '@reduxjs/toolkit';

export const activitySlice = createSlice({
  name: 'activities',
  initialState: {
    selectedActivity: null,
    changeActivity: null,
    isModalOpen: false,
    isChangeModalOpen: false
  },
  reducers: {
    setSelectedActivity: (state, action) => {
      state.selectedActivity = action.payload;
      state.isModalOpen = true;
    },
    setChangeActivity: (state, action) => {
      state.changeActivity = action.payload;
      state.isChangeModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.selectedActivity = null;
    },
    closeChangeModal: (state) => {
      state.isChangeModalOpen = false;
      state.changeActivity = null;
    },
    // Add new reducer to clear all activity states
    clearAllActivityStates: (state) => {
      state.selectedActivity = null;
      state.changeActivity = null;
      state.isModalOpen = false;
      state.isChangeModalOpen = false;
    }
  }
});

export const { 
  setSelectedActivity, 
  setChangeActivity, 
  closeModal, 
  closeChangeModal,
  clearAllActivityStates 
} = activitySlice.actions;

export default activitySlice.reducer;