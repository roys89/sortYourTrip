// components/PriceSummary.js
import { Box, Paper, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMarkupSettings } from '../../redux/slices/markupSlice';
import { calculateItineraryTotal } from '../../utils/priceCalculations';

const PriceSummary = ({ itinerary }) => {
  const dispatch = useDispatch();
  const { markups, tcsRates, lastUpdated } = useSelector(state => state.markup);

  // Only fetch if we don't have markup data yet
  useEffect(() => {
    if (!lastUpdated) {
      dispatch(fetchMarkupSettings());
    }
  }, [dispatch, lastUpdated]);

  const totals = calculateItineraryTotal(itinerary, markups, tcsRates);
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Price Summary
      </Typography>
      
      {Object.entries(totals.segmentTotals).map(([segment, amount]) => (
        <Box key={segment} display="flex" justifyContent="space-between" mb={1}>
          <Typography>
            {segment.charAt(0).toUpperCase() + segment.slice(1)}
          </Typography>
          <Typography>
            ₹{amount.toLocaleString('en-IN')}
          </Typography>
        </Box>
      ))}

      <Box mt={2} pt={2} borderTop={1} borderColor="divider">
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>Subtotal</Typography>
          <Typography>₹{totals.subtotal.toLocaleString('en-IN')}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography>TCS ({totals.tcsRate}%)</Typography>
          <Typography>₹{totals.tcsAmount.toLocaleString('en-IN')}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mt={2} pt={2} borderTop={1} borderColor="divider">
          <Typography variant="h6">Total</Typography>
          <Typography variant="h6">₹{totals.grandTotal.toLocaleString('en-IN')}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default PriceSummary;