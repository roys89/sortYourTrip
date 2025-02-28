import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import {
    Box,
    Button,
    Chip,
    Grid,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { Download } from 'lucide-react';
import React from 'react';

const TransferVoucher = () => {
    const voucherData = window.history.state?.usr?.voucherData;
    
    if (!voucherData?.data?.data) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Typography variant="h6" color="text.secondary">No voucher data available</Typography>
        </Box>
      );
    }

  const transfer = voucherData.data.data;

  const formatDateTime = (date, time) => {
    if (!date) return '';
    const datetime = new Date(`${date}T${time}`);
    return datetime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
              Transfer Voucher
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip 
                  icon={<PaymentIcon />}
                  label={`Payment: ${transfer.payment_status === 1 ? 'Paid' : 'Pending'}`}
                  color={transfer.payment_status === 1 ? 'success' : 'warning'}
                  size="small"
                />
                <Chip 
                  label={transfer.journey_type.toUpperCase()}
                  color="primary"
                  size="small"
                />
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Vehicle and Booking Details */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
          <Grid container spacing={4}>
            {/* Vehicle Details */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsCarIcon color="primary" />
                  <Typography variant="h6">Vehicle Details</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Vehicle Class</Typography>
                  <Typography variant="body1" fontWeight="500">{transfer.vehicle.class}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Capacity</Typography>
                  <Typography variant="body1" fontWeight="500">{transfer.vehicle.capacity} Passengers</Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Booking Details */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon color="primary" />
                  <Typography variant="h6">Booking Details</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                  <Typography variant="body1" fontWeight="500">
                    {formatDateTime(transfer.booking_date, transfer.booking_time)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Booking Created</Typography>
                  <Typography variant="body1" fontWeight="500">
                    {new Date(transfer.created_date).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Journey Details */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <LocationOnIcon color="primary" />
            <Typography variant="h6">Journey Details</Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Pick-up Location</Typography>
              <Typography variant="body1" fontWeight="500">{transfer.from}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Drop-off Location</Typography>
              <Typography variant="body1" fontWeight="500">{transfer.to}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Guest Details */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6">Guest Details</Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Guest Name</Typography>
              <Typography variant="body1" fontWeight="500">{transfer.guest_name}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Contact Number</Typography>
              <Typography variant="body1" fontWeight="500">{transfer.guest_phone}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Number of Passengers</Typography>
              <Typography variant="body1" fontWeight="500">{transfer.passengers}</Typography>
            </Grid>
            {transfer.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Notes</Typography>
                <Typography variant="body1" fontWeight="500">{transfer.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Payment Details */}
        {/* <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <LocalAtmIcon color="primary" />
            <Typography variant="h6">Payment Details</Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Amount</Typography>
              <Typography variant="body1" fontWeight="500">{transfer.currency_fare}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Payment Method</Typography>
              <Typography variant="body1" fontWeight="500" sx={{ textTransform: 'capitalize' }}>
                {transfer.payment_method}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Payment Status</Typography>
              <Chip 
                label={transfer.payment_status === 1 ? 'Paid' : 'Pending'}
                color={transfer.payment_status === 1 ? 'success' : 'warning'}
                size="small"
              />
            </Grid>
          </Grid>
        </Paper> */}

        {/* Terms & Conditions */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: '#e3f2fd' }}>
          <Typography variant="h6" gutterBottom>Terms & Conditions</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              • Please be ready at the pickup location 10 minutes before the scheduled time
            </Typography>
            <Typography variant="body2">
              • Carry a valid ID proof during the journey
            </Typography>
            <Typography variant="body2">
              • Cancellation: {transfer.is_cancel_allow ? 'Allowed' : 'Not Allowed'}
            </Typography>
            <Typography variant="body2">
              • Amendment: {transfer.is_amend_allow ? 'Allowed' : 'Not Allowed'}
            </Typography>
            <Typography variant="body2">
              • Additional waiting charges may apply for delays
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

export default TransferVoucher;