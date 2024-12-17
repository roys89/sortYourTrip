import {
  ErrorOutline as ErrorIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  useTheme
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const SignUp = ({ handleClose }) => {
  const { register, loading, error } = useAuth();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.consent) {
      setFormError('Please accept the terms and conditions');
      return;
    }
  
    // Trim other fields, but NOT password
    const registrationData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      country: formData.country.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      countryCode: formData.countryCode.trim(),
      referralCode: formData.referralCode?.trim(),
      // Keep password as-is, without trimming
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };
  
    try {
      await register(registrationData, { redirect: false });
      handleClose?.();
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleSocialLogin = (provider) => {
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/auth/${provider}`;
  };

  const commonTextFieldProps = {
    fullWidth: true,
    disabled: loading,
    size: "medium",
    sx: {
      '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        bgcolor: 'background.paper',
      }
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        my: 2
      }}
    >
      {(error || formError) && (
        <Alert 
          severity="error"
          icon={<ErrorIcon />}
          sx={{ 
            borderRadius: 2,
            bgcolor: 'error.lighter',
            '& .MuiAlert-icon': {
              color: theme.palette.error.main
            }
          }}
        >
          {error || formError}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            {...commonTextFieldProps}
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            {...commonTextFieldProps}
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...commonTextFieldProps}
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            {...commonTextFieldProps}
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            {...commonTextFieldProps}
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            {...commonTextFieldProps}
            select
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          >
            {countries.map((country) => (
              <MenuItem key={country.code} value={country.name}>
                {country.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              {...commonTextFieldProps}
              select
              label="Code"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              sx={{ width: '40%' }}
            >
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.code}>
                  {country.code}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              {...commonTextFieldProps}
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              sx={{ width: '60%' }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            {...commonTextFieldProps}
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            {...commonTextFieldProps}
            label="Referral Code (Optional)"
            name="referralCode"
            value={formData.referralCode}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.consent}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, consent: e.target.checked }));
                  }}
                  color="primary"
                />
              }
              label={
                <span style={{ fontSize: '0.875rem' }}>
                  I agree to Sort Your Trip's{' '}
                  <a 
                    href="/terms" 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: theme.palette.primary.main }}
                  >
                    Terms of Use
                  </a>
                  {' '}and{' '}
                  <a 
                    href="/privacy" 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: theme.palette.primary.main }}
                  >
                    Privacy Policy
                  </a>
                </span>
              }
            />
          </FormControl>
        </Grid>
      </Grid>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{
          py: 1.5,
          mt: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          }
        }}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <Box sx={{ position: 'relative', my: 2 }}>
        <Divider>or</Divider>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleSocialLogin('google')}
            className="google-login-button"
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            <img 
              src="/assets/icons/google.png" 
              alt="Google" 
              style={{ width: 20, height: 20, marginRight: 8 }} 
            />
            Continue with Google
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleSocialLogin('facebook')}
            className="facebook-login-button"
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            <img 
              src="/assets/icons/facebook.png" 
              alt="Facebook" 
              style={{ width: 20, height: 20, marginRight: 8 }} 
            />
            Continue with Facebook
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SignUp;