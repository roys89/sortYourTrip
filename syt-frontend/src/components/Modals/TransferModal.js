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
  Car,
  CheckCircle,
  Clock,
  Info,
  Luggage,
  MapPin,
  Users,
  X,
  XCircle
} from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/transferSlice';

const TransferModal = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { selectedTransfer, isModalOpen } = useSelector(state => state.transfers);
  const quote = selectedTransfer?.details?.selectedQuote;
  const vehicle = quote?.quote?.vehicle;
  const routeDetails = quote?.routeDetails;

  if (!isModalOpen || !selectedTransfer) return null;

  const formatTransferType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          background: alpha(theme.palette.background.paper, 0.7),
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

  const InfoItem = ({ icon, label, value }) => {
    const Icon = icon;
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '10px',
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.7)}, ${alpha(theme.palette.background.default, 0.7)})`
            : `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.common.white, 0.9)})`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
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
            background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              fontSize: '0.7rem'
            }}
          >
            {label}
          </Typography>
          <Typography 
            variant="subtitle2" 
            fontWeight={600}
            sx={{ 
              color: theme.palette.text.primary,
              mt: 0.5
            }}
          >
            {value}
          </Typography>
        </Box>
      </Paper>
    );
  };

  const FeatureItem = ({ text }) => (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: '20px',
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        mr: 1,
        mb: 1,
      }}
    >
      <Info size={14} style={{ color: theme.palette.primary.main }} />
      <Typography 
        variant="caption" 
        sx={{ 
          color: theme.palette.primary.main,
          fontWeight: 500
        }}
      >
        {text}
      </Typography>
    </Box>
  );

  const LocationInfoCard = ({ title, address, date }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '14px',
        background: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.6)
          : theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark'
          ? `0 4px 20px ${alpha(theme.palette.common.black, 0.2)}`
          : `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
        border: `1px solid ${alpha(theme.palette.primary.main, title.includes('Pickup') ? 0.3 : 0.15)}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.3 : 0.1)}`,
          borderColor: title.includes('Pickup')
            ? alpha(theme.palette.primary.main, 0.5)
            : alpha(theme.palette.secondary.main, 0.5),
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '30%',
          height: '4px',
          background: title.includes('Pickup')
            ? `linear-gradient(to right, transparent, ${theme.palette.primary.main})`
            : `linear-gradient(to right, transparent, ${theme.palette.secondary.main})`,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '12px',
            backgroundColor: title.includes('Pickup')
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.secondary.main, 0.1),
            color: title.includes('Pickup')
              ? theme.palette.primary.main
              : theme.palette.secondary.main,
            flexShrink: 0,
            mt: 0.5
          }}
        >
          {title.includes('Pickup') ? (
            <MapPin size={20} />
          ) : (
            <MapPin size={20} />
          )}
        </Box>
        
        <Box>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              color: title.includes('Pickup')
                ? theme.palette.primary.main
                : theme.palette.secondary.main,
              fontSize: '1.1rem'
            }}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.palette.text.primary,
              mb: date ? 2 : 0,
              fontWeight: 500,
              lineHeight: 1.5
            }}
          >
            {address}
          </Typography>
          
          {date && (
            <Box 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1,
                mt: 2,
                py: 1,
                px: 2,
                borderRadius: '30px',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Clock size={16} style={{ color: theme.palette.primary.main }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}
              >
                {date}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );

  const ServiceStatusBadge = ({ included }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        borderRadius: '10px',
        backgroundColor: included 
          ? alpha(theme.palette.success.main, 0.1)
          : alpha(theme.palette.error.main, 0.1),
        border: `1px solid ${included 
          ? alpha(theme.palette.success.main, 0.2)
          : alpha(theme.palette.error.main, 0.2)
        }`,
        transition: 'all 0.2s ease',
      }}
    >
      {included ? (
        <CheckCircle size={20} style={{ color: theme.palette.success.main }} />
      ) : (
        <XCircle size={20} style={{ color: theme.palette.error.main }} />
      )}
      <Typography 
        variant="body2"
        sx={{ 
          fontWeight: 500, 
          color: included 
            ? theme.palette.success.main
            : theme.palette.error.main
        }}
      >
        Meet & Greet: {included ? 'Included' : 'Not Included'}
      </Typography>
    </Box>
  );

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
            <Car size={22} style={{ color: theme.palette.primary.main }} />
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
              {formatTransferType(selectedTransfer.type)}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: alpha(theme.palette.text.primary, 0.7),
                mt: 0.5,
              }}
            >
              {vehicle?.ve_class} - {vehicle?.ve_similar_types}
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

      {/* Vehicle Image Banner - Part of scrollable content */}
      <DialogContent sx={{ p: 0, '&:first-of-type': { pt: 0 } }}>
        <Box
          component={motion.div}
          variants={itemVariants}
          sx={{ 
            position: 'relative',
            width: '100%',
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.common.black, 0.2)
              : alpha(theme.palette.grey[100], 0.7),
            mb: 3
          }}
        >
          {vehicle?.vehicleImages?.ve_im_url ? (
            <Box
              component="img"
              src={vehicle.vehicleImages.ve_im_url}
              alt={vehicle.ve_similar_types}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '300px',
                objectFit: 'contain',
                objectPosition: 'center',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.common.black, 0.1)
                  : alpha(theme.palette.grey[100], 0.7),
              }}
            >
              <Car 
                size={150} 
                style={{ 
                  color: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.2)
                    : alpha(theme.palette.common.black, 0.1)
                }} 
              />
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mt: 2,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                {vehicle?.ve_class} - {vehicle?.ve_similar_types || "Vehicle Image Not Available"}
              </Typography>
            </Box>
          )}
         
        </Box>

        {/* Content Sections */}
        <Box sx={{ px: 3 }}>
        {/* Vehicle Details */}
        <ModalSection icon={Car} title="Vehicle Details">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <InfoItem 
                icon={Users} 
                label="Capacity" 
                value={`${vehicle?.ve_max_capacity} passengers`} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoItem 
                icon={Luggage} 
                label="Max Luggage" 
                value={`${vehicle?.ve_luggage_capacity} pieces`} 
              />
            </Grid>
          </Grid>

          {vehicle?.ve_tags && vehicle.ve_tags.length > 0 && (
            <Box component={motion.div} variants={itemVariants} sx={{ mt: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1, 
                  color: theme.palette.text.secondary,
                  fontWeight: 500
                }}
              >
                Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {vehicle.ve_tags.map((tag, index) => (
                  <FeatureItem key={index} text={tag} />
                ))}
              </Box>
            </Box>
          )}
        </ModalSection>

        <Divider sx={{ my: 3, opacity: 0.6 }} />

        {/* Journey Details */}
        <ModalSection icon={MapPin} title="Journey Details">
          <Stack spacing={2.5}>
            <LocationInfoCard 
              title="Pickup Location"
              address={selectedTransfer.details.origin?.display_address}
              date={routeDetails?.pickup_date && formatDateTime(routeDetails.pickup_date)}
            />
            
            <LocationInfoCard 
              title="Drop-off Location"
              address={selectedTransfer.details.destination?.display_address}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <InfoItem 
                  icon={Users} 
                  label="Travelers" 
                  value={selectedTransfer.details.totalTravelers} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoItem 
                  icon={MapPin} 
                  label="Distance" 
                  value={selectedTransfer.details.distance} 
                />
              </Grid>
            </Grid>
          </Stack>
        </ModalSection>

        {/* Additional Services */}
        {quote?.quote?.meet_greet !== undefined && (
          <ModalSection icon={Info} title="Additional Services">
            <ServiceStatusBadge included={quote.quote.meet_greet} />
          </ModalSection>
        )}

        {/* Footer with added bottom padding */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 4,
            pt: 3,
            pb: 4, // Added substantial bottom padding
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 600,
                mb: 0.5
              }}
            >
              Premium Transfer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All taxes and fees included
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
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transform: "translateY(-2px)",
                }
              }}
            >
              close
            </Button>
          </Box>
        </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;