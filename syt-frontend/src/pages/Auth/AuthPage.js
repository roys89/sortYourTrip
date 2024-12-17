import {
  CalendarMonth as CalendarIcon,
  Explore as CompassIcon,
  Login as LoginIcon,
  LocationOn as MapIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SignIn from '../../components/SignIn/SignIn';
import SignUp from '../../components/SignUp/SignUp';

const FeatureCard = ({ icon, text, index }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.2,
        ease: [0.23, 1, 0.32, 1]
      }}
      whileHover={{ scale: 1.05 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          transition: 'background-color 0.3s',
          '&:hover': {
            bgcolor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.05)' 
              : 'rgba(255,255,255,0.1)',
          }
        }}
      >
        <Box
          sx={{
            bgcolor: theme.palette.primary.main,
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.8
          }}
        >
          {icon}
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white'
          }}
        >
          {text}
        </Typography>
      </Box>
    </motion.div>
  );
};

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isLogin, setIsLogin] = useState(location.pathname === '/auth/login');

  const features = [
    { icon: <MapIcon sx={{ color: 'white' }} />, text: "Discover amazing destinations" },
    { icon: <CalendarIcon sx={{ color: 'white' }} />, text: "Plan your perfect itinerary" },
    { icon: <CompassIcon sx={{ color: 'white' }} />, text: "Navigate like a local" }
  ];

  const handleTabChange = (event, newValue) => {
    setIsLogin(newValue === 0);
    navigate(newValue === 0 ? '/auth/login' : '/auth/register', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 4, sm: 6, md: 8 },
        overflow: 'hidden'
      }}
    >
      {/* Video Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute'
          }}
        >
          <source src="/assets/login-back.mp4" type="video/mp4" />
        </video>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.4))'
          }}
        />
      </motion.div>

      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            justifyContent: isMobile ? 'center' : 'space-between',
            px: { xs: 0, sm: 1, md: 2 }
          }}
        >
          {/* Left Section */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{ 
                flex: 1,
                maxWidth: '500px'
              }}
            >
              <Box sx={{ mb: 6, display: 'flex', justifyContent: 'flex-start' }}>
                <motion.img
                  src="/SYT-Logo_white.png"
                  alt="Sort Your Trip Logo"
                  style={{ 
                    width: '500px',
                    height: 'auto',
                    filter: theme.palette.mode === 'dark' 
                      ? 'brightness(1.2) contrast(1.2)' 
                      : 'none'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                />
              </Box>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    color: 'white',
                    mb: 2,
                    fontWeight: 'bold',
                    textShadow: theme.palette.mode === 'light'
                      ? '0px 2px 4px rgba(0, 0, 0, 0.1)'
                      : '0px 2px 4px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  Your Journey
                  <Typography
                    component="span"
                    variant="h3"
                    sx={{
                      display: 'block',
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                      textShadow: theme.palette.mode === 'light'
                        ? '0px 2px 4px rgba(0, 0, 0, 0.1)'
                        : '0px 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    Begins Here
                  </Typography>
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: 'white',
                    mb: 6,
                    maxWidth: '600px',
                    textShadow: theme.palette.mode === 'light'
                      ? '0px 1px 2px rgba(0, 0, 0, 0.05)'
                      : '0px 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  Transform your travel dreams into reality with our intelligent trip planning platform.
                </Typography>

                <Box sx={{ mt: 4 }}>
                  {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} index={index} />
                  ))}
                </Box>
              </motion.div>
            </motion.div>
          )}

          {/* Right Section - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{ 
              flex: isMobile ? 1 : 0.9,
              maxWidth: '700px',
              width: '100%'
            }}
          >
            <Paper
              elevation={theme.palette.mode === 'light' ? 4 : 12}
              sx={{
                p: 4,
                borderRadius: 4,
                bgcolor: theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                boxShadow: theme.palette.mode === 'light'
                  ? '0 8px 32px rgba(0, 0, 0, 0.1)'
                  : '0 8px 32px rgba(255, 255, 255, 0.05)',
                border: `1px solid ${
                  theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
                my: { xs: 4, sm: 6 },
                width: '100%'
              }}
            >
              <Tabs
                value={isLogin ? 0 : 1}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  mb: 4,
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '2px',
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              >
                <Tab
                  icon={<LoginIcon />}
                  label="Sign In"
                  sx={{
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 'bold'
                    }
                  }}
                />
                <Tab
                  icon={<PersonAddIcon />}
                  label="Sign Up"
                  sx={{
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 'bold'
                    }
                  }}
                />
              </Tabs>

              <Typography
                variant="h4"
                align="center"
                sx={{
                  mb: 4,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 'bold'
                }}
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Typography>

              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                >
                  {isLogin ? (
                    <SignIn handleClose={() => navigate('/')} />
                  ) : (
                    <SignUp handleClose={() => navigate('/')} />
                  )}
                </motion.div>
              </AnimatePresence>
            </Paper>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthPage;