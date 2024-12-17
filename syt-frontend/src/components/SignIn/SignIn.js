import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../redux/slices/authSlice';

const SignIn = ({ handleClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <Box
      component="form"
      onSubmit={handleSignIn}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        my: 2
      }}
    >
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            bgcolor: 'error.lighter'
          }}
        >
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        disabled={loading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
          }
        }}
      />

      <TextField
        fullWidth
        label="Password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange}
        disabled={loading}
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
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
          }
        }}
      />

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
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <Box sx={{ position: 'relative', my: 2 }}>
        <Divider>or</Divider>
      </Box>

      <Button
        fullWidth
        variant="outlined"
        onClick={() => window.location.href = '/auth/google'}
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

      <Button
        fullWidth
        variant="outlined"
        onClick={() => window.location.href = '/auth/facebook'}
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
    </Box>
  );
};

export default SignIn;