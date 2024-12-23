import { PictureAsPdf } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Button,
  Container,
  Typography
} from '@mui/material';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorBoundary from '../../components/ErrorBoundary';
import CityAccordion from '../../components/Itinerary/CityAccordion';
import PriceSummary from '../../components/Itinerary/PriceSummary';
import ModalManager from '../../components/ModalManager';
import { useAuth } from '../../context/AuthContext';
import { clearAllActivityStates } from '../../redux/slices/activitySlice';
import { createItinerary } from '../../redux/slices/itinerarySlice';
import { generateItineraryPDF } from '../../utils/pdfGenerator';
import { calculateItineraryTotal } from '../../utils/priceCalculations';
import './ItineraryPage.css';
import backgroundImage from './w3.jpg';

// Set the background image as a CSS variable
document.documentElement.style.setProperty(
  '--background-image',
  `url(${backgroundImage})`
);


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
  const { isAuthenticated } = useAuth();

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
    if (activity.bookingReference && activity.bookingReference._id) {
      console.log(`Booking reference already exists for activity ${activity.activityName}`);
      return true;
    }
  
    try {
      const referenceResponse = await axios.post(
        'http://localhost:5000/api/itinerary/activity/reference',
        {
          activityCode: activity.activityCode,
          searchId: activity.searchId,
          startTime: activity.packageDetails?.departureTime,
          gradeCode: activity.tourGrade?.gradeCode
        },
        {
          headers: { 
            'X-Inquiry-Token': itineraryInquiryToken,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/activity/booking-ref`,
        {
          cityName,
          date,
          activityCode: activity.activityCode,
          bookingReference: referenceResponse.data
        },
        {
          headers: { 
            'X-Inquiry-Token': itineraryInquiryToken,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
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
      await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/prices`, 
        {
          priceTotals: {
            ...totals.segmentTotals,
            subtotal: totals.subtotal,
            tcsAmount: totals.tcsAmount,
            tcsRate: totals.tcsRate,
            grandTotal: totals.grandTotal
          }
        },
        {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    } catch (error) {
      console.error('Error updating prices:', error);
      throw error;
    }
  };

  const handleBookTrip = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/login', { 
          state: { from: location.pathname },
          replace: true 
        });
        return;
      }

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
  
      const onlineActivities = itinerary.cities.flatMap(city => 
        city.days.flatMap(day => 
          day.activities?.filter(activity => activity.activityType === 'online') || []
        )
      );
  
      const totalItems = onlineActivities.length;
      setBookingProgress({ current: 0, total: totalItems });
  
      for (const activity of onlineActivities) {
        const cityDay = itinerary.cities
          .flatMap(city => 
            city.days.map(day => ({ 
              cityName: city.city, 
              date: day.date, 
              activities: day.activities 
            }))
          )
          .find(item => 
            item.activities?.some(a => a.activityCode === activity.activityCode)
          );
  
        if (cityDay) {
          const success = await processActivity(activity, cityDay.cityName, cityDay.date);
          if (!success) {
            throw new Error(`Failed to process activity ${activity.activityName}`);
          }
  
          setBookingProgress(prev => ({ 
            ...prev, 
            current: prev.current + 1 
          }));
        }
      }
  
      await handlePriceUpdate();
      navigate('/booking-form', { 
        state: { 
          itinerary,
          itineraryToken,
          inquiryToken: itineraryInquiryToken
        }
      });
  
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/auth/login', { 
          state: { from: location.pathname },
          replace: true 
        });
      } else {
        handleBookingError(error);
      }
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }
  
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
        navigate('/', { replace: true });
      }
    };
  
    handleItinerary();
  }, [dispatch, itineraryInquiryToken, navigate, isAuthenticated, location.pathname]);

  if (loading || checkingExisting) {
    return (
      <div className="loading-container flex-center">
        <LoadingSpinner 
          message={checkingExisting 
            ? "Checking your existing itinerary..." 
            : "Crafting your perfect journey..."}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container flex-center">
        <Container maxWidth="sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
          >
            <Alert 
              severity="error" 
              variant="filled"
              className="error-alert"
            >
              <AlertTitle>Unable to Load Itinerary</AlertTitle>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              className="button-outline mt-4"
            >
              Return Home
            </Button>
          </motion.div>
        </Container>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="loading-container flex-center">
        <LoadingSpinner message="Preparing your itinerary details..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="itinerary-page">
        {/* Background Image with Blur */}
        <div className="background-blur" />

        <Container maxWidth="lg" className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography 
              variant="h3" 
              className="itinerary-title"
            >
              Your Itinerary
            </Typography>
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {itinerary.cities?.map((city, index) => (
                <motion.div
                  key={`${city.city}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CityAccordion 
                    city={city}
                    inquiryToken={itineraryInquiryToken}
                    travelersDetails={itinerary.travelersDetails}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="summary-card glass-card"
          >
            {itinerary && <PriceSummary itinerary={itinerary} />}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="booking-section"
          >
            <Typography variant="h3" className="booking-title">
              Want to book your trip?
            </Typography>
            <div className="button-group">
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={handleDownloadPDF}
                disabled={isBooking}
                className="button-outline"
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                onClick={handleBookTrip}
                disabled={isBooking}
                className="button-gradient"
              >
                {isBooking ? 'Processing...' : 'Book Your Trip'}
              </Button>
            </div>
          </motion.div>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isBooking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="loading-overlay"
              >
                <div className="loading-content">
                  <div className="loading-spinner" />
                  <p className="loading-text">
                    Processing booking {bookingProgress.current} of {bookingProgress.total}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Toast */}
          <AnimatePresence>
            {bookingError && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="error-toast"
              >
                <AlertTitle className="error-title">Booking Error</AlertTitle>
                <p className="error-message">{bookingError}</p>
                <button 
                  onClick={() => setBookingError(null)}
                  className="close-button"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>

        <ModalManager />
      </div>
    </ErrorBoundary>
  );
};

export default ItineraryPage;