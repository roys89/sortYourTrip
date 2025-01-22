import { Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMarkupSettings } from '../../redux/slices/markupSlice';
import { calculateItineraryTotal } from '../../utils/priceCalculations';
import './PriceSummary.css';

const PriceSummary = ({ itinerary }) => {
  const [expandedSegment, setExpandedSegment] = useState(null);
  const dispatch = useDispatch();
  const { markups, tcsRates, lastUpdated } = useSelector(state => state.markup);

  useEffect(() => {
    if (!lastUpdated) {
      dispatch(fetchMarkupSettings());
    }
  }, [dispatch, lastUpdated]);

  const totals = calculateItineraryTotal(itinerary, markups, tcsRates);

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

  const getFlightBreakdown = (flight) => {
    if (!flight?.flightData) return null;
    
    const data = flight.flightData;
    const breakdown = {
      baseFare: data.price || 0,
      seats: 0,
      baggage: 0,
      meals: 0
    };

    // Calculate seats total
    if (data.isSeatSelected && data.selectedSeats) {
      breakdown.seats = data.selectedSeats.reduce((total, segment) => {
        return total + segment.rows.reduce((rowTotal, row) => {
          return rowTotal + row.seats.reduce((seatTotal, seat) => seatTotal + (seat.price || 0), 0);
        }, 0);
      }, 0);
    }

    // Calculate baggage total
    if (data.isBaggageSelected && data.selectedBaggage) {
      breakdown.baggage = data.selectedBaggage.reduce((total, segment) => {
        return total + segment.options.reduce((optTotal, opt) => optTotal + (opt.price || 0), 0);
      }, 0);
    }

    // Calculate meals total
    if (data.isMealSelected && data.selectedMeal) {
      breakdown.meals = data.selectedMeal.reduce((total, segment) => {
        return total + segment.options.reduce((optTotal, opt) => optTotal + (opt.price || 0), 0);
      }, 0);
    }

    return breakdown;
  };

  const renderFlightBreakdown = (flight) => {
    const breakdown = getFlightBreakdown(flight);
    if (!flight?.flightData || !breakdown) return null;
  
    return (
      <div className="flight-breakdown">
        <div className="breakdown-title">
          <Typography className="segment-name" style={{ fontWeight: 600 }}>
            {flight.flightData.origin} - {flight.flightData.destination}
          </Typography>
        </div>
        <div className="breakdown-item">
          <Typography className="breakdown-name">Base Fare</Typography>
          <Typography className="breakdown-amount">{formatAmount(breakdown.baseFare)}</Typography>
        </div>
        {breakdown.seats > 0 && (
          <div className="breakdown-item">
            <Typography className="breakdown-name">Seat Selection</Typography>
            <Typography className="breakdown-amount">{formatAmount(breakdown.seats)}</Typography>
          </div>
        )}
        {breakdown.baggage > 0 && (
          <div className="breakdown-item">
            <Typography className="breakdown-name">Extra Baggage</Typography>
            <Typography className="breakdown-amount">{formatAmount(breakdown.baggage)}</Typography>
          </div>
        )}
        {breakdown.meals > 0 && (
          <div className="breakdown-item">
            <Typography className="breakdown-name">Meals</Typography>
            <Typography className="breakdown-amount">{formatAmount(breakdown.meals)}</Typography>
          </div>
        )}
      </div>
    );
  };

  if (!markups || !tcsRates || !totals) {
    return <div className="price-summary-container">Loading price summary...</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="price-summary-container"
    >
      <Typography variant="h6" className="price-summary-title">
        Price Summary
      </Typography>

      <div className="segment-totals">
        {Object.entries(totals.segmentTotals).map(([segment, amount], index) => {
          const hasFlightBreakdown = segment === 'flights' && 
            itinerary.cities.some(city => 
              city.days.some(day => 
                day.flights?.some(flight => flight.flightData)
              )
            );

          return (
            <React.Fragment key={segment}>
              <motion.div variants={itemVariants} className="segment-item-container">
                <div 
                  className="segment-header"
                  onClick={() => hasFlightBreakdown && setExpandedSegment(expandedSegment === segment ? null : segment)}
                >
                  <div className="segment-icon-wrapper">
                    <Typography className="segment-name">
                      {segment.charAt(0).toUpperCase() + segment.slice(1)}
                    </Typography>
                    {hasFlightBreakdown && (
                      expandedSegment === segment ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                  <Typography className="segment-amount">
                    {formatAmount(amount)}
                  </Typography>
                </div>
          
            {expandedSegment === segment && hasFlightBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flight-breakdown"
              >
                {itinerary.cities.map((city, cityIndex) => 
                  city.days.map((day, dayIndex) => 
                    day.flights?.map((flight, flightIndex) => (
                      <div key={`${cityIndex}-${dayIndex}-${flightIndex}`}>
                        {renderFlightBreakdown(flight)}
                      </div>
                    ))
                  )
                )}
              </motion.div>
            )}
          </motion.div>
              {index < Object.entries(totals.segmentTotals).length - 1 && (
                <div className="segment-divider" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="summary-section">
        <div className="summary-row">
          <Typography className="summary-label">
            Subtotal
          </Typography>
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
      </div>

      <div className="total-section">
        <Typography variant="h6" className="total-label">
          Total
        </Typography>
        <Typography variant="h6" className="total-amount">
          {formatAmount(totals.grandTotal)}
        </Typography>
      </div>
    </motion.div>
  );
};

export default PriceSummary;