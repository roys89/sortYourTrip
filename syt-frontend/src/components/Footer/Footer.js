import { Facebook as FacebookIcon, Instagram as InstagramIcon, LinkedIn as LinkedInIcon } from '@mui/icons-material';
import { Box, Container, IconButton, Link, Typography, useTheme } from '@mui/material';
import React from 'react';
import './Footer.css';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#333',
        color: theme.palette.mode === 'light' ? '#333' : '#f5f5f5',
        py: 4,
        px: 2,
        textAlign: { xs: 'center', sm: 'left' }, // Center text on small screens
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }, // Stack on mobile, row on larger screens
            justifyContent: 'space-between',
            mb: 3,
            alignItems: { xs: 'center', md: 'flex-start' }, // Center items on mobile
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              SortYourTrip
            </Typography>
            <Box sx={{ display: 'flex', mb: 3 }}>
              <IconButton color="inherit" component={Link} href="https://facebook.com/sortyourtrip?mibextid=LQQJ4d" aria-label="Facebook" target='_blank'>
                <FacebookIcon />
              </IconButton>
              <IconButton color="inherit" component={Link} href="https://www.linkedin.com/company/sortyourtrip/" aria-label="Twitter" target='_blank'>
                <LinkedInIcon />
              </IconButton>
              <IconButton color="inherit" component={Link} href="https://www.instagram.com/sortyourtrip/?igsh=dWxuYWkxc2dnOTUz" aria-label="Instagram" target='_blank'>
                <InstagramIcon />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Copyright © 2024 by SortYourTrip Group, Inc. All rights reserved.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile, horizontally on larger screens
              justifyContent: 'space-between',
              gap: { xs: 3, sm: 6 }, // Increase gap between sections on larger screens
              alignItems: { xs: 'center', sm: 'flex-start' }, // Center sections on mobile, align left on larger screens
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, mx: { sm: 2 } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Contact us
              </Typography>
              <Typography sx={{ mb: 0.5 }}>
                A/202, Kalpatru Habitat, Dr S.S. Road, Parel, Mumbai 400012
              </Typography>
              <Typography sx={{ mb: 0.5 }}>Phone: +91 93720-69323</Typography>
              <Link href="mailto:info@sortyourtrip.com" color="inherit" underline="none">
                info@sortyourtrip.com
              </Link>
            </Box>

            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, mx: { sm: 2 } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Account
              </Typography>
              <Link href="/create-account" color="inherit" underline="none" display="block" sx={{ mb: 0.5 }}>
                Create account
              </Link>
              <Link href="/sign-in" color="inherit" underline="none" display="block" sx={{ mb: 0.5 }}>
                Sign in
              </Link>
            </Box>

            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, mx: { sm: 2 } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Company
              </Typography>
              <Link href="/about" color="inherit" underline="none" display="block" sx={{ mb: 0.5 }}>
                About SortYourTrip
              </Link>
              <Link href="/business" color="inherit" underline="none" display="block" sx={{ mb: 0.5 }}>
                For Business
              </Link>
              <Link href="/partners" color="inherit" underline="none" display="block" sx={{ mb: 0.5 }}>
                Travel Partners
              </Link>
              <Link href="/careers" color="inherit" underline="none" display="block">
                Careers
              </Link>
            </Box>

            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, mx: { sm: 2 } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Resources
              </Typography>
              <Link href="/itinerary" color="inherit" underline="none" display="block" sx={{ mb: 0.5 }}>
                Itinerary Directory
              </Link>
              <Link href="/help" color="inherit" underline="none" display="block" sx={{ mb: 0.5 }}>
                Help Center
              </Link>
              <Link href="/privacy" color="inherit" underline="none" display="block">
                Privacy & Terms
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
