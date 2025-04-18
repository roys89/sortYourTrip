// src/pages/Payment/PaymentPage.js
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    Paper,
    Snackbar,
    Stack,
    Typography,
    alpha,
    useTheme
} from "@mui/material";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    CreditCard,
    FileText,
    Receipt,
    Shield,
    Wallet,
    X
} from "lucide-react";
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


// Dialog Components
const ErrorDialog = ({ components, onClose }) => {
  const theme = useTheme();
  
  return (
    <Dialog 
      open={true} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: "16px",
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: alpha(theme.palette.error.main, 0.05),
        py: 2.5,
        px: 3,
        borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            }}
          >
            <AlertTriangle size={20} style={{ color: theme.palette.error.main }} />
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "Montserrat", fontWeight: 600 }}>
            Components Need Reallocation
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Some components require immediate reallocation due to errors:
        </Typography>
        
        <Stack spacing={2} sx={{ mb: 3 }}>
          {components.map((component, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "10px",
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                backgroundColor: alpha(theme.palette.error.main, 0.05),
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {component.type === 'flight' 
                  ? `Flight: ${component.flight.flightData.origin} → ${component.flight.flightData.destination}` 
                  : `Hotel: ${component.hotel.data.hotelDetails.name}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {component.error?.message || 'Validation error occurred'}
              </Typography>
            </Paper>
          ))}
        </Stack>
        
        <Button 
          variant="contained" 
          fullWidth
          size="large"
          onClick={() => onClose(true)}
          endIcon={<ArrowRight size={18} />}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: "#fff",
            borderRadius: "10px",
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            transition: "all 0.2s ease",
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
              transform: "translateY(-2px)",
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            }
          }}
        >
          Proceed to Reallocation
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const ImmediateDialog = ({ components, onClose }) => {
  const theme = useTheme();
  
  return (
    <Dialog 
      open={true} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: "16px",
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: alpha(theme.palette.warning.main, 0.05),
        py: 2.5,
        px: 3,
        borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <AlertTriangle size={20} style={{ color: theme.palette.warning.main }} />
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "Montserrat", fontWeight: 600 }}>
            Immediate Reallocation Required
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          These components need immediate reallocation (less than 2 minutes remaining):
        </Typography>
        
        <Stack spacing={2} sx={{ mb: 3 }}>
          {components.map((component, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "10px",
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                backgroundColor: alpha(theme.palette.warning.main, 0.05),
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {component.type === 'flight' 
                  ? `Flight: ${component.origin} → ${component.destination}` 
                  : `Hotel: ${component.name}`}
              </Typography>
              {component.remainingTime !== null && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    display: "inline-block",
                    px: 1, 
                    py: 0.5, 
                    borderRadius: "16px",
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    fontWeight: 500
                  }}
                >
                  {component.remainingTime} minute{component.remainingTime !== 1 ? 's' : ''} remaining
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
        
        <Button 
          variant="contained" 
          fullWidth
          size="large"
          onClick={() => onClose(true)}
          endIcon={<ArrowRight size={18} />}
          color="warning"
          sx={{
            borderRadius: "10px",
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 6px 20px ${alpha(theme.palette.warning.main, 0.4)}`,
            }
          }}
        >
          Proceed to Reallocation
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const WarningDialog = ({ components, onClose }) => {
  const theme = useTheme();
  
  return (
    <Dialog 
      open={true} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: "16px",
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: alpha(theme.palette.warning.main, 0.05),
        py: 2.5,
        px: 3,
        borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <AlertTriangle size={20} style={{ color: theme.palette.warning.main }} />
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "Montserrat", fontWeight: 600 }}>
            Limited Time Warning
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          These components have limited time remaining:
        </Typography>
        
        <Stack spacing={2} sx={{ mb: 3 }}>
          {components.map((component, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "10px",
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                backgroundColor: alpha(theme.palette.warning.main, 0.05),
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {component.type === 'flight' 
                  ? `Flight: ${component.origin} → ${component.destination}` 
                  : `Hotel: ${component.name}`}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: "inline-block",
                  px: 1, 
                  py: 0.5, 
                  borderRadius: "16px",
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  fontWeight: 500
                }}
              >
                {component.remainingTime} minutes remaining
              </Typography>
            </Paper>
          ))}
        </Stack>
        
        <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
          Can you complete the payment within 2 minutes?
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            onClick={() => onClose(false)}
            size="large"
            startIcon={<X size={18} />}
            sx={{
              flex: 1,
              borderColor: alpha(theme.palette.text.primary, 0.2),
              color: theme.palette.text.primary,
              borderRadius: "10px",
              py: 1.5,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                borderColor: theme.palette.text.primary,
                backgroundColor: alpha(theme.palette.text.primary, 0.05),
              }
            }}
          >
            No, Reallocate
          </Button>
          <Button 
            variant="contained" 
            onClick={() => onClose(true)}
            size="large"
            color="primary"
            endIcon={<CheckCircle2 size={18} />}
            sx={{
              flex: 1,
              borderRadius: "10px",
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Yes, Continue
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

const InfoDialog = ({ components, onClose }) => {
  const theme = useTheme();
  
  return (
    <Dialog 
      open={true} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: "16px",
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: alpha(theme.palette.info.main, 0.05),
        py: 2.5,
        px: 3,
        borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: alpha(theme.palette.info.main, 0.1),
            }}
          >
            <AlertTriangle size={20} style={{ color: theme.palette.info.main }} />
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "Montserrat", fontWeight: 600 }}>
            Time Information
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please note the remaining time for these components:
        </Typography>
        
        <Stack spacing={2} sx={{ mb: 3 }}>
          {components.map((component, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "10px",
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {component.type === 'flight' 
                  ? `Flight: ${component.origin} → ${component.destination}` 
                  : `Hotel: ${component.name}`}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: "inline-block",
                  px: 1, 
                  py: 0.5, 
                  borderRadius: "16px",
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  fontWeight: 500
                }}
              >
                {component.remainingTime} minutes remaining
              </Typography>
            </Paper>
          ))}
        </Stack>
        
        <Button 
          variant="contained" 
          fullWidth
          size="large"
          onClick={() => onClose(true)}
          endIcon={<ArrowRight size={18} />}
          color="info"
          sx={{
            borderRadius: "10px",
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 6px 20px ${alpha(theme.palette.info.main, 0.4)}`,
            }
          }}
        >
          Proceed with Payment
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const PaymentPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const { termsAccepted, loading } = useSelector((state) => state.payment);
  const { priceSummary } = useSelector((state) => state.priceCheck);

  const [showTerms, setShowTerms] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Extract tokens from URL parameters or location state
  const itineraryToken = searchParams.get('itineraryToken') || location.state?.itinerary?.itineraryToken;
  const inquiryToken = searchParams.get('inquiryToken') || location.state?.itinerary?.inquiryToken;
  const { bookingId, bookingData } = location.state || {};
  const itinerary = location.state?.itinerary || priceSummary?.updatedItinerary;

  useEffect(() => {
    if (!itineraryToken || !inquiryToken) {
      const params = new URLSearchParams({
        error: 'Missing required tokens. Please start a new itinerary.'
      });
      navigate(`/itinerary?${params.toString()}`);
    }
  }, [itineraryToken, inquiryToken, navigate]);

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
                inquiryToken
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
                itineraryToken,
                cityName,
                date: component.flight.flightData.departureDate,
                newFlightDetails: searchResult[0],
                type: component.flight.flightData.type || 'departure_flight',
                inquiryToken
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
                inquiryToken
              })
            ).unwrap();

            if (!searchResult || !searchResult.data) {
              throw new Error('No replacement hotels found');
            }

            // 2. Update itinerary with new hotel
            const updateResult = await dispatch(
              updateItineraryHotel({
                itineraryToken,
                date: component.hotel.data.searchRequestLog.checkIn || component.hotel.data.hotelDetails.checkIn,
                newHotelDetails: searchResult.data,
                checkIn: component.hotel.data.checkIn || component.hotel.data.hotelDetails.checkIn,
                checkout: component.hotel.data.checkOut || component.hotel.data.hotelDetails.checkOut,
                inquiryToken
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

      // Navigate to itinerary page with results and URL parameters
      const params = new URLSearchParams({
        itineraryToken,
        inquiryToken
      });
      navigate(`/itinerary?${params.toString()}`, {
        state: {
          reason: "Components need reallocation",
          reallocationResults: successfulReallocations,
          failedReallocations
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
  }, [dispatch, itinerary, navigate, itineraryToken, inquiryToken]);

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
        name: "SortYourTrip",
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
                  itinerary: {         // Keep the minimal required itinerary info
                    itineraryToken: itinerary.itineraryToken,
                    inquiryToken: itinerary.inquiryToken
                  },
                  bookingData        // Keep the full booking data
                },
                replace: true
              });
            }, 1000);

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

  if (!bookingId || !itinerary) {
    return null;
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: theme.palette.grey[50],
        minHeight: "100vh",
        py: 5,
        pt: { xs: 10, md: 8 }
      }}
    >
      <Container maxWidth="xl">
        

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={7} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  mb: 4
                }}
              >
                <Box 
                  sx={{ 
                    p: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    display: "flex",
                    alignItems: "center",
                    height: 86
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <Receipt size={22} style={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontFamily: "Montserrat", 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Complete Your Payment
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ p: 3 }}>
                  <BookingSummary itinerary={itinerary} />
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Payment Card */}
          <Grid item xs={12} md={5} lg={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ position: "sticky" }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 8px 40px ${alpha(theme.palette.common.black, 0.06)}`,
                  height: "100%"
                }}
              >
                {/* Header */}
                <Box 
                  sx={{ 
                    p: 3, 
                    backgroundColor: theme.palette.primary.main,
                    display: "flex",
                    alignItems: "center",
                    height: 86
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        backgroundColor: alpha(theme.palette.common.white, 0.2),
                      }}
                    >
                      <CreditCard size={22} style={{ color: theme.palette.common.white }} />
                    </Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontFamily: "Montserrat", 
                        fontWeight: 600,
                        color: theme.palette.common.white,
                      }}
                    >
                      Payment Details
                    </Typography>
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3 }}>
                  {/* Security Badge */}
                  <Box 
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1.5,
                      p: 2,
                      mb: 3,
                      borderRadius: "12px",
                      backgroundColor: alpha(theme.palette.success.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                        }}
                      >
                        <img 
                          src="/assets/images/razorpay-logo.png" 
                          alt="Razorpay" 
                          style={{ 
                            width: '24px', 
                            height: '24px',
                            objectFit: 'contain' 
                          }} 
                        />
                      </Box>
                      <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                        Secure Payment via Razorpay
                      </Typography>
                    </Box>
                    </Box>
                  </Box>

                  {/* Booking ID */}
                  <Box 
                    sx={{ 
                      p: 2,
                      mb: 3,
                      borderRadius: "12px",
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        mb: 0.5
                      }}
                    >
                      Booking ID
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontFamily: "Montserrat",
                        fontWeight: 600
                      }}
                    >
                      {bookingId}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Payment Amount */}
                  <Box sx={{ mb: 3 }}>
                    <Grid container alignItems="center" justifyContent="space-between">
                      <Grid item>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500
                          }}
                        >
                          Subtotal
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600
                          }}
                        >
                          ₹{itinerary.priceTotals.subtotal.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Grid container alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
                      <Grid item>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary
                          }}
                        >
                          TCS ({itinerary.priceTotals.tcsRate}%)
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500
                          }}
                        >
                          ₹{itinerary.priceTotals.tcsAmount.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Total Amount */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: "12px",
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      mb: 3
                    }}
                  >
                    <Grid container alignItems="center" justifyContent="space-between">
                      <Grid item>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Wallet size={20} style={{ color: theme.palette.primary.main }} />
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Total Amount
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 700
                          }}
                        >
                          ₹{itinerary.priceTotals.grandTotal.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Terms & Payment Button */}
                  <Box sx={{ mt: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={termsAccepted}
                          onChange={(e) => dispatch(setTermsAccepted(e.target.checked))}
                          color="primary"
                          sx={{ 
                            '&.Mui-checked': {
                              color: theme.palette.primary.main,
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          I accept the{' '}
                          <Button
                            color="primary"
                            onClick={() => setShowTerms(true)}
                            sx={{ 
                              p: 0, 
                              minWidth: 'auto', 
                              textTransform: 'none', 
                              textDecoration: 'underline',
                              fontWeight: 500,
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              }
                            }}
                          >
                            terms and conditions
                          </Button>
                        </Typography>
                      }
                    />

                    <Button
                      fullWidth
                      variant="contained"
                      disabled={loading || !termsAccepted}
                      onClick={handlePayment}
                      endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CreditCard size={20} />}
                      sx={{
                        mt: 3,
                        py: 1.5,
                        borderRadius: "10px",
                        backgroundColor: theme.palette.primary.main,
                        color: "#fff",
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "1rem",
                        transition: "all 0.3s ease",
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                        "&:hover": {
                          backgroundColor: theme.palette.primary.dark,
                          transform: "translateY(-3px)",
                          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                        },
                        "&.Mui-disabled": {
                          backgroundColor: alpha(theme.palette.action.disabled, 0.24),
                        }
                      }}
                    >
                      {loading ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                  </Box>

                  {/* Security Notice */}
                  <Box 
                    sx={{ 
                      mt: 3,
                      p: 2,
                      borderRadius: "10px",
                      border: `1px dashed ${alpha(theme.palette.text.secondary, 0.2)}`,
                      backgroundColor: alpha(theme.palette.background.default, 0.5),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Shield size={20} style={{ color: theme.palette.text.secondary }} />
                      <Typography variant="body2" color="text.secondary">
                        Payments are secured with bank-level encryption and security measures.
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Terms & Conditions Dialog */}
      <Dialog
        open={showTerms}
        onClose={() => setShowTerms(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: `0 15px 50px ${alpha(theme.palette.common.black, 0.15)}`,
            overflow: "hidden"
          },
        }}
      >
        <DialogTitle sx={{ 
          py: 2.5,
          px: 3,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <FileText size={20} style={{ color: theme.palette.primary.main }} />
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: "Montserrat", 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Terms and Conditions
              </Typography>
            </Box>
            
            <IconButton 
              onClick={() => setShowTerms(false)} 
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.divider, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.divider, 0.2),
                }
              }}
            >
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={4}>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  pb: 1,
                  fontFamily: "Montserrat",
                  fontWeight: 600,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                }}
              >
                1. Booking Confirmation
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box 
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.primary.main,
                      mt: 1.2
                    }}
                  />
                  <Typography variant="body1">
                    Your booking will be confirmed only after successful payment.
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box 
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.primary.main,
                      mt: 1.2
                    }}
                  />
                  <Typography variant="body1">
                    Prices are subject to change until payment is completed.
                  </Typography>
                </Box>
              </Stack>
            </Box>
  
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  pb: 1,
                  fontFamily: "Montserrat",
                  fontWeight: 600,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                }}
              >
                2. Cancellation Policy
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box 
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.primary.main,
                      mt: 1.2
                    }}
                  />
                  <Typography variant="body1">
                    Cancellation charges will apply as per individual service providers.
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Box 
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.primary.main,
                      mt: 1.2
                    }}
                  />
                  <Typography variant="body1">
                    Refunds will be processed within 7-14 business days.
                  </Typography>
                </Box>
              </Stack>
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
            borderRadius: "12px",
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentPage;