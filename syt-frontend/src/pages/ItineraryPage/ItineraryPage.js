  // ItineraryPage.js
  import { PictureAsPdf } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
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
    // States
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    const [bookingProgress, setBookingProgress] = useState({ current: 0, total: 0 });

    // Hooks
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { state } = location;

    const itineraryInquiryToken = state?.itineraryInquiryToken || location.state?.itineraryInquiryToken;

    // Redux selectors
    const { 
      data: itinerary, 
      loading, 
      error, 
      checkingExisting,
      itineraryToken
    } = useSelector((state) => state.itinerary);

    const { markups, tcsRates } = useSelector(state => state.markup);

    // Handlers
    const handleDownloadPDF = () => {
      if (itinerary) {
        generateItineraryPDF(itinerary);
      }
    };

    const handleBookingError = (error) => {
      setBookingError(error.message || 'Error processing booking');
      setIsBooking(false);
    };

    const processActivity = async (activity, cityName, date) => {
      try {
        // Create booking reference
        const referenceResponse = await axios.post(
          'http://localhost:5000/api/itinerary/activity/reference',
          {
            activityCode: activity.activityCode,
            searchId: activity.searchId,
            startTime: activity.packageDetails?.departureTime,
            gradeCode: activity.tourGrade?.gradeCode
          },
          {
            headers: { 'X-Inquiry-Token': itineraryInquiryToken }
          }
        );

        // Update itinerary with booking reference
        await axios.put(
          `http://localhost:5000/api/itinerary/${itineraryToken}/activity/booking-ref`,
          {
            cityName,
            date,
            activityCode: activity.activityCode,
            bookingReference: referenceResponse.data
          },
          {
            headers: { 'X-Inquiry-Token': itineraryInquiryToken }
          }
        );

        return true;
      } catch (error) {
        console.error('Error processing activity:', error);
        return false;
      }
    };

    const handlePriceUpdate = async () => {
      try {
        const totals = calculateItineraryTotal(itinerary, markups, tcsRates);
        await axios.put(`http://localhost:5000/api/itinerary/${itineraryToken}/prices`, {
          priceTotals: {
            ...totals.segmentTotals,
            subtotal: totals.subtotal,
            tcsAmount: totals.tcsAmount,
            tcsRate: totals.tcsRate,
            grandTotal: totals.grandTotal
          }
        });
      } catch (error) {
        console.error('Error updating prices:', error);
        throw error;
      }
    };

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

        setIsBooking(true);
        setBookingError(null);

        // Calculate total items to process
        let totalItems = 0;
        itinerary.cities.forEach(city => {
          city.days.forEach(day => {
            totalItems += (day.activities?.length || 0);
          });
        });
        setBookingProgress({ current: 0, total: totalItems });

        // Process each city
        for (const city of itinerary.cities) {
          for (const day of city.days) {
            // Process activities
            if (day.activities) {
              for (const activity of day.activities) {
                if (activity.activityType === 'online') {
                  const success = await processActivity(activity, city.city, day.date);
                  if (!success) {
                    throw new Error(`Failed to process activity ${activity.activityName}`);
                  }
                  setBookingProgress(prev => ({ ...prev, current: prev.current + 1 }));
                }
              }
            }
          }
        }

        // Proceed with price totals and navigation
        await handlePriceUpdate();
        navigate('/booking-form', { 
          state: { itinerary }
        });

      } catch (error) {
        handleBookingError(error);
      } finally {
        setIsBooking(false);
      }
    };

    // Effects
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

    // Render loading state
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

    // Render error state
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

    // Render loading state
    if (!itinerary) {
      return null;
    }

    // Main render
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
                disabled={isBooking}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleBookTrip}
                disabled={isBooking}
              >
                {isBooking ? 'Processing...' : 'Book Your Trip'}
              </Button>
            </Box>
          </Box>

          {isBooking && (
            <Box display="flex" flexDirection="column" alignItems="center" my={3}>
              <CircularProgress size={40} />
              <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                Processing booking {bookingProgress.current} of {bookingProgress.total}
              </Typography>
            </Box>
          )}

          {bookingError && (
            <Alert severity="error" onClose={() => setBookingError(null)} sx={{ my: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {bookingError}
            </Alert>
          )}

          <ModalManager />
        </Container>
      </ErrorBoundary>
    );
  };

  export default ItineraryPage;