import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
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
  Bed,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  Shield,
  Star,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../redux/slices/hotelSlice";

const HotelModal = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { selectedHotel, isModalOpen } = useSelector((state) => state.hotels);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const autoplayIntervalRef = useRef(null);
  const AUTOPLAY_INTERVAL = 6000; // 6 seconds between image changes

  // Memoize hotel data structure to prevent unnecessary recalculations
  const hotelData = useMemo(() => selectedHotel?.data || {}, [selectedHotel]);
  
  // Memoize derived data structures
  const { staticContent, hotelItems, roomDetails, hotelDetails } = useMemo(() => {
    return {
      staticContent: hotelData?.staticContent?.[0] || {},
      hotelItems: hotelData?.items?.[0] || {},
      roomDetails: hotelData?.items?.[0]?.selectedRoomsAndRates || [],
      hotelDetails: hotelData?.hotelDetails || {}
    };
  }, [hotelData]);
  
  // Process images for our gallery - wrapped in useMemo to prevent recalculations
  const processedImages = useMemo(() => {
    // Extract images inside the useMemo callback
    const images = staticContent?.images || [];
    
    return images.length > 0 
      ? images.map(img => ({
          variants: [{ 
            url: img.links?.find(l => l.size === 'Xxl')?.url || (img.links && img.links[0]?.url) || '/api/placeholder/1200/600'
          }],
          caption: img.caption || 'Hotel Image'
        }))
      : [{ 
          variants: [{ url: '/api/placeholder/1200/600' }],
          caption: 'Hotel Image'
        }];
  }, [staticContent]);

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
    if (isModalOpen && processedImages.length > 1) {
      // Start the autoplay
      autoplayIntervalRef.current = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % processedImages.length);
      }, AUTOPLAY_INTERVAL);
    }
    
    // Clear the interval when component unmounts or modal closes
    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = null;
      }
    };
  }, [isModalOpen, processedImages]);

  if (!isModalOpen || !selectedHotel) return null;

  const nextImage = () => {
    // Reset the autoplay timer when manually changing images
    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % processedImages.length);
      }, AUTOPLAY_INTERVAL);
    }
    
    setCurrentImageIndex((prev) => (prev + 1) % processedImages.length);
  };

  const prevImage = () => {
    // Reset the autoplay timer when manually changing images
    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = setInterval(() => {
        setCurrentImageIndex(prevIndex => (prevIndex + 1) % processedImages.length);
      }, AUTOPLAY_INTERVAL);
    }
    
    setCurrentImageIndex((prev) => (prev - 1 + processedImages.length) % processedImages.length);
  };

  // Helper functions
  const getHotelName = () => hotelDetails?.name || 'Hotel Name Unavailable';
  const getStarCount = () => parseInt(hotelDetails?.starRating) || 0;
  const getAddress = () => {
    const address = hotelDetails?.address;
    return address 
      ? [address.line1, address.city?.name, address.country?.name].filter(Boolean).join(', ') 
      : 'Address Not Available';
  };

  // Compile all hotel amenities
  const getAllFacilities = () => {
    const staticFacilities = staticContent?.facilities || [];
    return staticFacilities.map(facility => facility.name).filter(Boolean);
  };

  // Compile all hotel descriptions
  const getDescriptions = () => {
    const descriptions = staticContent?.descriptions || [];
    // Convert array into a map of type to text
    const descMap = descriptions.reduce((acc, desc) => {
      if (desc.type && desc.text) {
        acc[desc.type] = desc.text;
      }
      return acc;
    }, {});
    
    // If no descriptions are found, return empty object
    return descMap;
  };

  // Compile cancelation policies
  const getCancellationPolicies = () => {
    const policies = [];
    roomDetails.forEach(room => {
      const roomPolicies = room?.rate?.cancellationPolicies || [];
      policies.push(...roomPolicies);
    });
    return policies;
  };

  // Compile room details
  const getRoomDetails = () => {
    return roomDetails.map(room => ({
      name: room.room?.name || 'Room',
      room: room.room || {},
      occupancy: room.occupancy,
      rate: room.rate
    }));
  };

  // Collapsible Section Component
  const ModalSection = ({ icon, title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const Icon = icon;
    
    return (
      <Paper
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: '12px',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: theme.palette.background.paper,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 3,
            cursor: 'pointer',
            borderBottom: isOpen ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
          }}
          onClick={() => setIsOpen(!isOpen)}
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
                  opacity: isOpen ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }
              }}
            >
              {title}
            </Typography>
          </Box>
          <Box 
            component={motion.div}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.divider, 0.1),
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.divider, 0.2),
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronDown size={18} />
          </Box>
        </Box>
        
        <Box
          component={motion.div}
          initial={false}
          animate={{
            height: isOpen ? 'auto' : 0,
            opacity: isOpen ? 1 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
          sx={{
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Box>
      </Paper>
    );
  };

  // Info Card Component
  const InfoCard = ({ title, content }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '10px',
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
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

  // Item with Icon component
  const IconItem = ({ icon, text }) => {
    const Icon = icon;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '8px',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            flexShrink: 0,
          }}
        >
          <Icon size={14} style={{ color: theme.palette.primary.main }} />
        </Box>
        <Typography 
          variant="body2" 
          sx={{
            color: theme.palette.text.secondary,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {text}
        </Typography>
      </Box>
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
            <Bed size={22} style={{ color: theme.palette.primary.main }} />
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
              Hotel Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ display: 'flex', color: 'gold' }}>
                {[...Array(getStarCount())].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: theme.palette.text.secondary,
                }}
              >
                {getStarCount()}-Star Hotel
              </Typography>
            </Box>
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
          
          {processedImages.length > 0 ? (
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
                      onTouchStart={() => {
                        // Pause autoplay on touch (mobile devices)
                        if (autoplayIntervalRef.current) {
                          clearInterval(autoplayIntervalRef.current);
                        }
                      }}
                      onTouchEnd={() => {
                        // Resume autoplay after touch
                        if (!autoplayIntervalRef.current && processedImages.length > 1) {
                          autoplayIntervalRef.current = setInterval(() => {
                            setCurrentImageIndex(prevIndex => (prevIndex + 1) % processedImages.length);
                          }, AUTOPLAY_INTERVAL);
                        }
                      }}
                      onError={(e) => {
                        // Fallback to placeholder on error
                        e.target.src = '/api/placeholder/1200/800';
                      }}
                      src={processedImages[currentImageIndex]?.variants?.[0]?.url || '/api/placeholder/1200/800'}
                      alt={processedImages[currentImageIndex]?.caption || 'Hotel Image'}
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
                  {processedImages.length > 1 && (
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
                            / {processedImages.length}
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
                  We're preparing stunning visuals to showcase this extraordinary hotel.
                  Check back soon for a visual tour.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Content Sections */}
        <Box sx={{ px: 3, mt: 3 }}>
          {/* Hotel Name & Basic Info */}
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
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: "Montserrat, sans-serif", 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 2,
              }}
            >
              {getHotelName()}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  <MapPin size={18} />
                </Box>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      color: theme.palette.text.secondary,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Location
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {getAddress()}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: alpha('#FFD700', 0.1),
                    color: '#FFD700',
                  }}
                >
                  <Star size={18} fill="currentColor" />
                </Box>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      color: theme.palette.text.secondary,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Rating
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {getStarCount()} Star Hotel
                  </Typography>
                </Box>
              </Box>
              
              {hotelData?.searchRequestLog?.checkIn && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                    }}
                  >
                    <Calendar size={18} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block',
                        fontWeight: 500,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        color: theme.palette.text.secondary,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      Check-in/Check-out
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {hotelData?.searchRequestLog?.checkIn} - {hotelData?.searchRequestLog?.checkOut}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* About the Hotel */}
          <ModalSection icon={Info} title="About the Hotel">
            {Object.entries(getDescriptions()).filter(([type]) => type !== 'attractions').map(([type, text]) => (
              <Box key={type} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    color: theme.palette.text.primary,
                    fontFamily: 'Montserrat, sans-serif',
                    textTransform: 'capitalize',
                  }}
                >
                  {type.replace(/_/g, ' ')}
                </Typography>
                
                {/* Render HTML content if present */}
                {text.includes('<') ? (
                  <Box
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontFamily: 'Poppins, sans-serif',
                      '& p': { mb: 1.5 },
                      '& strong, & b': { fontWeight: 600, color: theme.palette.text.primary },
                      '& br': { display: 'block', content: '""', mt: 0.5 },
                      fontSize: '0.875rem',
                      lineHeight: 1.6
                    }}
                    dangerouslySetInnerHTML={{ __html: text }}
                  />
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.6,
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {text}
                  </Typography>
                )}
              </Box>
            ))}
          </ModalSection>

          {/* Attractions */}
          {getDescriptions()['attractions'] && (
            <ModalSection icon={MapPin} title="Attractions & Location">
              <Box
                sx={{ 
                  color: theme.palette.text.secondary, 
                  fontFamily: 'Poppins, sans-serif',
                  '& p': { mb: 2 },
                  '& br': { display: 'block', content: '""', mt: 0.5 },
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}
                dangerouslySetInnerHTML={{ __html: getDescriptions()['attractions'] }}
              />
            </ModalSection>
          )}

          {/* Room Types */}
          <ModalSection icon={Bed} title="Room Types">
            {getRoomDetails().map((room, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 3,
                  mb: index < getRoomDetails().length - 1 ? 3 : 0,
                  borderRadius: '12px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  transition: 'all 0.3s ease',
                  width: '100%', // Full width
                  '&:hover': {
                    boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.08)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'translateY(-3px)',
                  }
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  {room.name}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <IconItem 
                      icon={Users} 
                      text={`Adults: ${room.occupancy?.adults || 0}`} 
                    />
                  </Grid>
                  {room.occupancy?.childAges && room.occupancy.childAges.length > 0 && (
                    <Grid item xs={12} sm={6}>
                      <IconItem 
                        icon={Baby} 
                        text={`Children: ${room.occupancy.childAges.length} (Ages: ${room.occupancy.childAges.join(', ')})`} 
                      />
                    </Grid>
                  )}
                </Grid>
                
                {room.room?.description && (
                  <Box 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      mb: 2,
                      fontFamily: 'Poppins, sans-serif',
                      '& p': { mb: 1 },
                      '& strong, & b': { fontWeight: 600, color: theme.palette.text.primary },
                      '& br': { display: 'block', content: '""', mt: 1 }
                    }}
                    dangerouslySetInnerHTML={{ __html: room.room.description }}
                  />
                )}
                
                {room.rate?.boardBasis && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      mb: 2,
                      px: 2,
                      py: 1.5,
                      borderRadius: '8px',
                      backgroundColor: alpha(theme.palette.primary.light, 0.1),
                    }}
                  >
                    <Check size={18} style={{ color: theme.palette.primary.main }} />
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: theme.palette.text.secondary,
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 500,
                      }}
                    >
                      Meal Plan: {room.rate.boardBasis.description}
                    </Typography>
                  </Box>
                )}
                
                {/* Price removed as requested */}
              </Paper>
            ))}
          </ModalSection>

          {/* Hotel Facilities */}
          <ModalSection icon={Check} title="Hotel Facilities">
            <Grid container spacing={1.5}>
              {getAllFacilities().map((facility, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: '8px',
                      backgroundColor: index % 2 === 0 
                        ? alpha(theme.palette.background.default, 0.5) 
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        flexShrink: 0,
                      }}
                    >
                      <Check size={14} style={{ color: theme.palette.success.main }} />
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: theme.palette.text.secondary,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {facility}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </ModalSection>

          {/* Cancellation Policies */}
          <ModalSection icon={Calendar} title="Cancellation Policies">
            {getCancellationPolicies().length > 0 ? (
              <Stack spacing={2}>
                {getCancellationPolicies().map((policy, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '10px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      backgroundColor: index % 2 === 0 
                        ? alpha(theme.palette.background.default, 0.5) 
                        : theme.palette.background.paper,
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.primary,
                        mb: 2,
                        fontWeight: 500,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {policy.text}
                    </Typography>
                    
                    {policy.rules?.map((rule, ruleIndex) => (
                      <Box key={ruleIndex} sx={{ mb: 1.5, last: { mb: 0 } }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  fontWeight: 600,
                                }}
                              >
                                Period Start:
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {new Date(rule.start).toLocaleString()}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  fontWeight: 600,
                                }}
                              >
                                Period End:
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {new Date(rule.end).toLocaleString()}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        <Box 
                          sx={{ 
                            mt: 1, 
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: '4px',
                            backgroundColor: alpha(theme.palette.warning.light, 0.2),
                          }}
                        >
                          <Typography 
                            variant="caption"
                            sx={{ 
                              fontWeight: 600,
                              color: theme.palette.warning.dark,
                            }}
                          >
                            Cancellation Value: {rule.value} {rule.valueType}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  p: 3,
                  borderRadius: '10px',
                  backgroundColor: alpha(theme.palette.info.light, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Info size={24} style={{ color: theme.palette.info.main }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Cancellation policy information is not available for this hotel. Please contact the hotel directly for details.
                </Typography>
              </Box>
            )}
          </ModalSection>

          {/* Safety & Policies */}
          <ModalSection icon={Shield} title="Safety & Policies" defaultOpen={false}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoCard
                  title="Check-in/Check-out"
                  content={
                    <Box>
                      <IconItem 
                        icon={Calendar} 
                        text={`Check-in: From ${hotelData?.searchRequestLog?.checkIn || 'Not specified'}`} 
                      />
                      <IconItem 
                        icon={Calendar} 
                        text={`Check-out: Until ${hotelData?.searchRequestLog?.checkOut || 'Not specified'}`} 
                      />
                    </Box>
                  }
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <InfoCard
                  title="Additional Information"
                  content={
                    <Box>
                      <IconItem 
                        icon={Info} 
                        text={`PAN Card Mandatory: ${hotelData?.isPanMandatoryForBooking ? 'Yes' : 'No'}`} 
                      />
                      <IconItem 
                        icon={Info} 
                        text={`Passport Mandatory: ${hotelData?.isPassportMandatoryForBooking ? 'Yes' : 'No'}`} 
                      />
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </ModalSection>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 4,
              pt: 3,
              pb: 4,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Button
              variant="contained"
              onClick={() => dispatch(closeModal())}
              sx={{
                backgroundColor: theme.palette.button?.main || theme.palette.primary.main,
                color: theme.palette.button?.contrastText || theme.palette.common.white,
                borderRadius: "10px",
                py: 1.2,
                px: 4,
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                transition: "all 0.3s ease",
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                  transform: "translateY(-3px)",
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                }
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default HotelModal;