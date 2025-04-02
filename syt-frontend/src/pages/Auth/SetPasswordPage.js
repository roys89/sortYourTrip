import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Alert, Box, Button, Container, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import axios from 'axios'; // Use standard axios
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setError('Password reset token not found in URL.');
            // Optional: Redirect if no token?
            // navigate('/login');
        }
    }, [searchParams, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!token) {
            setError('Missing password reset token.');
            return;
        }

        if (password.length < 6) { // Basic length check
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            // --- Hardcoded API URL (since config file is not used) --- 
            // Replace if your B2C backend URL is different
            const B2C_API_BASE_URL = 'http://localhost:5000/api'; 
            const apiUrl = `${B2C_API_BASE_URL}/auth/set-password`; 
            // ---------------------------------------------------------
            
            const payload = { 
                token: token, // The token from the URL
                password: password, 
                confirmPassword: confirmPassword 
            };

            console.log('Sending set-password request to:', apiUrl);
            const response = await axios.post(apiUrl, payload);

            if (response.data && response.data.success) {
                setSuccess('Password set successfully! Redirecting to login...');
                // Clear form?
                setPassword('');
                setConfirmPassword('');
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 3000); // 3 seconds delay
            } else {
                throw new Error(response.data?.message || 'Failed to set password.');
            }

        } catch (err) {
            console.error('Set Password Error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Set Your New Password
                </Typography>

                {/* Error Alert */} 
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Success Alert */} 
                {success && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Show form only if token exists and not yet successful */} 
                {token && !success && (
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="New Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle confirm password visibility"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading || !password || !confirmPassword}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? 'Setting Password...' : 'Set Password'}
                        </Button>
                    </Box>
                )}
                
                {/* Show message if no token */} 
                {!token && !error && (
                     <Typography color="text.secondary">Loading token...</Typography>
                 )}
                 {!token && error && (
                     <Button onClick={() => navigate('/login')}>Go to Login</Button>
                 )} 

            </Box>
        </Container>
    );
};

export default SetPasswordPage; 