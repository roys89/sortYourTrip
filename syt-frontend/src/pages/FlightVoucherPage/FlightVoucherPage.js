import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import LuggageIcon from '@mui/icons-material/Luggage';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Download } from 'lucide-react';
import React from 'react';

const FlightVoucher = () => {
  const voucherData = window.history.state?.usr?.voucherData;
  
  // Add comprehensive null checks
  if (!voucherData?.data?.booking_details?.flight_itinerary?.responseData?.results) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="text.secondary">No voucher data available</Typography>
      </Box>
    );
  }

  const results = voucherData.data.booking_details.flight_itinerary.responseData.results;
  const itineraryItems = results.itineraryItems;
  
  // Check if itineraryItems exists and has items
  if (!itineraryItems || !itineraryItems.length || !itineraryItems[0].itemFlight) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="text.secondary">Flight details not found</Typography>
      </Box>
    );
  }

  const flight = itineraryItems[0].itemFlight;
  
  // Check if segments exist and have data
  if (!flight.segments || !flight.segments.length || !flight.segments[0] || !flight.segments[0].length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="text.secondary">Flight segment details not found</Typography>
      </Box>
    );
  }

  const segment = flight.segments[0][0];
  const passengers = results.passengers || [];

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3, mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, pb: 2, borderBottom: '1px solid #eee' }}>
          <Box>
            <Typography variant="h4" gutterBottom color="primary">
              Flight Voucher
            </Typography>
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Booking ID: {voucherData.data.booking_details.bmsBookingCode}
              </Typography>
              <Typography variant="subtitle2">
                PNR: {flight.pnr || 'N/A'}
              </Typography>
              <Chip 
                label={voucherData.data.booking_details.bookingStatus} 
                color="success" 
                size="small"
              />
            </Stack>
          </Box>
        </Box>

        {/* Flight Details */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AirplanemodeActiveIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              {flight.airlineName} {flight.flightNumber}
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={5}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FlightTakeoffIcon color="primary" />
                  <Typography variant="h6">{segment.or?.cN} ({segment.or?.aC})</Typography>
                </Stack>
                <Typography variant="body2">{segment.or?.aN}</Typography>
                <Typography variant="h6" color="primary">{formatTime(segment.or?.dT)}</Typography>
                <Typography variant="body2">{segment.or?.dT ? new Date(segment.or.dT).toDateString() : ''}</Typography>
              </Box>
            </Grid>

            <Grid item xs={2}>
              <Box textAlign="center">
                <Divider>
                  <Chip 
                    icon={<AccessTimeIcon />} 
                    label={`${segment.dr || 0} mins`} 
                    size="small" 
                  />
                </Divider>
              </Box>
            </Grid>

            <Grid item xs={5}>
              <Box textAlign="right">
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
                  <Typography variant="h6">{segment.ds?.cN} ({segment.ds?.aC})</Typography>
                  <FlightLandIcon color="primary" />
                </Stack>
                <Typography variant="body2">{segment.ds?.aN}</Typography>
                <Typography variant="h6" color="primary">{formatTime(segment.ds?.aT)}</Typography>
                <Typography variant="body2">{segment.ds?.aT ? new Date(segment.ds.aT).toDateString() : ''}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Passenger Details */}
        {passengers.length > 0 && (
          <Paper elevation={1} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              Passenger Details
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Passenger Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Ticket Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Seat</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Meal Preference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {passengers.map((passenger, index) => (
                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'grey.50' } }}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {passenger.title} {passenger.firstName} {passenger.lastName}
                          </Typography>
                          {passenger.isLeadPax && (
                            <Chip 
                              label="Lead Passenger" 
                              size="small" 
                              color="primary" 
                              sx={{ mt: 1 }} 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {passenger.paxFare?.ticketNumber || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {passenger.ssr?.seat?.[0] ? (
                          <Chip 
                            icon={<AirlineSeatReclineNormalIcon />}
                            label={passenger.ssr.seat[0].code}
                            size="small"
                            sx={{ minWidth: '70px' }}
                          />
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {passenger.ssr?.meal?.[0]?.dsc || 'No meal selected'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Additional Services */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Baggage */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <LuggageIcon color="primary" />
                <Typography variant="h6">Baggage Allowance</Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Cabin</Typography>
                  <Typography variant="body1">{segment.cBg || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Check-in</Typography>
                  <Typography variant="body1">{segment.bg || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Add-ons Summary */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Add-ons</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Meal: {results.addONs?.meal?.count ? 'Selected' : 'Not selected'}
                </Typography>
                <Typography variant="body2">
                  Seat: {results.addONs?.seat?.count ? 'Selected' : 'Not selected'}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Fare Rules */}
        {flight.fareRule && flight.fareRule.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Fare Rules</Typography>
            <Box 
              dangerouslySetInnerHTML={{ __html: flight.fareRule[0].fareRuleDetail }}
              sx={{ 
                '& li': { listStyle: 'none', mb: 1 },
                '& span': { display: 'inline-block', mb: 0.5 }
              }}
            />
          </Paper>
        )}

        {/* Terms & Conditions */}
        <Paper elevation={1} sx={{ p: 2, mb: 4, bgcolor: '#e3f2fd' }}>
          <Typography variant="h6" gutterBottom>Terms & Conditions</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              • All Passengers must carry a Valid Photo Identity Proof at the time of Check-in (Driving License, Passport, PAN Card, Voter ID Card or any other ID issued by the Government of India)
            </Typography>
            <Typography variant="body2">
              • For infant passengers, Date of Birth certificate is mandatory
            </Typography>
            <Typography variant="body2">
              • Reach the terminal at least 2 hours prior for domestic and 4 hours prior for international flights
            </Typography>
            <Typography variant="body2">
              • Flight timings are subject to change without prior notice. Please recheck with the carrier before departure
            </Typography>
            <Typography variant="body2">
              • Web Check-in: {flight.webCheckInUrl || 'Not available'}
            </Typography>
          </Stack>
        </Paper>

        {/* Print Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }} className="print:hidden">
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handlePrint}
            size="large"
          >
            Download Voucher
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default FlightVoucher;