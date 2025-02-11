import { Edit, PictureAsPdf } from "@mui/icons-material";
import {
  Button,
  Container,
  Grid,
  Alert as MuiAlert,
  AlertTitle as MuiAlertTitle,
  Snackbar,
  Typography,
  useTheme
} from "@mui/material";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorBoundary from "../../components/ErrorBoundary";
import CityAccordion from "../../components/Itinerary/CityAccordion";
import PriceSummary from "../../components/Itinerary/PriceSummary";
import ModalManager from "../../components/ModalManager";
import ModificationModal from "../../components/ModificationModal/ModificationModal";
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useAuth } from "../../context/AuthContext";
import { clearAllActivityStates } from "../../redux/slices/activitySlice";
import { createItinerary, resetItineraryState } from "../../redux/slices/itinerarySlice";
import { generateItineraryPDF } from "../../utils/pdfGenerator";
import { calculateItineraryTotal } from "../../utils/priceCalculations";
import "./ItineraryPage.css";
import backgroundImageLight from "./w2.jpg";
import backgroundImageDark from "./w3.jpg";

const ItineraryPage = () => {
  const theme = useTheme();

  // States
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingProgress, setBookingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isModificationModalOpen, setIsModificationModalOpen] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modificationError, setModificationError] = useState(null);
  const [isCreatingNewItinerary, setIsCreatingNewItinerary] = useState(false);

  // Background image selection based on theme
  const backgroundImage = theme.palette.mode === "dark" ? backgroundImageDark : backgroundImageLight;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.palette.mode);
    const timer = setTimeout(() => {
      document.documentElement.style.setProperty("--background-image", `url(${backgroundImage})`);
    }, 50);
    return () => clearTimeout(timer);
  }, [backgroundImage, theme.palette.mode]);

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
    itineraryToken,
  } = useSelector((state) => state.itinerary);

  const { markups, tcsRates } = useSelector((state) => state.markup);

  // Handlers
  const handleDownloadPDF = () => {
    if (itinerary) {
      generateItineraryPDF(itinerary);
    }
  };

  const handleBookingError = (error) => {
    setBookingError(error.message || "Error processing booking");
    setIsBooking(false);
  };

  const processActivity = async (activity, cityName, date) => {
    if (activity.bookingReference && activity.bookingReference.bookingRef) {
      console.log(
        `Booking reference already exists for activity ${activity.activityName}`
      );
      return true;
    }

    try {
      const referenceResponse = await axios.post(
        "http://localhost:5000/api/itinerary/activity/reference",
        {
          activityCode: activity.activityCode,
          searchId: activity.searchId,
          startTime: activity.packageDetails?.departureTime,
          gradeCode: activity.tourGrade?.gradeCode,
        },
        {
          headers: {
            "X-Inquiry-Token": itineraryInquiryToken,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/activity/booking-ref`,
        {
          cityName,
          date,
          activityCode: activity.activityCode,
          bookingReference: referenceResponse.data,
        },
        {
          headers: {
            "X-Inquiry-Token": itineraryInquiryToken,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error("Error processing activity:", error);
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
            grandTotal: totals.grandTotal,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating prices:", error);
      throw error;
    }
  };

  const handleModifyItinerary = async (modifiedData) => {
    try {
      setIsCreatingNewItinerary(true);
      await dispatch(resetItineraryState());
      await dispatch(createItinerary(itineraryInquiryToken)).unwrap();
      setIsModificationModalOpen(false);
    } catch (error) {
      console.error('Error modifying itinerary:', error);
      setModificationError(error.response?.data?.message || 'Error modifying itinerary');
    } finally {
      setIsCreatingNewItinerary(false);
      setIsModifying(false);
    }
  };

  const handleBookTrip = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login", {
          state: { from: location.pathname },
          replace: true,
        });
        return;
      }

      // Check payment status first
      if (itinerary.paymentStatus === 'completed') {
        // If payment is completed, navigate directly to booking confirmation
        navigate("/booking-confirmation", {
          state: {
            bookingId: itinerary.bookingId,
            paymentSuccess: true,
            itinerary,
          },
          replace: true
        });
        return;
      }

      // If payment is pending, continue with booking process
      if (!itinerary || !markups || !tcsRates) {
        console.error("Missing required data for booking:", {
          hasItinerary: !!itinerary,
          hasMarkups: !!markups,
          hasTcsRates: !!tcsRates,
        });
        return;
      }

      setIsBooking(true);
      setBookingError(null);

      const onlineActivities = itinerary.cities.flatMap((city) =>
        city.days.flatMap(
          (day) =>
            day.activities?.filter(
              (activity) => activity.activityType === "online"
            ) || []
        )
      );

      const totalItems = onlineActivities.length;
      setBookingProgress({ current: 0, total: totalItems });

      for (const activity of onlineActivities) {
        const cityDay = itinerary.cities
          .flatMap((city) =>
            city.days.map((day) => ({
              cityName: city.city,
              date: day.date,
              activities: day.activities,
            }))
          )
          .find((item) =>
            item.activities?.some(
              (a) => a.activityCode === activity.activityCode
            )
          );

        if (cityDay) {
          const success = await processActivity(
            activity,
            cityDay.cityName,
            cityDay.date
          );
          if (!success) {
            throw new Error(
              `Failed to process activity ${activity.activityName}`
            );
          }

          setBookingProgress((prev) => ({
            ...prev,
            current: prev.current + 1,
          }));
        }
      }

      await handlePriceUpdate();
      navigate("/booking-form", {
        state: {
          itinerary,
          itineraryToken,
          inquiryToken: itineraryInquiryToken,
        },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/auth/login", {
          state: { from: location.pathname },
          replace: true,
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
      navigate("/auth/login", {
        state: { from: location.pathname },
        replace: true,
      });
      return;
    }

    if (!itineraryInquiryToken) {
      navigate("/", { replace: true });
      return;
    }

    dispatch(clearAllActivityStates());

    const handleItinerary = async () => {
      try {
        await dispatch(createItinerary(itineraryInquiryToken)).unwrap();
      } catch (err) {
        console.error("Error handling itinerary:", err);
        navigate("/", { replace: true });
      }
    };

    handleItinerary();
  }, [dispatch, itineraryInquiryToken, navigate, isAuthenticated, location.pathname]);

  if (loading || checkingExisting) {
    return (
      <div className="loading-container flex-center">
        <LoadingSpinner
          message={checkingExisting ? "Checking your existing itinerary..." : "Crafting your perfect journey..."}
          sx={{ color: theme.palette.text.base }}
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
            <MuiAlert
              severity="error"
              variant="filled"
              className="error-alert"
              sx={{
                "& .MuiAlert-message": {
                  color: theme.palette.error.contrastText,
                },
              }}
            >
              <MuiAlertTitle>Unable to Load Itinerary</MuiAlertTitle>
              {error}
            </MuiAlert>
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              className="button-outline mt-4"
              sx={{ color: theme.palette.text.base }}
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
        <LoadingSpinner
          message="Preparing your itinerary details..."
          sx={{ color: theme.palette.text.base }}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="itinerary-page">
        <div className="background-blur" />

        <Container maxWidth="xl" className="container" sx={{ px: { xs: 0.5, sm: 1, md: 2 } }}>
          {/* Title */}
          <Grid container justifyContent="center" sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h3"
                  className="itinerary-title"
                  sx={{
                    color: theme.palette.text.special,
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  Your Itinerary
                </Typography>
              </motion.div>
            </Grid>
          </Grid>

          {/* Main content */}
          <Grid container spacing={2}>
            {/* Left Column - Cities */}
            <Grid item xs={12} md={8} sx={{ pr: { md: 1 } }}>
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
            </Grid>

            {/* Right Column - Price Summary and Actions */}
            <Grid item xs={12} md={4} sx={{ pl: { md: 1 } }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card"
              >
                {itinerary && <PriceSummary itinerary={itinerary} />}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="booking-section"
                style={{
                  width: "100%",
                  marginTop: "1rem",
                }}
              >
                <div
                 className="button-group"
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setIsModificationModalOpen(true)}
                    disabled={isBooking || isModifying}
                    className="button-outline"
                    sx={{
                      color: theme.palette.text.base,
                      width: "100%",
                      padding: "0.75rem",
                    }}
                  >
                    {isModifying ? "Modifying..." : "Modify Itinerary"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdf sx={{ color: "white" }} />}
                    onClick={handleDownloadPDF}
                    disabled={isBooking}
                    className="button-outline"
                    sx={{
                      color: theme.palette.text.base,
                      width: "100%",
                      padding: "0.75rem",
                    }}
                  >
                    Download PDF
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleBookTrip}
                    disabled={isBooking}
                    className="button-gradient"
                    sx={{
                      color: theme.palette.primary.contrastText,
                      width: "100%",
                      padding: "0.75rem",
                      "&.Mui-disabled": {
                        color: theme.palette.action.disabled,
                      },
                    }}
                  >
                    {isBooking ? "Processing..." : "Book Your Trip"}
                  </Button>
                </div>
              </motion.div>
            </Grid>
          </Grid>

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
                  <p className="loading-text" style={{ color: theme.palette.text.base }}>
                    Processing booking {bookingProgress.current} of {bookingProgress.total}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Creating New Itinerary Alert */}
          <AnimatePresence>
            {isCreatingNewItinerary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              >
                <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                  <Alert>
                    <AlertTitle>Modifying Itinerary</AlertTitle>
                    <AlertDescription>
                      Please wait while we create your new itinerary with the modified details...
                    </AlertDescription>
                  </Alert>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Snackbar */}
          <AnimatePresence>
            {(bookingError || modificationError) && (
              <Snackbar
                open={Boolean(bookingError || modificationError)}
                autoHideDuration={6000}
                onClose={() => {
                  setBookingError(null);
                  setModificationError(null);
                }}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              >
                <MuiAlert
                  severity="error"
                  onClose={() => {
                    setBookingError(null);
                    setModificationError(null);
                  }}
                  sx={{ width: '100%' }}
                >
                  <MuiAlertTitle>
                    {bookingError ? "Booking Error" : "Modification Error"}
                  </MuiAlertTitle>
                  {bookingError || modificationError}
                </MuiAlert>
              </Snackbar>
            )}
          </AnimatePresence>

          {/* Modification Modal */}
          <ModificationModal
            open={isModificationModalOpen}
            onClose={() => !isModifying && setIsModificationModalOpen(false)}
            itineraryInquiryToken={itineraryInquiryToken}
            onModify={handleModifyItinerary}
            isModifying={isModifying}
          />

          <ModalManager />
        </Container>
      </div>
    </ErrorBoundary>
  );
};

export default ItineraryPage;