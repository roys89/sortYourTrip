import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Paper, Stack, Typography, alpha, useTheme
} from '@mui/material';
import axios from 'axios';
import { AlertTriangle, BriefcaseIcon, CheckCircle, CheckCircleIcon, Loader2, ShoppingBagIcon, TicketIcon, X, XCircleIcon } from 'lucide-react';
import React, { useState } from 'react';

// --- NEW: Helper to format currency ---
const formatCurrency = (amount, currencyCode = 'INR') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    // Simple formatting, adjust as needed
    return `${currencyCode} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
// --- END NEW ---

// Helper to format date consistently
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    // Extract only the date part if it's a full ISO string
    const datePart = dateStr.split('T')[0];
    return new Date(datePart).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      // year: 'numeric' // Optional: Add year if needed
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

// Helper for time - ensure it handles potential full date-time strings
const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  try {
    // Check if it's a full ISO date string or just time
    const date = new Date(timeStr);
    // If parsing resulted in a valid date, format the time part
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-GB', { // Use en-GB for 24hr potentially? Or en-US with hour12: false
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    // If it's likely just a time string already (e.g., "19:30"), return as is or try simple parsing
    return timeStr; // Assuming pre-formatted time string if not a full date
  } catch (e) {
    console.error("Error formatting time:", e);
    return 'Invalid Time';
  }
};

const FlightDetailModal = ({
  flight,
  onClose,
  itineraryToken,
  inquiryToken,
  existingPrice,
  type,               // Flight type (departure/return/inter-city)
  originCityName,     // Origin city name
  destinationCityName,// Destination city name
  date,               // Flight date
  oldFlightCode        // --- NEW: Code of the flight being replaced ---
}) => {
  const theme = useTheme();
  const [bookingStatus, setBookingStatus] = useState({
    loading: false,
    success: false,
    error: null,
    message: null,
    partialSuccess: false
  });

  // --- Extract Detailed Data (adjust based on actual API response structure) ---
   const {
      airline,
      flightCode: newFlightCode, // Renamed to avoid clash if 'flightCode' was top-level
      origin, // May contain airport details now
      destination, // May contain airport details now
      departureDate: detailedDepartureDate, // Might differ from the 'date' prop if overnight
      departureTime,
      arrivalTime,
      flightDuration,
      originAirport, // Expecting objects like { code, name, city }
      arrivalAirport,
      fareDetails, // Expecting object { baseFare, taxAndSurcharge, finalFare, currency, isRefundable, isLowCost, serviceFee }
      segments = [], // Array of segment details
      fareRules, // Expecting HTML string or structured data
      seatMap = [],
      mealOptions = [],
      baggageOptions = []
   } = flight || {}; // Add default empty object

  const firstSegment = segments[0] || {};
  const checkInBaggage = firstSegment.baggage || 'N/A';
  const cabinBaggage = firstSegment.cabinBaggage || 'N/A';

  // Ancillary availability checks
  const hasSeatMap = seatMap.length > 0 && seatMap[0]?.rows?.length > 0;
  const hasMealOptions = mealOptions.length > 0 && mealOptions[0]?.options?.length > 0;
  const hasExtraBaggage = baggageOptions.length > 0 && baggageOptions[0]?.options?.length > 0;
  // --- END Data Extraction ---

  // Determine city name based on flight type
  function determineCityName() {
    switch(type) {
      case 'departure_flight':
      case 'inter_city_flight':
        return destinationCityName;
      case 'return_flight':
        return originCityName;
      default:
        console.warn('Unknown flight type:', type);
        return destinationCityName;
    }
  }

  // Helper functions (existing implementation)
  const getTimeDuration = () => {
    const duration = flight.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStops = () => {
    const stops = flight.sg.length - 1;
    return stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`;
  };

  // --- NEW: Safely get last segment arrival time --- 
  const lastSegmentArrivalTime = segments?.length > 0 ? segments[segments.length - 1]?.arrivalTime : null;
  // --- END NEW ---

  // --- REVISED: Confirmation Handler ---
  const handleConfirmReplacement = async () => {
    console.log("handleConfirmReplacement triggered");

    console.log("Props for replacement:", {
      flight,
      oldFlightCode,
      itineraryToken,
      inquiryToken,
      type,
      date
    });

    // Validation
     if (!flight || !oldFlightCode || !itineraryToken || !inquiryToken || !type || !date) {
        console.error("Replacement Error: Missing critical data", { flight, oldFlightCode, itineraryToken, inquiryToken, type, date });
        setBookingStatus({
            loading: false,
            success: false,
            error: true,
            message: "Cannot replace flight: Missing required information."
        });
        return;
    }

    console.log("Validation passed. Proceeding with replacement.");

    setBookingStatus({
      loading: true,
      success: false,
      error: null,
      message: null,
      partialSuccess: false
    });

    const targetCityName = determineCityName();

    const payload = {
      cityName: targetCityName,
      date,
      newFlightDetails: flight,
      type,
      oldFlightCode: oldFlightCode
    };
    console.log("API Payload:", payload);

    try {
      // ONLY the PUT request is needed now
      const replaceResponse = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/flight`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Use crmToken
            'X-Inquiry-Token': inquiryToken, // Still needed? Check backend requirement
            'Content-Type': 'application/json'
          }
        }
      );

       console.log("Replace flight response:", replaceResponse.data);

      if (!replaceResponse.data.success && !replaceResponse.data.partialSuccess) {
         throw new Error(replaceResponse.data.message || 'Failed to replace flight in itinerary');
      }

      setBookingStatus({
        loading: false,
        success: true, // Even partial success is considered overall success for UI feedback
        error: null,
        message: replaceResponse.data.message || "Flight replaced successfully!",
        partialSuccess: replaceResponse.data.partialSuccess || false // Track if transfers failed
      });

      // Optional: Show specific alert if transfers failed but flight was replaced
       if (replaceResponse.data.partialSuccess && replaceResponse.data.transferUpdateFailed) {
           // Use a more persistent alert mechanism if needed outside the modal lifecycle
           console.warn('Flight updated successfully, but transfers could not be updated automatically. Please check and update transfers manually if needed.');
           // Maybe set a state to show this warning prominently after modal closes
       }

       // Close modal after a short delay to show success message
       setTimeout(() => {
      onClose();
           // Optional: Trigger navigation or page refresh here if needed
           // navigate('/itinerary', { state: { itineraryToken, inquiryToken } }); // Example navigation
       }, 1500);


    } catch (error) {
      console.error('Error replacing flight:', error);
      setBookingStatus({
        loading: false,
        success: false,
        error: true,
        message: error.response?.data?.message || error.message || 'Failed to replace flight. Please try again.'
      });
    }
  };
  // --- END REVISED Handler ---

  return (
    <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
            sx: {
                borderRadius: 4,
                maxHeight: '90vh',
            }
        }}
    >
        <DialogTitle sx={{ m: 0, px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                 <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    Confirm New Flight Details
                 </Typography>
                 <IconButton
                    aria-label="close"
            onClick={onClose}
                    disabled={bookingStatus.loading}
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                 >
                    <X size={20}/>
                 </IconButton>
            </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
             <Stack spacing={3}>
                {/* Flight Summary */}
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <Grid container spacing={2} alignItems="flex-start">
                         <Grid item xs={12} sm={7}>
                             <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Airline</Typography>
                             <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {airline || 'N/A'} ({newFlightCode || 'N/A'})
                             </Typography>
                         </Grid>
                         <Grid item xs={12} sm={5} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                              {/* Display comparison if existingPrice is provided */}
                              {existingPrice && fareDetails?.finalFare && (
                                <Typography
                                    variant="h6"
                                    display="block"
                                    sx={{
                                        mb: 0.5,
                                        fontWeight: 500,
                                        color: fareDetails.finalFare > existingPrice ? theme.palette.error.main : theme.palette.success.main
                                    }}
                                >
                                   {fareDetails.finalFare > existingPrice ? '▲' : '▼'}
                                   {formatCurrency(Math.abs(fareDetails.finalFare - existingPrice), fareDetails?.currency)}
                                   {fareDetails.finalFare > existingPrice ? ' More' : ' Less'}
                                </Typography>
                               )}
                             <Typography variant="caption" color="text.secondary" display="block">New Flight Price</Typography>
             
                         </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }}/>

                     <Grid container spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
                         <Grid item xs={4}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatTime(departureTime)}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{originAirport?.code || origin?.code || 'N/A'}</Typography>
                            <Typography variant="caption" color="text.secondary">{originAirport?.name || origin?.city || ''}</Typography>
                            <Typography variant="caption" display="block" color="text.secondary">{formatDate(detailedDepartureDate || date)}</Typography>
                         </Grid>
                         <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">{flightDuration || 'N/A'}</Typography>
                            <Box sx={{ width: '60%', height: 1, bgcolor: 'divider', mx: 'auto', my: 0.5 }} />
                            <Chip label={fareDetails?.isLowCost ? 'LCC' : 'Full Service'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                         </Grid>
                         <Grid item xs={4}>
                             <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatTime(arrivalTime)}</Typography>
                             <Typography variant="body2" sx={{ fontWeight: 500 }}>{arrivalAirport?.code || destination?.code || 'N/A'}</Typography>
                             <Typography variant="caption" color="text.secondary">{arrivalAirport?.name || destination?.city || ''}</Typography>
                             <Typography variant="caption" display="block" color="text.secondary">{formatDate(lastSegmentArrivalTime)}</Typography>
                         </Grid>
                     </Grid>
                </Paper>

                {/* Fare & Baggage Details */}
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Fare & Baggage</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={0.5}>
                                {fareDetails ? (
                                    <>
                                        <Typography variant="body2"><span style={{ fontWeight: 500 }}>Base Fare:</span> {formatCurrency(fareDetails.baseFare, fareDetails.currency)}</Typography>
                                        <Typography variant="body2"><span style={{ fontWeight: 500 }}>Taxes & Surcharges:</span> {formatCurrency(fareDetails.taxAndSurcharge, fareDetails.currency)}</Typography>
                                        {fareDetails.serviceFee > 0 &&
                                            <Typography variant="body2"><span style={{ fontWeight: 500 }}>Service Fee:</span> {formatCurrency(fareDetails.serviceFee, fareDetails.currency)}</Typography>
                                        }
                                        <Typography variant="body1" sx={{ fontWeight: 600, pt: 0.5 }}><span style={{ fontWeight: 500 }}>Total:</span> {formatCurrency(fareDetails.finalFare, fareDetails.currency)}</Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">Fare details not available.</Typography>
                                )}
                            </Stack>
                        </Grid>
                         <Grid item xs={12} md={6}>
                            <Stack spacing={0.5}>
                                <Typography variant="body2"><span style={{ fontWeight: 500 }}>Check-in Baggage:</span> {checkInBaggage}</Typography>
                                <Typography variant="body2"><span style={{ fontWeight: 500 }}>Cabin Baggage:</span> {cabinBaggage}</Typography>
                                {fareDetails && (
                                    <Typography variant="body2" sx={{ color: fareDetails.isRefundable ? 'success.main' : 'error.main', display: 'flex', alignItems: 'center' }}>
                                        {fareDetails.isRefundable ?
                                            <CheckCircleIcon size={16} style={{ marginRight: 4 }}/> :
                                            <XCircleIcon size={16} style={{ marginRight: 4 }}/>
                                        }
                                        {fareDetails.isRefundable ? 'Refundable' : 'Non-Refundable'}
                                    </Typography>
                                )}
                            </Stack>
                         </Grid>
                    </Grid>
                </Paper>

          {/* Fare Rules */}
          {fareRules && (
                     <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Fare Rules</Typography>
                        <Box
                            sx={{
                                maxHeight: 150, // Limit height
                                overflowY: 'auto',
                                p: 1.5,
                                bgcolor: alpha(theme.palette.grey[500], 0.05),
                                borderRadius: 1,
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                '& table': { width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' },
                                '& th, & td': { border: `1px solid ${theme.palette.divider}`, p: 0.5, textAlign: 'center' },
                                '& th': { fontWeight: 600, bgcolor: alpha(theme.palette.grey[500], 0.1) },
                                '& span': { fontSize: '0.75rem', display: 'block', my: 0.5 }, // Basic span styling
                                fontSize: '0.8rem',
                                lineHeight: 1.4,
                            }}
                            dangerouslySetInnerHTML={{ __html: fareRules }}
                        />
                    </Paper>
                )}

                {/* Ancillaries Availability */}
                 <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Optional Add-ons</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1 }}>
                        <Chip
                            icon={<TicketIcon size={16}/>}
                            label={`Seats ${hasSeatMap ? 'Available*' : 'Unavailable'}`}
                            size="small"
                            variant="outlined"
                            color={hasSeatMap ? 'success' : 'default'}
                        />
                        <Chip
                            icon={<BriefcaseIcon size={16}/>}
                            label={`Meals ${hasMealOptions ? 'Available*' : 'Unavailable'}`}
                            size="small"
                            variant="outlined"
                            color={hasMealOptions ? 'success' : 'default'}
                        />
                        <Chip
                            icon={<ShoppingBagIcon size={16}/>}
                            label={`Extra Baggage ${hasExtraBaggage ? 'Available*' : 'Unavailable'}`}
                            size="small"
                            variant="outlined"
                            color={hasExtraBaggage ? 'success' : 'default'}
                        />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        *Specific add-ons can usually be managed after booking confirmation.
                    </Typography>
                 </Paper>

          {/* Booking Status Messages */}
                 <Box>
          {bookingStatus.error && (
                        <Alert severity="error" icon={<AlertTriangle size={18}/>}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Error Replacing Flight</Typography>
                            <Typography variant="caption">{bookingStatus.message}</Typography>
            </Alert>
          )}
          {bookingStatus.success && (
                        <Alert severity="success" icon={<CheckCircle size={18}/>}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Flight Replaced Successfully</Typography>
                            <Typography variant="caption">
                                {bookingStatus.message}
                                {bookingStatus.partialSuccess && " However, automatic transfer updates failed."}
                            </Typography>
                        </Alert>
                     )}
                     {bookingStatus.loading && (
                         <Alert severity="info" icon={<Loader2 className="animate-spin" size={18}/>}>
                             <Typography variant="body2" sx={{ fontWeight: 500 }}>Processing Replacement...</Typography>
            </Alert>
          )}
                 </Box>

             </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
             <Button
                variant="outlined"
              onClick={onClose}
                disabled={bookingStatus.loading || bookingStatus.success}
                sx={{ borderRadius: '30px' }}
            >
              Cancel
             </Button>
             <Button
                variant="contained"
                onClick={handleConfirmReplacement}
                disabled={bookingStatus.loading || bookingStatus.success}
                startIcon={bookingStatus.loading ? <Loader2 className="animate-spin" size={18}/> : bookingStatus.success ? <CheckCircle size={18}/> : null}
                sx={{ minWidth: 150 ,
                borderRadius: '30px'}
              
              }
             >
                 {bookingStatus.loading ? 'Replacing...' : bookingStatus.success ? 'Replaced' : 'Confirm & Replace'}
             </Button>
        </DialogActions>
    </Dialog>
  );
};

export default FlightDetailModal;