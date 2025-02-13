// src/pages/Payment/PaymentPage.js
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { CreditCard, Lock, Shield, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from 'react-dom/client';
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSummary from "../../components/BookingSummary/BookingSummary";
import {
  searchReplacementFlight, updateItineraryFlight
} from '../../redux/slices/flightReplacementSlice';
import {
  searchReplacementHotel, updateItineraryHotel
} from '../../redux/slices/hotelReplacementSlice';
import {
  createPaymentOrder,
  setPaymentLoading,
  setTermsAccepted,
  validateItineraryComponents,
  verifyPayment
} from "../../redux/slices/paymentSlice";
import "./PaymentPage.css";

// Dialog Components
const ErrorDialog = ({ components, onClose }) => (
  <Dialog open={true} maxWidth="sm" fullWidth>
    <DialogTitle>Components Need Reallocation</DialogTitle>
    <DialogContent>
      <Typography variant="body1" gutterBottom>
        Some components require immediate reallocation due to errors:
      </Typography>
      {components.map((component, index) => (
        <Typography key={index} variant="body2" color="error" gutterBottom>
          {component.type === 'flight' 
            ? `Flight: ${component.flight.flightData.origin} → ${component.flight.flightData.destination}` 
            : `Hotel: ${component.hotel.data.hotelDetails.name}`}
          <br />
          {component.error?.message || 'Validation error occurred'}
        </Typography>
      ))}
    </DialogContent>
    <DialogActions>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => onClose(true)}
      >
        Proceed to Reallocation
      </Button>
    </DialogActions>
  </Dialog>
);

const ImmediateDialog = ({ components, onClose }) => (
  <Dialog open={true} maxWidth="sm" fullWidth>
    <DialogTitle>Immediate Reallocation Required</DialogTitle>
    <DialogContent>
      <Typography variant="body1" gutterBottom>
        These components need immediate reallocation (less than 2 minutes remaining):
      </Typography>
      {components.map((component, index) => (
        <Typography key={index} variant="body2" color="error" gutterBottom>
          {component.type === 'flight' 
            ? `Flight: ${component.origin} → ${component.destination}` 
            : `Hotel: ${component.name}`}
          {component.remainingTime !== null && (
            <> - {component.remainingTime} minute{component.remainingTime !== 1 ? 's' : ''} remaining</>
          )}
        </Typography>
      ))}
    </DialogContent>
    <DialogActions>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => onClose(true)}
      >
        Proceed to Reallocation
      </Button>
    </DialogActions>
  </Dialog>
);

const WarningDialog = ({ components, onClose }) => (
  <Dialog open={true} maxWidth="sm" fullWidth>
    <DialogTitle>Limited Time Warning</DialogTitle>
    <DialogContent>
      <Typography variant="body1" gutterBottom>
        These components have limited time remaining:
      </Typography>
      {components.map((component, index) => (
        <Typography key={index} variant="body2" color="warning.main" gutterBottom>
          {component.type === 'flight' 
            ? `Flight: ${component.origin} → ${component.destination}` 
            : `Hotel: ${component.name}`}
           - {component.remainingTime} minutes remaining
        </Typography>
      ))}
      <Typography variant="body1" sx={{ mt: 2 }}>
        Can you complete the payment within 2 minutes?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button 
        variant="outlined" 
        color="secondary"
        onClick={() => onClose(false)}
      >
        No, Reallocate
      </Button>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => onClose(true)}
      >
        Yes, Continue
      </Button>
    </DialogActions>
  </Dialog>
);

const InfoDialog = ({ components, onClose }) => (
  <Dialog open={true} maxWidth="sm" fullWidth>
    <DialogTitle>Time Information</DialogTitle>
    <DialogContent>
      <Typography variant="body1" gutterBottom>
        Please note the remaining time for these components:
      </Typography>
      {components.map((component, index) => (
        <Typography key={index} variant="body2" gutterBottom>
          {component.type === 'flight' 
            ? `Flight: ${component.origin} → ${component.destination}` 
            : `Hotel: ${component.name}`}
           - {component.remainingTime} minutes remaining
        </Typography>
      ))}
    </DialogContent>
    <DialogActions>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => onClose(true)}
      >
        Proceed with Payment
      </Button>
    </DialogActions>
  </Dialog>
);

const PaymentPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { termsAccepted, loading } = useSelector((state) => state.payment);

  const [showTerms, setShowTerms] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const { bookingId, bookingData, itinerary } = location.state || {};

  const handleReallocation = useCallback(async (components) => {
    try {
      const reallocationResults = [];
      
      // Process components sequentially
      for (const component of components) {
        try {
          if (component.type === 'flight') {
            // 1. Search for replacement flight
            const searchResult = await dispatch(
              searchReplacementFlight({
                expiredFlight: component.flight.flightData,
                itinerary,
                inquiryToken: itinerary.inquiryToken
              })
            ).unwrap();

            if (!searchResult || !Array.isArray(searchResult) || searchResult.length === 0) {
              throw new Error('No replacement flights found');
            }

            // 2. Update itinerary with new flight
            const cityName = component.flight.flightData.type === 'return_flight' 
              ? component.flight.flightData.origin 
              : component.flight.flightData.destination;

            const updateResult = await dispatch(
              updateItineraryFlight({
                itineraryToken: itinerary.itineraryToken,
                cityName,
                date: component.flight.flightData.departureDate,
                newFlightDetails: searchResult[0],
                type: component.flight.flightData.type || 'departure_flight',
                inquiryToken: itinerary.inquiryToken
              })
            ).unwrap();

            reallocationResults.push({
              type: 'flight',
              searchResult,
              updateResult
            });

          } else if (component.type === 'hotel') {
            // 1. Search for replacement hotel
            const searchResult = await dispatch(
              searchReplacementHotel({
                failedHotel: { 
                  details: component.hotel.data 
                },
                itinerary,
                inquiryToken: itinerary.inquiryToken
              })
            ).unwrap();

            if (!searchResult || !searchResult.data) {
              throw new Error('No replacement hotels found');
            }

            // 2. Update itinerary with new hotel
            const updateResult = await dispatch(
              updateItineraryHotel({
                itineraryToken: itinerary.itineraryToken,
                date: component.hotel.data.searchRequestLog.checkIn || component.hotel.data.hotelDetails.checkIn,
                newHotelDetails: searchResult.data,
                checkIn: component.hotel.data.checkIn || component.hotel.data.hotelDetails.checkIn,
                checkout: component.hotel.data.checkOut || component.hotel.data.hotelDetails.checkOut,
                inquiryToken: itinerary.inquiryToken
              })
            ).unwrap();

            reallocationResults.push({
              type: 'hotel',
              searchResult,
              updateResult
            });
          }
        } catch (error) {
          console.error(`Reallocation error for ${component.type}:`, error);
          reallocationResults.push({
            type: component.type,
            error: error.message || 'Reallocation failed',
            component
          });
        }
      }

      // Filter out successful reallocations and errors
      const successfulReallocations = reallocationResults.filter(result => !result.error);
      const failedReallocations = reallocationResults.filter(result => result.error);

      // If there are any failures, show them in a snackbar
      if (failedReallocations.length > 0) {
        setSnackbar({
          open: true,
          message: `Failed to reallocate ${failedReallocations.length} component(s). Please try again.`,
          severity: "error",
        });
      }

      // Navigate to itinerary page with results
      navigate("/itinerary", {
        state: {
          itineraryToken: itinerary.itineraryToken,
          itineraryInquiryToken: itinerary.inquiryToken,
          reason: "Components need reallocation",
          reallocationResults: successfulReallocations,
          failedReallocations: failedReallocations
        }
      });
    } catch (error) {
      console.error("Reallocation error:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to reallocate components. Please try again.",
        severity: "error",
      });
    }
  }, [dispatch, itinerary, navigate]);

  const renderDialog = (DialogComponent) => {
    const dialogRoot = document.getElementById('dialog-root') || (() => {
      const newDialogRoot = document.createElement('div');
      newDialogRoot.id = 'dialog-root';
      document.body.appendChild(newDialogRoot);
      return newDialogRoot;
    })();

    return new Promise((resolve) => {
      const root = ReactDOM.createRoot(dialogRoot);
      const handleClose = (result) => {
        root.unmount();
        resolve(result);
      };
      root.render(<DialogComponent onClose={handleClose} />);
    });
  };

  const handlePayment = useCallback(async () => {
    if (!termsAccepted) {
      setSnackbar({
        open: true,
        message: "Please accept the terms and conditions",
        severity: "warning",
      });
      return;
    }

    dispatch(setPaymentLoading(true));

    try {
      const validationResult = await dispatch(
        validateItineraryComponents({
          itinerary,
          itineraryToken: itinerary.itineraryToken
        })
      ).unwrap();

      const { componentsToCheck } = validationResult;

      // Handle components with errors first (API failures)
      if (componentsToCheck.error.length > 0) {
        const dialogResult = await renderDialog(({ onClose }) => (
          <ErrorDialog components={componentsToCheck.error} onClose={onClose} />
        ));

        if (dialogResult) {
          await handleReallocation(componentsToCheck.error);
          return;
        }
      }

      // Handle components needing immediate reallocation (< 2 mins or null time)
      if (componentsToCheck.immediate.length > 0) {
        const dialogResult = await renderDialog(({ onClose }) => (
          <ImmediateDialog components={componentsToCheck.immediate} onClose={onClose} />
        ));

        if (dialogResult) {
          await handleReallocation(componentsToCheck.immediate);
          return;
        }
      }

      // Handle components with warning (2-3 mins)
      if (componentsToCheck.warning.length > 0) {
        const shouldProceed = await renderDialog(({ onClose }) => (
          <WarningDialog components={componentsToCheck.warning} onClose={onClose} />
        ));

        if (!shouldProceed) {
          await handleReallocation(componentsToCheck.warning);
          return;
        }
      }

      // Show info for components with > 3 mins remaining
      if (componentsToCheck.info.length > 0) {
        await renderDialog(({ onClose }) => (
          <InfoDialog components={componentsToCheck.info} onClose={onClose} />
        ));
      }

      // Proceed with payment if all checks pass
      if (!window.Razorpay) {
        throw new Error("Payment gateway not loaded. Please try again.");
      }

      const orderResult = await dispatch(
        createPaymentOrder({
          bookingId,
          amount: itinerary.priceTotals.grandTotal,
          itinerary
        })
      ).unwrap();

      const rzp = new window.Razorpay({
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderResult.data.amount,
        currency: orderResult.data.currency,
        name: "Your Travel Company",
        description: `Booking ID: ${bookingId}`,
        order_id: orderResult.data.orderId,
        prefill: {
          name: `${itinerary.userInfo.firstName} ${itinerary.userInfo.lastName}`,
          email: itinerary.userInfo.email,
          contact: itinerary.userInfo.phoneNumber
        },
        handler: async (response) => {
          try {
            await dispatch(
              verifyPayment({
                bookingId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              })
            ).unwrap();

            setSnackbar({
              open: true,
              message: "Payment successful! Redirecting...",
              severity: "success",
            });

            setTimeout(() => {
              navigate("/booking-confirmation", {
                state: {
                  bookingId,
                  paymentSuccess: true,
                  itinerary,
                  bookingData
                },replace: true
              });
            }, 2000);

          } catch (error) {
            setSnackbar({
              open: true,
              message: error.message || "Payment verification failed",
              severity: "error",
            });
          } finally {
            dispatch(setPaymentLoading(false));
          }
        },
        modal: {
          ondismiss: () => {
            dispatch(setPaymentLoading(false));
          }
        }
      });
      
      rzp.open();

    } catch (error) {
      console.error("Payment process error:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to process payment. Please try again.",
        severity: "error",
      });
      dispatch(setPaymentLoading(false));
    }
  }, [bookingId, dispatch, itinerary, navigate, bookingData, termsAccepted, handleReallocation]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!bookingId || !itinerary) {
      navigate("/booking-form");
    }
  }, [bookingId, itinerary, navigate]);

  const styles = {
    pageContainer: {
      minHeight: "100vh",
      py: 4,
      backgroundImage: `linear-gradient(to bottom, ${alpha(
        theme.palette.common.black,
        0.6
      )}, ${alpha(
        theme.palette.common.black,
        0.6
      )}), url('/assets/images/hero/w1.jpg')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: theme.palette.common.white,
      paddingTop: "80px",
      position: "relative",
      "&::before": {
        content: '""',
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "100px",
        background: `linear-gradient(180deg,
                ${alpha(theme.palette.common.black, 1)} 0%,
                ${alpha(theme.palette.common.black, 0.75)} 50%,
                ${alpha(theme.palette.common.black, 0.2)} 90%,
                transparent 100%
              )`,
        opacity: 0.99,
        zIndex: 999,
        pointerEvents: "none",
        transform: "translateY(-20px)",
      },
    },
    contentContainer: {
      position: "relative",
      zIndex: 1,
    },
    mainCard: {
      p: 3,
      mb: 3,
      borderRadius: 3,
      boxShadow: theme.shadows[3],
      background: alpha(theme.palette.background.paper, 0.5),
      backdropFilter: "blur(10px)",
      position: "relative",
      overflow: "hidden",
      marginRight: { xs: 0, lg: "24px" },
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      },
    },
    paymentCard: {
      p: 3,
      borderRadius: 3,
      boxShadow: theme.shadows[3],
      background: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: "blur(10px)",
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      mb: { xs: 3, lg: 0 },
      position: { xs: "static", lg: "fixed" },
      top: { lg: "100px" },
      right: { lg: "calc((100% - 1200px) / 12 + 24px)" },
      width: { xs: "100%", lg: "380px" },
      maxHeight: { lg: "calc(100vh - 120px)" },
      overflowY: { lg: "auto" },
      zIndex: { lg: 998 },
    },
    securityBadge: {
      display: "flex",
      alignItems: "center",
      gap: 1,
      color: theme.palette.success.main,
      bgcolor: alpha(theme.palette.success.main, 0.1),
      p: 1,
      borderRadius: 2,
      mb: 2,
    },
    paymentButton: {
      mt: 3,
      py: 1.5,
      borderRadius: 3,
      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
      },
      "&.Mui-disabled": {
        background: theme.palette.action.disabledBackground,
      },
    },
    securityInfo: {
      mt: 3,
      p: 2,
      borderRadius: 2,
      bgcolor: alpha(theme.palette.info.main, 0.05),
      border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}`,
    },
  };

  if (!bookingId || !itinerary) {
    return null;
  }

  return (
    <Box sx={styles.pageContainer}>
      <Container maxWidth="xl">
        <Box sx={styles.contentContainer}>
          {/* Main Content Card */}
          <Box flex={1} sx={{ 
            pr: { 
              xs: 0,
              lg: '424px' 
            } 
          }}>
            <Card sx={styles.mainCard}>
              <Stack spacing={2}>
                <Typography variant="h4" fontWeight="500">
                  Review Your Booking
                </Typography>
                <BookingSummary itinerary={itinerary} />
              </Stack>
            </Card>
          </Box>
  
          {/* Payment Card */}
          <Card sx={styles.paymentCard}>
            <Stack spacing={3}>
              <Box sx={styles.securityBadge}>
                <Lock size={20} />
                <Typography variant="body2" fontWeight="500">
                  Secure Payment
                </Typography>
              </Box>
  
              <Stack spacing={1}>
                <Typography variant="h5" fontWeight="500">
                  Payment Details
                </Typography>
  
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Booking ID
                  </Typography>
                  <Typography variant="h6">
                    {bookingId}
                  </Typography>
                </Stack>
              </Stack>
  
              <Divider />
  
              <Stack spacing={0.5}>
                <Typography variant="body1" fontWeight="500">
                  Amount to Pay
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight="600">
                  ₹{itinerary.priceTotals.grandTotal.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (Includes TCS @ {itinerary.priceTotals.tcsRate}%)
                </Typography>
              </Stack>
  
              <Divider />
  
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => dispatch(setTermsAccepted(e.target.checked))}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I accept the{' '}
                    <Button
                      color="primary"
                      onClick={() => setShowTerms(true)}
                      sx={{ p: 0, minWidth: 'auto', textTransform: 'none', textDecoration: 'underline' }}
                    >
                      terms and conditions
                    </Button>
                  </Typography>
                }
              />
  
              <Button
                fullWidth
                variant="contained"
                startIcon={<CreditCard />}
                disabled={loading || !termsAccepted}
                onClick={handlePayment}
                sx={styles.paymentButton}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
  
              <Box sx={styles.securityInfo}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Shield size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Your payment is protected by bank-level security
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Box>
      </Container>
  
      {/* Terms & Conditions Dialog */}
      <Dialog
        open={showTerms}
        onClose={() => setShowTerms(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[5],
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="500">
              Terms and Conditions
            </Typography>
            <IconButton onClick={() => setShowTerms(false)} size="small">
              <X size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                1. Booking Confirmation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Your booking will be confirmed only after successful payment
                • Prices are subject to change until payment is completed
              </Typography>
            </Box>
  
            <Box>
              <Typography variant="h6" gutterBottom>
                2. Cancellation Policy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Cancellation charges will apply as per individual service providers
                • Refunds will be processed within 7-14 business days
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
  
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            borderRadius: 2,
            boxShadow: theme.shadows[3],
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentPage;