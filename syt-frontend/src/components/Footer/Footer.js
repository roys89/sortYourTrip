// Footer.jsx
import { Box, Container, Grid, TextField, Typography } from '@mui/material';
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <Box
      sx={{
        bgcolor: '#004D30',
        color: 'white',
        pt: 8,
        pb: 8,
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 4, sm: 8, md: 12 } }}>
        {/* Top Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {/* Left Section */}
          <Grid 
            item 
            xs={12} 
            md={4.5}
            sx={{
              textAlign: { xs: 'center', md: 'left' },
              mb: { xs: 6, md: 0 }
            }}
          >
            <Typography 
              variant="h1" 
              sx={{ 
                fontWeight: 400, 
                mb: 6, 
                color: 'white',
                fontSize: '2.5rem',
                fontFamily: "'Montserrat', sans-serif",
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              SortYourTrip
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 400, 
                mb: 3,
                fontSize: '1.5rem'
              }}
            >
              Contact Us
            </Typography>
            <Typography sx={{ 
              mb: 4, 
              fontSize: '1.125rem', 
              lineHeight: 1.8,
              opacity: 0.9
            }}>
              A/202, Kalpatru Habitat,<br />
              Dr S.S. Road, Parel,<br />
              Mumbai 400012
            </Typography>
            <Box 
              component="a" 
              href="tel:+919372069323" 
              sx={{ 
                display: 'block', 
                mb: 2,
                color: 'white',
                textDecoration: 'underline',
                fontSize: '1.125rem',
                opacity: 0.9,
                '&:hover': { opacity: 1 }
              }}
            >
              +91 93720-69323
            </Box>
            <Box 
              component="a" 
              href="mailto:info@sortyourtrip.com" 
              sx={{ 
                color: 'white',
                textDecoration: 'underline',
                fontSize: '1.125rem',
                opacity: 0.9,
                '&:hover': { opacity: 1 }
              }}
            >
              info@sortyourtrip.com
            </Box>
          </Grid>

          {/* Middle Section - with horizontal lines in mobile */}
          <Grid 
            item 
            xs={12} 
            md={4.5} 
            sx={{ 
              borderLeft: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.1)' },
              borderRight: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.1)' },
              borderTop: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' },
              borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' },
              px: { xs: 0, md: 8 },
              py: { xs: 6, md: 0 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 400, 
                mb: 3,
                fontSize: '2.25rem',
                textAlign: 'center'
              }}
            >
              Get Updates
            </Typography>
            <Typography sx={{ 
              mb: 4, 
              fontSize: '1.125rem',
              opacity: 0.9,
              lineHeight: 1.6,
              textAlign: 'center'
            }}>
              Subscribe to our Newsletter for<br />
              Daily Updates & Announcements
            </Typography>
            <Box sx={{ width: { xs: '100%', sm: '80%', md: '100%' } }}>
              <TextField
                fullWidth
                placeholder="Email Address"
                variant="outlined"
                sx={{
                  mb: 3,
                  backgroundColor: 'transparent',
                  input: { 
                    color: 'white',
                    py: 1.5,
                    fontSize: '1.125rem'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: 'white' },
                  }
                }}
              />
              <TextField
                fullWidth
                placeholder="First Name"
                variant="outlined"
                sx={{
                  mb: 3,
                  backgroundColor: 'transparent',
                  input: { 
                    color: 'white',
                    py: 1.5,
                    fontSize: '1.125rem'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: 'white' },
                  }
                }}
              />
            </Box>
            <button className="subscribe-button">
              Subscribe
            </button>
          </Grid>

          {/* Right Section */}
          <Grid 
            item 
            xs={12} 
            md={3} 
            sx={{ 
              pl: { xs: 0, md: 6 },
              mt: { xs: 6, md: 0 }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'center', md: 'flex-end' },
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-end' }
            }}>
              {[
                'About Us',
                'Destinations',
                'Book Now',
                'Blog',
                'Contact Us',
                ['Sent Us Text', '→']
              ].map((text, index) => (
                <Box
                  key={typeof text === 'string' ? text : text[0]}
                  component="a"
                  href={`/${typeof text === 'string' ? text.toLowerCase().replace(/\s+/g, '-') : text[0].toLowerCase().replace(/\s+/g, '-')}`}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-end' },
                    mb: index === 5 ? 0 : 3,
                    color: 'white',
                    textDecoration: 'none',
                    opacity: 0.9,
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  {typeof text === 'string' ? text : (
                    <>
                      {text[0]}
                      <span style={{ marginLeft: '12px', fontSize: '1.5rem' }}>{text[1]}</span>
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Section - Copyright */}
        <Box sx={{ 
          justifyContent: 'center',
          display: 'flex',
          pt: 4,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography sx={{ 
            opacity: 0.9,
            fontSize: { xs: '0.9rem', sm: '1.125rem' },
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            textAlign: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <span>Copyright 2024</span>
            <Box component="span" sx={{ mx: 1 }}>•</Box>
            <span>SortYourTrip Group, Inc.</span>
            <Box component="span" sx={{ mx: 1 }}>•</Box>
            <span>All rights reserved</span>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;