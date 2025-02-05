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
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSummary from "../../components/BookingSummary/BookingSummary";
import {
  createPaymentOrder,
  setTermsAccepted,
  verifyPayment,
} from "../../redux/slices/paymentSlice";
import "./PaymentPage.css";

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

  // Style definitions using MUI's latest patterns
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
      // Only add margin on desktop
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
      mb: { xs: 3, lg: 0 }, // Add bottom margin on mobile
      // Fixed positioning only on desktop
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

  // Handle Razorpay payment
  const handlePayment = useCallback(async () => {
    if (!termsAccepted) {
      setSnackbar({
        open: true,
        message: "Please accept the terms and conditions",
        severity: "warning",
      });
      return;
    }
  
    try {
      const orderResult = await dispatch(
        createPaymentOrder({
          bookingId,
          amount: itinerary.priceTotals.grandTotal,
          itinerary
        })
      ).unwrap();
  
      // Configure Razorpay options
      const options = {
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
                }
              });
            }, 2000);
  
          } catch (error) {
            setSnackbar({
              open: true,
              message: error.message || "Payment verification failed",
              severity: "error",
            });
          }
        },
        modal: {
          ondismiss: function() {
            setSnackbar({
              open: true,
              message: "Payment cancelled",
              severity: "info",
            });
          },
        },
        theme: {
          color: theme.palette.primary.main,
        },
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
  
    } catch (error) {
      console.error("Payment initialization error:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to initialize payment",
        severity: "error",
      });
    }
  }, [
    bookingId,
    dispatch,
    itinerary,
    navigate,
    termsAccepted,
    theme.palette.primary.main,
  ]);

  useEffect(() => {
    if (!bookingId || !itinerary) {
      navigate("/booking-form");
    }
  }, [bookingId, itinerary, navigate]);

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
              lg: '424px' // 380px (card width) + 24px (gap)
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
