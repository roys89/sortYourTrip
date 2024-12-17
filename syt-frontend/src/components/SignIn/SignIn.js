import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../redux/slices/authSlice';

const SignIn = ({ handleClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();

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
            bgcolor: theme.palette.mode === 'light' 
              ? 'error.lighter' 
              : 'rgba(211, 47, 47, 0.2)'
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
            bgcolor: theme.palette.background.paper,
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
            }
          },
          '& label.Mui-focused': {
            color: theme.palette.primary.main,
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
                sx={{
                  color: theme.palette.mode === 'light' 
                    ? 'rgba(0,0,0,0.54)' 
                    : 'rgba(255,255,255,0.7)'
                }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
            }
          },
          '& label.Mui-focused': {
            color: theme.palette.primary.main,
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
          background: theme.palette.button.hoverGradient,
          animation: theme.palette.button.hoverAnimation,
          backgroundSize: '200% 100%',
          '&:hover': {
            boxShadow: 'none',
            backgroundPosition: 'right center'
          }
        }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <Box sx={{ position: 'relative', my: 2 }}>
        <Divider 
          sx={{ 
            '&::before, &::after': {
              borderColor: theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.12)' 
                : 'rgba(255,255,255,0.2)'
            }
          }}
        >
          or
        </Divider>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        gap: 2 
      }}>
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
            borderColor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.23)' 
              : 'rgba(255,255,255,0.23)',
            '&:hover': {
              borderWidth: 2,
              borderColor: theme.palette.primary.main
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
            borderColor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.23)' 
              : 'rgba(255,255,255,0.23)',
            '&:hover': {
              borderWidth: 2,
              borderColor: theme.palette.primary.main
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
    </Box>
  );
};

export default SignIn;