import { Box, Button, Grid, TextField, Typography, useTheme } from '@mui/material';
import React from 'react';
import './Newsletter.css'; // Custom styles

const Newsletter = () => {
  const theme = useTheme();

  return (
    <Box className="newsletter-container" sx={{
      backgroundColor: theme.palette.newsletterCard.main, // Use custom color here
      color: theme.palette.text.primary,
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: theme.shadows[3],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <img 
            src="/assets/images/newsletter.jpg" 
            alt="Newsletter"
            className="newsletter-image"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box className="newsletter-text-container">
            <Typography variant="h4" className="newsletter-heading">
              Stay Updated!
            </Typography>
            <Typography variant="body1" className="newsletter-text">
              Subscribe to our newsletter for the latest travel deals and tips.
            </Typography>
            <Box className="newsletter-input-container">
              <Grid container spacing={2} className="newsletter-name-inputs">
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    placeholder="First Name"
                    fullWidth
                    className="newsletter-name-input"
                    sx={{
                      backgroundColor: theme.palette.background.default,
                      input: { color: theme.palette.text.primary },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    placeholder="Last Name"
                    fullWidth
                    className="newsletter-name-input"
                    sx={{
                      backgroundColor: theme.palette.background.default,
                      input: { color: theme.palette.text.primary },
                    }}
                  />
                </Grid>
              </Grid>
              <TextField
                variant="outlined"
                placeholder="Enter your email"
                className="newsletter-input"
                fullWidth
                sx={{
                  backgroundColor: theme.palette.background.default,
                  input: { color: theme.palette.text.primary },
                }}
              />
              <Button variant="contained" color="primary" className="newsletter-button">
                Subscribe
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Newsletter;
