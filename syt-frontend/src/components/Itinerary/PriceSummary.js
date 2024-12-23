import { Typography } from '@mui/material';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMarkupSettings } from '../../redux/slices/markupSlice';
import { calculateItineraryTotal } from '../../utils/priceCalculations';
import './PriceSummary.css';

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

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="price-summary-container"
    >
      {/* Header Section */}
      <Typography variant="h6" className="price-summary-title">
        Price Summary
      </Typography>

      {/* Segment Totals */}
      <div className="segment-totals">
        {Object.entries(totals.segmentTotals).map(([segment, amount]) => (
          <motion.div
            key={segment}
            variants={itemVariants}
            className="segment-item"
          >
            <Typography className="segment-name">
              {segment.charAt(0).toUpperCase() + segment.slice(1)}
            </Typography>
            <Typography className="segment-amount">
              {formatAmount(amount)}
            </Typography>
          </motion.div>
        ))}
      </div>

      {/* Subtotal Section */}
      <motion.div variants={itemVariants} className="summary-section">
        <div className="summary-row">
          <Typography className="summary-label">Subtotal</Typography>
          <Typography className="summary-amount">
            {formatAmount(totals.subtotal)}
          </Typography>
        </div>
        <div className="summary-row">
          <Typography className="summary-label">
            TCS ({totals.tcsRate}%)
          </Typography>
          <Typography className="summary-amount">
            {formatAmount(totals.tcsAmount)}
          </Typography>
        </div>
      </motion.div>

      {/* Total Section */}
      <motion.div variants={itemVariants} className="total-section">
        <Typography variant="h6" className="total-label">Total</Typography>
        <Typography variant="h6" className="total-amount">
          {formatAmount(totals.grandTotal)}
        </Typography>
      </motion.div>
    </motion.div>
  );
};

export default PriceSummary;