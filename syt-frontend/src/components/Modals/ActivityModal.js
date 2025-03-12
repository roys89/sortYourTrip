import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Baby,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  MapPin,
  Users,
  X,
  XCircle
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/activitySlice';

const ActivityModal = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { selectedActivity, isModalOpen } = useSelector(state => state.activities);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const autoplayIntervalRef = useRef(null);
  const AUTOPLAY_INTERVAL = 6000; // 6 seconds between image changes

  // Handle body overflow when modal opens/closes
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);
  
  // Setup automatic image rotation
  useEffect(() => {
    if (isModalOpen && selectedActivity?.images?.length > 1) {
      // Start the autoplay
      autoplayIntervalRef.current = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % selectedActivity.images.length);
      }, AUTOPLAY_INTERVAL);
    }
    
    // Clear the interval when component unmounts or modal closes
    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = null;
      }
    };
  }, [isModalOpen, selectedActivity]);

  if (!isModalOpen || !selectedActivity) return null;

  const images = selectedActivity?.images || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const ModalSection = ({ icon, title, children }) => {
    const Icon = icon;
    
    return (
      <Paper
        elevation={0}
        sx={{ 
          mb: 3,
          p: 3,
          borderRadius: '12px',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: theme.palette.background.paper,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box 
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.3s ease'
            }}
          >
            <Icon size={20} style={{ color: theme.palette.primary.main }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: "Montserrat, sans-serif", 
              fontWeight: 600,
              color: theme.palette.text.primary,
              position: 'relative',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -5,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 4,
                backgroundColor: theme.palette.primary.main,
              }
            }}
          >
            {title}
          </Typography>
        </Box>
        {children}
      </Paper>
    );
  };

  const InfoCard = ({ title, content }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '10px',
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.card.border}`,
        transition: 'all 0.3s ease',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.08)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          transform: 'translateY(-3px)',
        },
        '&:before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: '4px',
          background: theme.palette.primary.main,
        }
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600, 
          mb: 2,
          color: theme.palette.text.primary,
          pl: 1,
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        {title}
      </Typography>
      <Box sx={{ pl: 1 }}>
        {content}
      </Box>
    </Paper>
  );

  const InfoItem = ({ icon, label, value }) => {
    const Icon = icon;
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '10px',
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.card.border}`,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.08)}`,
            borderColor: alpha(theme.palette.primary.main, 0.3),
            transform: 'translateY(-3px)',
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: '4px',
            background: theme.palette.primary.main,
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              transform: 'rotate(10deg)',
            }
          }}
        >
          <Icon size={18} />
        </Box>
        <Box>
          {label && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {label}
            </Typography>
          )}
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              mt: label ? 0.5 : 0,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {value}
          </Typography>
        </Box>
      </Paper>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={() => dispatch(closeModal())}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: "hidden",
        animate: "visible",
        variants: containerVariants,
        sx: { 
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          maxHeight: '90vh', // Allow dialog to scroll within viewport
          background: theme.palette.background.paper,
        },
      }}
      scroll="paper"
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          px: 3,
          py: 2,
          backgroundColor: theme.palette.mode === 'light' 
            ? alpha(theme.palette.primary.light, 0.05)
            : alpha(theme.palette.primary.main, 0.1),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Calendar size={22} style={{ color: theme.palette.primary.main }} />
          </Box>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: 'Montserrat, sans-serif', 
                fontWeight: 600, 
                color: theme.palette.text.primary,
              }}
            >
              Activity Details
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'Poppins, sans-serif',
                color: theme.palette.text.secondary,
                mt: 0.5,
              }}
            >
              {selectedActivity.activityProvider} - {selectedActivity.activityType}
            </Typography>
          </Box>
        </Box>
        
        <IconButton 
          onClick={() => dispatch(closeModal())} 
          sx={{
            color: theme.palette.text.secondary,
            width: 36,
            height: 36,
            backgroundColor: alpha(theme.palette.divider, 0.1),
            '&:hover': {
              backgroundColor: alpha(theme.palette.divider, 0.2),
            },
            transition: 'all 0.2s ease',
          }}
        >
          <X size={18} />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0, '&:first-of-type': { pt: 0 } }}>
        {/* Simplified Full-Width Image Gallery */}
        <Box
          component={motion.div}
          variants={itemVariants}
          sx={{ 
            position: 'relative',
            width: '100%',
            height: '450px',
            overflow: 'hidden',
            mb: 0,
          }}
        >
          {/* Background Gradient */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                : 'linear-gradient(135deg, #111827 0%, #030712 100%)',
              overflow: 'hidden',
            }}
          >
            {/* Animated Gradient Orbs */}
            <Box
              component={motion.div}
              animate={{ 
                x: [0, 30, 0],
                y: [0, -20, 0],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ 
                repeat: Infinity,
                duration: 15,
                ease: "easeInOut"
              }}
              sx={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
                filter: 'blur(60px)',
              }}
            />
            <Box
              component={motion.div}
              animate={{ 
                x: [0, -30, 0],
                y: [0, 20, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ 
                repeat: Infinity,
                duration: 18,
                ease: "easeInOut",
                delay: 1,
              }}
              sx={{
                position: 'absolute',
                bottom: '5%',
                right: '15%',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: theme.palette.mode === 'light'
                  ? `radial-gradient(circle, ${alpha('#8ecae6', 0.2)} 0%, transparent 70%)`
                  : `radial-gradient(circle, ${alpha('#3b82f6', 0.15)} 0%, transparent 70%)`,
                filter: 'blur(60px)',
              }}
            />
          </Box>
          
          {images.length > 0 ? (
            <>
              {/* Full-Width Image Display */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* Subtle Particle Background Effect */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.3,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='${encodeURIComponent(theme.palette.mode === 'light' ? '#e0e0e0' : '#333333')}' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    backgroundSize: '150px',
                    zIndex: 1,
                  }}
                />

                {/* Main Image Display */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {/* Image with Loading State */}
                  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Loading Placeholder */}
                    <Box
                      component={motion.div}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(110deg, 
                          ${alpha(theme.palette.background.paper, 0.8)} 30%, 
                          ${alpha(theme.palette.background.default, 0.6)} 50%, 
                          ${alpha(theme.palette.background.paper, 0.8)} 70%)`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        '@keyframes shimmer': {
                          '0%': { backgroundPosition: '200% 0' },
                          '100%': { backgroundPosition: '-200% 0' },
                        },
                        zIndex: 2,
                      }}
                    />

                    {/* Actual Image */}
                    <Box
                      component={motion.img}
                      key={`img-${currentImageIndex}`}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        transition: { 
                          type: 'spring',
                          stiffness: 80,
                          damping: 20
                        }
                      }}
                      onError={(e) => {
                        // Fallback to placeholder on error
                        e.target.src = '/api/placeholder/1200/800';
                      }}
                      src={images[currentImageIndex]?.variants?.[0]?.url || '/api/placeholder/1200/800'}
                      alt={`${selectedActivity.activityName} - view ${currentImageIndex + 1}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        zIndex: 1,
                      }}
                    />
                    
                    {/* Subtle Image Overlay for Depth */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(
                          to bottom,
                          ${alpha(theme.palette.common.black, 0.15)} 0%,
                          transparent 40%,
                          transparent 60%,
                          ${alpha(theme.palette.common.black, 0.2)} 100%
                        )`,
                        zIndex: 3,
                      }}
                    />
                  </Box>

                  {/* Navigation Controls Overlay */}
                  {images.length > 1 && (
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      sx={{
                        position: 'absolute',
                        bottom: 20,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 3,
                        zIndex: 20,
                      }}
                    >
                      {/* Previous Button */}
                      <Box
                        component={motion.div}
                        whileHover={{ 
                          scale: 1.1, 
                          boxShadow: `0 10px 25px ${alpha(theme.palette.common.black, 0.25)}`
                        }}
                        whileTap={{ scale: 0.95 }}
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          backdropFilter: 'blur(10px)',
                          backgroundColor: alpha(theme.palette.common.black, 0.6),
                          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.palette.common.white,
                          cursor: 'pointer',
                          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.15)}`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={prevImage}
                      >
                        <ChevronLeft size={24} />
                      </Box>
                      
                      {/* Image Counter */}
                      <Box
                        component={motion.div}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        sx={{
                          px: 3,
                          py: 1.5,
                          borderRadius: '30px',
                          backdropFilter: 'blur(10px)',
                          backgroundColor: alpha(theme.palette.common.black, 0.6),
                          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1.5,
                          boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`,
                        }}
                      >
                        <Camera size={16} style={{ color: theme.palette.common.white }} />
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography 
                            component={motion.span}
                            key={`current-${currentImageIndex}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            variant="subtitle2" 
                            sx={{ 
                              color: theme.palette.common.white,
                              fontWeight: 700,
                              fontSize: '1rem',
                            }}
                          >
                            {currentImageIndex + 1}
                          </Typography>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: alpha(theme.palette.common.white, 0.8),
                              fontWeight: 400,
                            }}
                          >
                            / {images.length}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Next Button */}
                      <Box
                        component={motion.div}
                        whileHover={{ 
                          scale: 1.1, 
                          boxShadow: `0 10px 25px ${alpha(theme.palette.common.black, 0.25)}`
                        }}
                        whileTap={{ scale: 0.95 }}
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          backdropFilter: 'blur(10px)',
                          backgroundColor: alpha(theme.palette.common.black, 0.6),
                          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.palette.common.white,
                          cursor: 'pointer',
                          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.15)}`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={nextImage}
                      >
                        <ChevronRight size={24} />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: 'spring' }}
                sx={{ 
                  textAlign: 'center', 
                  maxWidth: '80%',
                  p: 4,
                  backdropFilter: 'blur(20px)',
                  backgroundColor: alpha(
                    theme.palette.mode === 'light' 
                      ? '#ffffff' 
                      : '#000000', 
                    0.7
                  ),
                  borderRadius: '20px',
                  border: `1px solid ${alpha(
                    theme.palette.mode === 'light' 
                      ? '#ffffff' 
                      : '#ffffff',
                    0.1
                  )}`,
                  boxShadow: `0 30px 60px ${alpha(theme.palette.common.black, 0.25)}`,
                }}
              >
                <Box 
                  component={motion.div}
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut"
                  }}
                  sx={{ mb: 3 }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      boxShadow: `0 15px 35px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Camera 
                      size={35} 
                      style={{ color: theme.palette.primary.main }} 
                    />
                  </Box>
                </Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  Coming Soon
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 3,
                    fontFamily: 'Poppins, sans-serif',
                    maxWidth: '400px',
                    mx: 'auto',
                  }}
                >
                  We're preparing stunning visuals to showcase this extraordinary experience.
                  Check back soon for a visual tour.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Content Sections */}
        <Box sx={{ px: 3, mt: 3 }}>
          {/* Activity Title & Basic Info */}
          <ModalSection icon={Calendar} title={selectedActivity.activityName}>
            <Grid container spacing={2}>
              {selectedActivity.duration && (
                <Grid item xs={12} sm={6}>
                  <InfoItem 
                    icon={Clock} 
                    label="Duration"
                    value={`${selectedActivity.duration} Hour${selectedActivity.duration > 1 ? 's' : ''}`} 
                  />
                </Grid>
              )}
              {selectedActivity.selectedTime && (
                <Grid item xs={12} sm={6}>
                  <InfoItem 
                    icon={Clock} 
                    label="Selected Time"
                    value={selectedActivity.selectedTime} 
                  />
                </Grid>
              )}
              {selectedActivity.location && (
                <Grid item xs={12} sm={6}>
                  <InfoItem 
                    icon={MapPin} 
                    label="Location"
                    value={selectedActivity.location} 
                  />
                </Grid>
              )}
            </Grid>
          </ModalSection>

          {/* Description */}
          {selectedActivity.description && (
            <ModalSection icon={Info} title="Description">
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  lineHeight: 1.6,
                  textAlign: 'justify',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {selectedActivity.description}
              </Typography>
            </ModalSection>
          )}

          {/* Inclusions & Exclusions */}
          <Grid container spacing={3}>
            {/* Inclusions */}
            {selectedActivity.inclusions?.length > 0 && (
              <Grid item xs={12} md={6}>
                <InfoCard
                  title="Inclusions"
                  content={
                    <Stack spacing={1}>
                      {selectedActivity.inclusions.map((inclusion, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <Check 
                            size={16} 
                            style={{ 
                              color: theme.palette.success.main,
                              flexShrink: 0,
                              marginTop: 4
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            sx={{
                              color: theme.palette.text.secondary,
                              fontFamily: 'Poppins, sans-serif',
                            }}
                          >
                            {inclusion.otherDescription || inclusion.typeDescription}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  }
                />
              </Grid>
            )}

            {/* Exclusions */}
            {selectedActivity.exclusions?.length > 0 && (
              <Grid item xs={12} md={6}>
                <InfoCard
                  title="Exclusions"
                  content={
                    <Stack spacing={1}>
                      {selectedActivity.exclusions.map((exclusion, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <XCircle 
                            size={16} 
                            style={{ 
                              color: theme.palette.error.main,
                              flexShrink: 0,
                              marginTop: 4
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            sx={{
                              color: theme.palette.text.secondary,
                              fontFamily: 'Poppins, sans-serif',
                            }}
                          >
                            {exclusion.otherDescription || exclusion.typeDescription}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  }
                />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3, opacity: 0.6 }} />

          {/* Age Bands */}
          {selectedActivity.ageBands?.length > 0 && (
            <ModalSection icon={Baby} title="Age Requirements">
              <Grid container spacing={2}>
                {selectedActivity.ageBands.map((band, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.card.border}`,
                        transition: 'all 0.2s ease',
                        height: '100%',
                        '&:hover': {
                          boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                          transform: 'translateY(-3px)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box 
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          }}
                        >
                          <Baby size={18} style={{ color: theme.palette.primary.main }} />
                        </Box>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            fontFamily: 'Montserrat, sans-serif',
                          }}
                        >
                          {band.ageBand}
                        </Typography>
                      </Box>
                      <Stack spacing={1}>
                        <Typography 
                          variant="body2" 
                          sx={{
                            color: theme.palette.text.secondary,
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Age Range: {band.startAge} - {band.endAge} years
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{
                            color: theme.palette.text.secondary,
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          Max Travelers: {band.maxTravelersPerBooking}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </ModalSection>
          )}

          {/* Additional Info */}
          {selectedActivity.additionalInfo?.length > 0 && (
            <ModalSection icon={HelpCircle} title="Additional Information">
              <Stack spacing={1.5}>
                {selectedActivity.additionalInfo.map((info, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      borderRadius: '8px',
                      backgroundColor: index % 2 === 0 
                        ? alpha(theme.palette.background.default, 0.5) 
                        : 'transparent'
                    }}
                  >
                    <Info 
                      size={18} 
                      style={{ 
                        color: theme.palette.primary.main,
                        flexShrink: 0,
                        marginTop: 3
                      }} 
                    />
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {info.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </ModalSection>
          )}

          {/* Booking Requirements */}
          {selectedActivity.bookingRequirements && (
            <ModalSection icon={Users} title="Booking Requirements">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <InfoItem 
                    icon={Users} 
                    label="Min Travelers"
                    value={selectedActivity.bookingRequirements.minTravelersPerBooking} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem 
                    icon={Users} 
                    label="Max Travelers"
                    value={selectedActivity.bookingRequirements.maxTravelersPerBooking} 
                  />
                </Grid>
                {selectedActivity.bookingRequirements.requiresAdultForBooking && (
                  <Grid item xs={12}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        p: 2,
                        borderRadius: '8px',
                        backgroundColor: alpha(theme.palette.warning.light, 0.1),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                      }}
                    >
                      <Info size={18} style={{ color: theme.palette.warning.main }} />
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: theme.palette.text.secondary,
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        At least one adult is required for booking.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </ModalSection>
          )}

          {/* Cancellation Policy */}
          {selectedActivity.cancellationFromTourDate?.length > 0 && (
            <ModalSection icon={Calendar} title="Cancellation Policy">
              <Stack spacing={1.5}>
                {selectedActivity.cancellationFromTourDate.map((policy, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.5,
                      borderRadius: '8px',
                      backgroundColor: policy.percentageRefundable > 0
                        ? alpha(theme.palette.success.light, 0.1)
                        : alpha(theme.palette.error.light, 0.1),
                      border: `1px solid ${policy.percentageRefundable > 0
                        ? alpha(theme.palette.success.main, 0.2)
                        : alpha(theme.palette.error.main, 0.2)}`
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: theme.palette.text.secondary,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {policy.dayRangeMin === 0 ? 'Same day' : `${policy.dayRangeMin} day${policy.dayRangeMin > 1 ? 's' : ''}`} 
                      {policy.dayRangeMax ? ` to ${policy.dayRangeMax} days` : ' or more'} before tour:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: policy.percentageRefundable > 0
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {policy.percentageRefundable}% refundable
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </ModalSection>
          )}

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 4,
              pt: 3,
              pb: 4, // Added bottom padding
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  mb: 0.5,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {selectedActivity.activityName}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{
                  color: theme.palette.text.secondary,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {selectedActivity.selectedTime} • {selectedActivity.duration} Hour{selectedActivity.duration > 1 ? 's' : ''}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => dispatch(closeModal())}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  color: theme.palette.primary.main,
                  borderRadius: "24px",
                  py: 1.2,
                  px: 3,
                  fontWeight: 600,
                  fontFamily: 'Poppins, sans-serif',
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transform: "translateY(-2px)",
                  }
                }}
              >
                Close
              </Button>
              
              
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityModal;