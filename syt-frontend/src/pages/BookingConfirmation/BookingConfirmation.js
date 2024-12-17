// pages/BookingConfirmation/BookingConfirmation.js
import { ArrowBack, Check } from '@mui/icons-material';
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    Typography
} from '@mui/material';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Summary from '../../components/BookingSummary/BookingSummary';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingData, itinerary } = location.state || {};

  if (!bookingData) {
    navigate('/');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Check
            color="success"
            sx={{ fontSize: 64, mb: 2 }}
          />
          <Typography variant="h4" gutterBottom>
            Booking Confirmed!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your booking has been successfully confirmed.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Summary itinerary={itinerary} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Booking Reference:
              </Typography>
              <Typography variant="h6">
                {bookingData._id}
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{ mt: 4 }}
              fullWidth
            >
              Back to Home
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default BookingConfirmation;