// redux/slices/priceSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { calculateSegmentTotal } from '../../utils/priceCalculations';

const initialState = {
  calculatedPrices: {
    segmentTotals: {
      activities: 0,
      hotels: 0,
      flights: 0,
      transfers: 0
    },
    subtotal: 0,
    tcsAmount: 0,
    grandTotal: 0
  },
  lastCalculated: null
};

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {
    updateCalculatedPrices: (state, action) => {
      state.calculatedPrices = action.payload;
      state.lastCalculated = new Date().toISOString();
    }
  }
});

export const { updateCalculatedPrices } = priceSlice.actions;

// Thunk for calculating prices
export const calculatePrices = (itinerary) => (dispatch, getState) => {
  const { markup } = getState();
  const { markups, tcsRates } = markup;

  let segmentTotals = {
    activities: 0,
    hotels: 0,
    flights: 0,
    transfers: 0
  };

  // Calculate totals for each city
  itinerary.cities.forEach(city => {
    city.days.forEach(day => {
      segmentTotals.activities += calculateSegmentTotal(day.activities, markups.activities);
      segmentTotals.hotels += calculateSegmentTotal(day.hotels, markups.hotels);
      segmentTotals.flights += calculateSegmentTotal(day.flights, markups.flights);
      segmentTotals.transfers += calculateSegmentTotal(day.transfers, markups.transfers);
    });
  });

  const subtotal = Object.values(segmentTotals).reduce((a, b) => a + b, 0);
  const tcsRate = subtotal > tcsRates.threshold ? tcsRates.highValue : tcsRates.default;
  const tcsAmount = (subtotal * tcsRate) / 100;
  const grandTotal = subtotal + tcsAmount;

  dispatch(updateCalculatedPrices({
    segmentTotals,
    subtotal,
    tcsRate,
    tcsAmount,
    grandTotal
  }));
};

export default priceSlice.reducer;