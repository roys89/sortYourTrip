// src/components/BookingForm/BookingForm.js
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

const BookingForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get auth and itinerary state from Redux
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { data: reduxItinerary } = useSelector((state) => state.itinerary);
  
  // Get itinerary either from location state or redux
  const locationItinerary = location.state?.itinerary;
  const bookingItinerary = locationItinerary || reduxItinerary;

  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    weight: '',
    height: '',
    dateOfBirth: '',
    age: '',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    preferredLanguage: '',
    specialRequirements: '',
    foodPreference: ''
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated or no itinerary
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    if (!bookingItinerary) {
      console.log('No itinerary data found, redirecting...');
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, bookingItinerary, navigate, location.pathname]);

  // Calculate age when date of birth changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }
  }, [formData.dateOfBirth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'passportNumber',
      'passportIssueDate',
      'passportExpiryDate',
      'preferredLanguage',
      'foodPreference'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        ...formData,
        itineraryToken: bookingItinerary.itineraryToken,
        priceTotals: bookingItinerary.priceTotals,
        travelersDetails: bookingItinerary.travelersDetails,
        userId: user?.id // Include user ID if needed
      };
      
      // Make booking API call
      const response = await axios.post('/api/bookings', bookingData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess(true);
      
      // Wait for snackbar to show before redirecting
      setTimeout(() => {
        navigate('/booking-confirmation', {
          state: { 
            booking: response.data,
            itinerary: bookingItinerary
          }
        });
      }, 1500);
    } catch (error) {
      console.error('Booking failed:', error);
      setError(error.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !bookingItinerary) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Complete Your Booking
        </Typography>

        {bookingItinerary.priceTotals && (
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Booking Total: ₹{bookingItinerary.priceTotals.grandTotal.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              TCS ({bookingItinerary.priceTotals.tcsRate}%): 
              ₹{bookingItinerary.priceTotals.tcsAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Weight (kg)"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Height (cm)"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                value={formData.age}
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Passport Number"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Passport Issue Date"
                name="passportIssueDate"
                type="date"
                value={formData.passportIssueDate}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Passport Expiry Date"
                name="passportExpiryDate"
                type="date"
                value={formData.passportExpiryDate}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Preferred Language</InputLabel>
                <Select
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  label="Preferred Language"
                  disabled={loading}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                  <MenuItem value="Arabic">Arabic</MenuItem>
                  <MenuItem value="Spanish">Spanish</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Food Preference</InputLabel>
                <Select
                  name="foodPreference"
                  value={formData.foodPreference}
                  onChange={handleChange}
                  label="Food Preference"
                  disabled={loading}
                >
                  <MenuItem value="Vegetarian">Vegetarian</MenuItem>
                  <MenuItem value="Non-Vegetarian">Non-Vegetarian</MenuItem>
                  <MenuItem value="Vegan">Vegan</MenuItem>
                  <MenuItem value="Halal">Halal</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Requirements"
                name="specialRequirements"
                multiline
                rows={4}
                value={formData.specialRequirements}
                onChange={handleChange}
                disabled={loading}
                placeholder="Any special requirements or medical conditions we should know about?"
              />
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Back to Itinerary
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Book Now'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={1500}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Booking successful! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookingForm;