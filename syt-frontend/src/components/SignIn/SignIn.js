// SignIn.js
import {
  Alert,
  Box,
  Button,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../redux/slices/authSlice';
import './SignIn.css';

const SignIn = ({ handleClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { loading, error } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      handleClose();
    } catch (err) {
      console.error('Sign In Error:', err);
    }
  };

  const handleGoogleLogin = () => {
    // Add Google login logic
  };

  const handleFacebookLogin = () => {
    // Add Facebook login logic
  };

  return (
    <Box 
      className="sign-in-container"
      sx={{
        width: '100%',
        padding: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '320px',
          margin: '0 auto',
        }}
      >
        <Typography 
          component="h1" 
          variant="h5" 
          sx={{ 
            textAlign: 'center',
            mb: 3
          }}
        >
          Sign In
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSignIn} 
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            sx={{ mb: 1 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            sx={{ mb: 1 }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleLogin}
            className="google-login-button"
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <img src="/assets/icons/google.png" alt="Google" className="social-icon" />
            Continue with Google
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleFacebookLogin}
            className="facebook-login-button"
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <img src="/assets/icons/facebook.png" alt="Facebook" className="social-icon" />
            Continue with Facebook
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
export default SignIn;