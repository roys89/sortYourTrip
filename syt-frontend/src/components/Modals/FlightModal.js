import { alpha, Box, Dialog, DialogContent, Divider, Grid, IconButton, Paper, Stack, Typography, useTheme } from '@mui/material';
import {
  AlertTriangle,
  Armchair,
  Briefcase,
  Clock,
  Info,
  Plane,
  Utensils,
  X
} from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/flightSlice';

// Map of airline names to image paths - copied from FlightCard.js
const AIRLINE_IMAGES = {
  'SpiceJet': '/assets/images/airlines/spicejet.jpg',
  'Air India': '/assets/images/airlines/airindia.jpg',
  'Oman Aviation': '/assets/images/airlines/oman.jpg',
  'AI Express': '/assets/images/airlines/airindiaexpress.jpg',
  'Saudi Arabian Airlines': '/assets/images/airlines/saudia.jpg',
  'ETIHAD AIRWAYS': '/assets/images/airlines/etihad.jpg',
  'Srilankan Airlines': '/assets/images/airlines/srilankan.jpg',
  'Azerbaijan Airlines': '/assets/images/airlines/azerbaijan.jpg',
  'Indigo': '/assets/images/airlines/indigo.jpg',
  'Kuwait Airways': '/assets/images/airlines/kuwait.jpg',
  'Lufthansa': '/assets/images/airlines/lufthansa.jpg',
  'Emirates Airlines': '/assets/images/airlines/emirates.jpg'
};

// Default image if airline not in map
const DEFAULT_AIRLINE_IMAGE = '/api/placeholder/400/300';

const FlightModal = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { selectedFlight, isModalOpen } = useSelector((state) => state.flights);
  const flightData = selectedFlight?.flightData;

  if (!isModalOpen || !flightData) return null;

  const getAirlineImage = () => {
    // Add logging to check if airline name is found
    console.log("Looking for airline:", flightData.airline);
    console.log("Available in mapping:", !!AIRLINE_IMAGES[flightData.airline]);
    return AIRLINE_IMAGES[flightData.airline] || DEFAULT_AIRLINE_IMAGE;
  };

  const formatTime = (date, time) => {
    if (!date) return time || 'Not available';
    try {
      return new Date(date).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }) || time || 'Not available';
    } catch (error) {
      return time || 'Not available';
    }
  };
  
  const formatDate = (date) => {
    if (!date) return 'Not available';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Not available';
    }
  };

  // Helper function to render seat selection
  const renderSeatSelection = (segment) => {
    const selectedSeats = flightData.selectedSeats?.find(
      seats => seats.origin === segment.origin && seats.destination === segment.destination
    );

    if (!flightData.isSeatSelected || !selectedSeats) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '10px',
            background: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.divider, 0.2),
                color: theme.palette.text.secondary
              }}
            >
              <Armchair size={18} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                No Seat Selected
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Default Seat: Any available seat from {segment.baggage} class
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }

    // If seats are selected
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '10px',
          background: alpha(theme.palette.background.paper, 0.6),
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main
            }}
          >
            <Armchair size={18} />
          </Box>
          <Typography variant="subtitle2" fontWeight={600}>
            Selected Seats
          </Typography>
        </Box>
        <Stack spacing={1} sx={{ ml: 6 }}>
          {selectedSeats?.rows?.map((row, rowIndex) => 
            row.seats.map(seat => (
              <Box key={`${rowIndex}-${seat.code}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  Seat {seat.code} - {seat.type.isWindow ? 'Window' : seat.type.isAisle ? 'Aisle' : 'Middle'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ₹{seat.price.toLocaleString()}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </Paper>
    );
  };

  // Helper function to render meal selection
  const renderMealSelection = (segment) => {
    const selectedMeal = flightData.selectedMeal?.find(
      meal => meal.origin === segment.origin && meal.destination === segment.destination
    );

    if (!flightData.isMealSelected || !selectedMeal) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '10px',
            background: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.divider, 0.2),
                color: theme.palette.text.secondary
              }}
            >
              <Utensils size={18} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                No Meal Selected
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Default: Standard in-flight meal
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }

    // If meal is selected
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '10px',
          background: alpha(theme.palette.background.paper, 0.6),
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main
            }}
          >
            <Utensils size={18} />
          </Box>
          <Typography variant="subtitle2" fontWeight={600}>
            Selected Meal
          </Typography>
        </Box>
        <Stack spacing={1} sx={{ ml: 6 }}>
          {selectedMeal?.options?.map((meal, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{meal.description}</Typography>
              <Typography variant="body2" color="text.secondary">₹{meal.price.toLocaleString()}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    );
  };

  // Helper function to render baggage selection
  const renderBaggageSelection = (segment) => {
    const selectedBaggage = flightData.selectedBaggage?.find(
      baggage => baggage.origin === segment.origin && baggage.destination === segment.destination
    );

    if (!flightData.isBaggageSelected || !selectedBaggage) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '10px',
            background: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.divider, 0.2),
                color: theme.palette.text.secondary
              }}
            >
              <Briefcase size={18} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                No Extra Baggage Selected
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Default: {segment.baggage} checked, {segment.cabinBaggage} cabin
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }

    // If baggage is selected
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '10px',
          background: alpha(theme.palette.background.paper, 0.6),
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.main
            }}
          >
            <Briefcase size={18} />
          </Box>
          <Typography variant="subtitle2" fontWeight={600}>
            Selected Baggage
          </Typography>
        </Box>
        <Stack spacing={1} sx={{ ml: 6 }}>
          {selectedBaggage?.options?.map((baggage, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{baggage.description}</Typography>
              <Typography variant="body2" color="text.secondary">₹{baggage.price.toLocaleString()}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    );
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
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          background: alpha(theme.palette.background.paper, 0.6),
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
              backgroundColor: alpha(theme.palette.divider, 0.2),
            }}
          >
            <Icon size={20} style={{ color: theme.palette.text.primary }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
        </Box>
        {children}
      </Paper>
    );
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={() => dispatch(closeModal())}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          maxHeight: '90vh',
        },
      }}
      scroll="paper"
    >
      {/* Header - Just the title bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          px: 3,
          py: 2,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.light, 0.05),
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
            <Plane size={22} style={{ color: theme.palette.primary.main }} />
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
              Flight Details
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

      {/* Content Sections - ALL content including flight details is here and scrolls together */}
      <DialogContent sx={{ p: 3 }}>
        {/* Flight Header with fixed padding and properly aligned */}
        <Box sx={{ mx: -3, mt: -3, mb: 3, px: 3, pt: 3 }}>
          <Grid container spacing={2}>
            {/* Left section with logo and flight number */}
            <Grid item xs={12} sm={3}>
              <Box 
                sx={{
                  height: '100%',
                  backgroundColor: 'rgba(245, 245, 245, 0.5)',
                  borderRadius: '8px',
                  border: '1px solid rgba(229, 231, 235, 1)',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  component="img"
                  src={getAirlineImage()}
                  alt={flightData.airline}
                  sx={{
                    width: '100%',
                    maxWidth: 150,
                    height: 80,
                    objectFit: 'contain',
                    mb: 2
                  }}
                />
                <Typography variant="body1" fontWeight={500} color="text.primary">
                  {flightData.airline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Flight {flightData.flightCode}
                </Typography>
              </Box>
            </Grid>

            {/* Right section with journey details */}
            <Grid item xs={12} sm={9}>
              <Box 
                sx={{
                  height: '100%',
                  backgroundColor: 'rgba(245, 245, 245, 0.5)',
                  borderRadius: '8px',
                  border: '1px solid rgba(229, 231, 235, 1)',
                  p: 2
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-start' }, gap: { xs: 2, sm: 0 } }}>
                  {/* Origin */}
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                      {flightData.originAirport?.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flightData.departureTime}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(flightData.departureDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>

                  {/* Destination */}
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                      {flightData.arrivalAirport?.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flightData.arrivalTime}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(flightData.segments[flightData.segments.length - 1].arrivalTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Box>

                {/* Flight Path */}
                <Box sx={{ my: 2, position: 'relative' }}>
                  <Box sx={{ 
                    borderTop: '1px dashed',
                    borderColor: alpha(theme.palette.divider, 0.6),
                    position: 'relative',
                    my: 3
                  }}>
                    {/* Plane */}
                    <Box sx={{
                      position: 'absolute',
                      right: '10%',
                      top: '-10px',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(245, 245, 245, 0.8)',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(229, 231, 235, 1)'
                    }}>
                      <Plane size={14} style={{ color: theme.palette.primary.main, transform: 'rotate(90deg)' }} />
                    </Box>

                    {/* Duration */}
                    <Box sx={{
                      position: 'absolute',
                      left: '50%',
                      top: -10,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(245, 245, 245, 0.8)',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      border: '1px solid rgba(229, 231, 235, 1)'
                    }}>
                      <Clock size={14} color={theme.palette.text.primary} />
                      <Typography variant="caption" color="text.primary" fontWeight="medium">
                        {flightData.flightDuration}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Status indicators row - Mobile responsive */}
                  <div style={{ 
                    display: 'flex', 
                    width: '100%',
                    marginTop: '8px',
                    flexDirection: window.innerWidth < 600 ? 'column' : 'row',
                    gap: window.innerWidth < 600 ? '8px' : '0'
                  }}>
                    {/* Left side - baggage */}
                    <div style={{ 
                      flex: 1, 
                      display: 'flex',
                      justifyContent: window.innerWidth < 600 ? 'flex-start' : 'flex-start' 
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                        padding: '4px 10px',
                        borderRadius: '16px',
                        width: window.innerWidth < 600 ? '100%' : 'auto',
                        justifyContent: window.innerWidth < 600 ? 'center' : 'flex-start'
                      }}>
                        <Briefcase size={14} style={{ color: theme.palette.text.secondary }} />
                        <span style={{ 
                          fontSize: '12px', 
                          color: theme.palette.text.secondary,
                          fontWeight: 500
                        }}>{flightData.segments[0].baggage}</span>
                      </div>
                    </div>
                    
                    {/* Middle - stop - EXACTLY CENTERED */}
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      justifyContent: window.innerWidth < 600 ? 'flex-start' : 'center'
                    }}>
                      {flightData.segments && flightData.segments.length > 1 ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: 'rgba(255,170,0,0.08)',
                          border: '1px solid rgba(255,170,0,0.2)',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          width: window.innerWidth < 600 ? '100%' : 'auto',
                          justifyContent: window.innerWidth < 600 ? 'center' : 'flex-start'
                        }}>
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#F59E0B', 
                            fontWeight: 500 
                          }}>
                            {flightData.segments.length - 1} {flightData.segments.length - 1 === 1 ? 'Stop' : 'Stops'}
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            color: theme.palette.text.secondary 
                          }}>
                            {flightData.segments.map(s => s.destination).slice(0, -1).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: 'rgba(34,197,94,0.08)',
                          border: '1px solid rgba(34,197,94,0.2)',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          width: window.innerWidth < 600 ? '100%' : 'auto',
                          justifyContent: window.innerWidth < 600 ? 'center' : 'flex-start'
                        }}>
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#10B981', 
                            fontWeight: 500 
                          }}>Direct Flight</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Right side - refundable */}
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      justifyContent: window.innerWidth < 600 ? 'flex-start' : 'flex-end'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: (flightData.isRefundable || flightData.fareDetails?.isRefundable)
                          ? 'rgba(34,197,94,0.08)'
                          : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${(flightData.isRefundable || flightData.fareDetails?.isRefundable)
                          ? 'rgba(34,197,94,0.2)'
                          : 'rgba(239,68,68,0.2)'}`,
                        padding: '4px 10px',
                        borderRadius: '16px',
                        width: window.innerWidth < 600 ? '100%' : 'auto',
                        justifyContent: window.innerWidth < 600 ? 'center' : 'flex-start'
                      }}>
                        <AlertTriangle size={14} style={{ 
                          color: (flightData.isRefundable || flightData.fareDetails?.isRefundable)
                            ? '#10B981'
                            : '#EF4444'
                        }} />
                        <span style={{ 
                          fontSize: '12px', 
                          color: (flightData.isRefundable || flightData.fareDetails?.isRefundable)
                            ? '#10B981'
                            : '#EF4444', 
                          fontWeight: 500 
                        }}>
                          {(flightData.isRefundable || flightData.fareDetails?.isRefundable) ? 'Refundable' : 'Non-Refundable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Flight Segments */}
        {flightData.segments && flightData.segments.length > 0 && (
          <ModalSection icon={Plane} title="Flight Segments">
            <Stack spacing={2.5}>
              {flightData.segments.map((segment, index) => (
                <Paper
                  key={`${segment.flightNumber || index}`}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '8px',
                    background: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-start' }, gap: { xs: 1, sm: 0 }, mb: { xs: 2, sm: 0 } }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {segment.origin} → {segment.destination}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Flight {segment.flightNumber}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="body2" fontWeight={500}>
                        Duration: {Math.floor(segment.duration / 60)}h {segment.duration % 60}m
                      </Typography>
                      {segment.groundTime > 0 && (
                        <Typography variant="body2" color="warning.main" fontWeight={500}>
                          Layover: {Math.floor(segment.groundTime / 60)}h {segment.groundTime % 60}m
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2, opacity: 0.6 }} />
                  
                  <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          DEPARTURE
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatTime(segment.departureTime, segment.departureTime)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(segment.departureTime)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          ARRIVAL
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatTime(segment.arrivalTime, segment.arrivalTime)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(segment.arrivalTime)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" fontWeight={500}>
                          <Box component="span" sx={{ color: 'text.secondary' }}>Baggage:</Box> {segment.baggage}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="body2" fontWeight={500}>
                          <Box component="span" sx={{ color: 'text.secondary' }}>Cabin:</Box> {segment.cabinBaggage}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </ModalSection>
        )}

        {/* Seat Selection */}
        {flightData.segments && flightData.segments.length > 0 && (
          <ModalSection icon={Armchair} title="Seat Selection">
            {flightData.segments.map((segment, index) => (
              <Box key={`seat-${segment.flightNumber || index}`}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {segment.origin} → {segment.destination}
                </Typography>
                {renderSeatSelection(segment)}
              </Box>
            ))}
          </ModalSection>
        )}

        {/* Meal Selection */}
        {flightData.segments && flightData.segments.length > 0 && (
          <ModalSection icon={Utensils} title="Meal Selection">
            {flightData.segments.map((segment, index) => (
              <Box key={`meal-${segment.flightNumber || index}`}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {segment.origin} → {segment.destination}
                </Typography>
                {renderMealSelection(segment)}
              </Box>
            ))}
          </ModalSection>
        )}

        {/* Baggage Selection */}
        {flightData.segments && flightData.segments.length > 0 && (
          <ModalSection icon={Briefcase} title="Baggage Selection">
            {flightData.segments.map((segment, index) => (
              <Box key={`baggage-${segment.flightNumber || index}`}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {segment.origin} → {segment.destination}
                </Typography>
                {renderBaggageSelection(segment)}
              </Box>
            ))}
          </ModalSection>
        )}

        {/* Fare Rules */}
        {flightData.fareRules && (
          <ModalSection icon={Info} title="Fare Rules">
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '8px',
                background: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              }}
            >
              <Box dangerouslySetInnerHTML={{ __html: flightData.fareRules }} sx={{
                '& li': {
                  marginBottom: '8px',
                  color: theme.palette.text.primary
                },
                '& span': {
                  color: theme.palette.text.primary
                }
              }} />
            </Paper>
          </ModalSection>
        )}

        {/* Important Information */}
        <ModalSection icon={Info} title="Important Information">
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '8px',
              background: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="body2">• Check-in at least 2 hours before departure for international flights</Typography>
              <Typography variant="body2">• Valid photo ID required for security verification</Typography>
              <Typography variant="body2">• Baggage allowance may vary by segment</Typography>
              <Typography variant="body2">• Fare rules and cancellation policies apply</Typography>
            </Stack>
          </Paper>
        </ModalSection>
      </DialogContent>
    </Dialog>
  );
};

export default FlightModal;