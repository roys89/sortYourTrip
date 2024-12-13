// ItineraryPage.js
import { PictureAsPdf } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography
} from '@mui/material';
import axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import CityAccordion from '../../components/Itinerary/CityAccordion';
import PriceSummary from '../../components/Itinerary/PriceSummary';
import ModalManager from '../../components/ModalManager';
import { clearAllActivityStates } from '../../redux/slices/activitySlice';
import {
  clearItineraryData,
  clearItineraryError,
  createItinerary
} from '../../redux/slices/itinerarySlice';
import { generateItineraryPDF } from '../../utils/pdfGenerator';
import { calculateItineraryTotal } from '../../utils/priceCalculations';
import './ItineraryPage.css';

const ItineraryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const itineraryInquiryToken = state?.itineraryInquiryToken || location.state?.itineraryInquiryToken;

  const { 
    data: itinerary, 
    loading, 
    error, 
    checkingExisting,
    itineraryToken
  } = useSelector((state) => state.itinerary);

  const { markups, tcsRates } = useSelector(state => state.markup);

  const handleDownloadPDF = () => {
    if (itinerary) {
      generateItineraryPDF(itinerary);
    }
  };

// In ItineraryPage.js - Update the handleBookTrip function
const handleBookTrip = async () => {
  try {
    if (!itinerary || !markups || !tcsRates) {
      console.error('Missing required data for booking:', {
        hasItinerary: !!itinerary,
        hasMarkups: !!markups,
        hasTcsRates: !!tcsRates
      });
      return;
    }

    const totals = calculateItineraryTotal(itinerary, markups, tcsRates);
    console.log('Calculated totals:', totals);

    // Update itinerary with price totals
    const response = await axios.put(`http://localhost:5000/api/itinerary/${itineraryToken}/prices`, {
      priceTotals: {
        ...totals.segmentTotals,
        subtotal: totals.subtotal,
        tcsAmount: totals.tcsAmount,
        tcsRate: totals.tcsRate,
        grandTotal: totals.grandTotal
      }
    });

    console.log('Price update response:', response.data);

    // Verify we have all required data before navigation
    const updatedItinerary = {
      ...itinerary,
      priceTotals: {
        ...totals.segmentTotals,
        subtotal: totals.subtotal,
        tcsAmount: totals.tcsAmount,
        tcsRate: totals.tcsRate,
        grandTotal: totals.grandTotal
      }
    };

    console.log('Navigating to booking form with:', updatedItinerary);

    // Navigate with validated data
    navigate('/booking-form', { 
      state: { 
        itinerary: updatedItinerary
      }
    });
  } catch (error) {
    console.error('Error in handleBookTrip:', error);
  }
};

  useEffect(() => {
    if (!itineraryInquiryToken) {
      navigate('/', { replace: true });
      return;
    }
  
    dispatch(clearAllActivityStates());
  
    const handleItinerary = async () => {
      try {
        await dispatch(createItinerary(itineraryInquiryToken)).unwrap();
      } catch (err) {
        console.error('Error handling itinerary:', err);
      }
    };
  
    handleItinerary();
  
    return () => {
      dispatch(clearItineraryError());
      dispatch(clearItineraryData());
    };
  }, [dispatch, itineraryInquiryToken, navigate]);

  if (loading || checkingExisting) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress color="primary" size={40} />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          {checkingExisting ? 'Checking existing itinerary...' : 'Loading your itinerary...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-message" p={3}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading itinerary
        </Typography>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!itinerary) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" className="itinerary-container">
        <Typography variant="h3" className="itinerary-title" gutterBottom>
          Your Itinerary
        </Typography>
        
        {itinerary.cities?.map((city, index) => (
          <CityAccordion 
            key={`${city.city}-${index}`}
            city={city}
            inquiryToken={itineraryInquiryToken}
            travelersDetails={itinerary.travelersDetails}
          />
        ))}
  
        {itinerary && <PriceSummary itinerary={itinerary} />}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h3" className="itinerary-title">
            Want to book your trip?
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={handleDownloadPDF}
              sx={{ mr: 2 }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBookTrip}
              disabled={loading}
            >
              Book Your Trip
            </Button>
          </Box>
        </Box>
      </Container>
      <ModalManager />
    </ErrorBoundary>
  );
};

export default ItineraryPage;