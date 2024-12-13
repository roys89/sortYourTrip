// src/components/SignUp/SignUp.js
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../redux/slices/authSlice';
import './SignUp.css';

const SignUp = ({ handleClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { loading, error } = useSelector(state => state.auth);

  // States
  const [countries, setCountries] = useState([]);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    country: '',
    phoneNumber: '',
    countryCode: '',
    referralCode: '',
    consent: false,
  });

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/countries');
        setCountries(response.data);
      } catch (error) {
        console.error('Error fetching countries:', error);
        setFormError('Failed to load country data');
      }
    };
    fetchCountries();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(''); // Clear form error when user types
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const country = countries.find((c) => c.name === selectedCountry);
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: country.name,
        countryCode: country.code,
      }));
    }
  };

  const handleCountryCodeChange = (e) => {
    const selectedCountryCode = e.target.value;
    const country = countries.find((c) => c.code === selectedCountryCode);
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: country.name,
        countryCode: selectedCountryCode,
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('Please enter your full name');
      return false;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    if (!formData.dob) {
      setFormError('Please enter your date of birth');
      return false;
    }

    if (!formData.consent) {
      setFormError('You must agree to the Terms of Use and Privacy Policy');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const registrationData = {
        ...formData,
        // Remove confirm password before sending to API
        confirmPassword: undefined
      };

      await dispatch(register(registrationData)).unwrap();
      handleClose();
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google login
    console.log("Google Login");
  };

  const handleFacebookLogin = () => {
    // Implement Facebook login
    console.log("Facebook Login");
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        boxSizing: 'border-box',
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Grid 
          container 
          spacing={2}
          sx={{ 
            width: '100%',
            m: 0,
            p: 0,
            '& .MuiGrid-item': {
              pl: { xs: 1, sm: 2 },
              pr: { xs: 1, sm: 2 },
              width: '100%',
            }
          }}
        >
          <Grid item xs={12}>
            <Typography 
              variant="h5" 
              align="center"
              sx={{ mb: 2 }}
            >
              Create Account
            </Typography>
          </Grid>
  
          {(error || formError) && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2, mx: { xs: 1, sm: 0 } }}>
                {error || formError}
              </Alert>
            </Grid>
          )}
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="password"
              type="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="country"
              select
              label="Country"
              value={formData.country}
              onChange={handleCountryChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            >
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.name}>
                  {country.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="countryCode"
              select
              label="Country Code"
              value={formData.countryCode}
              onChange={handleCountryCodeChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            >
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.code}>
                  {country.code}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="phoneNumber"
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="dob"
              type="date"
              label="Date of Birth"
              InputLabelProps={{ shrink: true }}
              value={formData.dob}
              onChange={handleChange}
              required
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12} sm={6}>
            <TextField
              name="referralCode"
              label="Referral Code"
              value={formData.referralCode}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              sx={{ width: '100%' }}
            />
          </Grid>
  
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.consent}
                  onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                  color="primary"
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  By signing up, I agree to{' '}
                  <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">
                    Sort Your Trip's Terms of Use
                  </a>
                  {' '}and{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </Typography>
              }
              sx={{ ml: 0 }}
            />
          </Grid>
  
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 1, mb: 2 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Grid>
  
          <Grid item xs={12}>
            <Grid container spacing={2} sx={{ px: { xs: 0, sm: 1 } }}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="google-login-button"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    width: '100%'
                  }}
                >
                  <img src="/assets/icons/google.png" alt="Google" className="social-icon" />
                  Continue with Google
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                  className="facebook-login-button"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    width: '100%'
                  }}
                >
                  <img src="/assets/icons/facebook.png" alt="Facebook" className="social-icon" />
                  Continue with Facebook
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default SignUp;