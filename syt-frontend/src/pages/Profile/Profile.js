import {
  Cake as CakeIcon,
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  Flag as FlagIcon,
  LocationCity as LocationIcon,
  Phone as PhoneIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Snackbar,
  Typography,
  useTheme
} from '@mui/material';
import axios from 'axios';
import { CreditCard, RefreshCw, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useSelector(state => state.auth);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [error, setError] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:5000/api/auth/itineraries', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          console.log('Itineraries:', response.data);
          const itinerariesData = response.data.itineraries;
          
          // Fetch booking status for each itinerary
          const itinerariesWithBookingStatus = await Promise.all(
            itinerariesData.map(async (itinerary) => {
              try {
                const bookingResponse = await axios.get(
                  `http://localhost:5000/api/booking/itinerary/by-itinerary/${itinerary.itineraryToken}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  }
                );
                
                if (bookingResponse.data.data) {
                  return {
                    ...itinerary,
                    bookingData: bookingResponse.data.data
                  };
                }
                
                return itinerary;
              } catch (error) {
                console.error('Error fetching booking for itinerary:', itinerary.itineraryToken, error);
                return itinerary;
              }
            })
          );
          
          setItineraries(itinerariesWithBookingStatus);
        }
      } catch (error) {
        console.error('Error fetching itineraries:', error.response || error);
        setError(error.response?.data?.message || 'Failed to fetch itineraries');
        setSnackbar({
          open: true,
          message: 'Failed to fetch itineraries',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchItineraries();
    } else {
      setLoading(false);
    }
  }, [user?._id]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  const handleViewItinerary = async (itinerary) => {
    try {
      const token = localStorage.getItem('token');
      let bookingData;
      
      // Helper function to navigate to itinerary page (used in multiple places)
      const navigateToItinerary = () => {
        navigate('/itinerary', {
          state: {
            itineraryInquiryToken: itinerary.inquiryToken,
            origin: 'profile'
          },
          replace: true
        });
      };
      
      // Use booking data if we already have it from initial fetch, otherwise fetch it
      if (itinerary.bookingData) {
        bookingData = itinerary.bookingData;
      } else {
        // Fetch booking data if not already available
        const response = await axios.get(`http://localhost:5000/api/booking/itinerary/by-itinerary/${itinerary.itineraryToken}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        bookingData = response.data.data;
      }
      
      // If no booking data exists, proceed to itinerary page
      if (!bookingData) {
        navigateToItinerary();
        return;
      }

      // Handle different payment statuses
      switch (bookingData.paymentStatus) {
        case 'completed':
          // For completed payments, navigate to booking confirmation
          console.log('Navigating to booking confirmation with data:', {
            bookingId: bookingData.bookingId,
            paymentSuccess: true,
            itinerary: {
              itineraryToken: itinerary.itineraryToken,
              inquiryToken: itinerary.inquiryToken
            },
            bookingData
          });

          navigate('/booking-confirmation', {
            state: {
              bookingId: bookingData.bookingId, 
              paymentSuccess: true,
              itinerary: {
                itineraryToken: itinerary.itineraryToken,
                inquiryToken: itinerary.inquiryToken
              },
              bookingData
            },
            replace: true
          });
          break;

        case 'pending':
          // For pending payments, fetch complete itinerary and navigate to payment
          try {
            // Fetch complete itinerary details
            const itineraryResponse = await axios.get(
              `http://localhost:5000/api/itinerary/${itinerary.itineraryToken}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'x-inquiry-token': itinerary.inquiryToken
                }
              }
            );

            const completeItinerary = itineraryResponse.data;
            
            console.log('Navigating to payment with data:', {
              bookingId: bookingData.bookingId,
              bookingData,
              itinerary: completeItinerary,
            });

            navigate('/payment', {
              state: {
                bookingId: bookingData.bookingId,
                bookingData,
                itinerary: completeItinerary,
              },
              replace: true
            });
          } catch (error) {
            // If error fetching complete itinerary, show error and fall back to itinerary page
            console.error('Error fetching complete itinerary:', error);
            setSnackbar({
              open: true,
              message: 'Error fetching itinerary details',
              severity: 'error'
            });
            navigateToItinerary();
          }
          break;
            
        case 'failed':
        default:
          // For failed payments or default case, go to itinerary page
          navigateToItinerary();
          break;
      }
    } catch (error) {
      // Handle any other errors
      console.error('Error checking booking status:', error);
      setSnackbar({
        open: true,
        message: 'Error checking booking status. Redirecting to itinerary page.',
        severity: 'error'
      });
      // In case of error, default to itinerary page
      navigate('/itinerary', {
        state: {
          itineraryInquiryToken: itinerary.inquiryToken,
          origin: 'profile'
        },
        replace: true
      });
    }
  };

  const handleDelete = async (inquiryToken) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [inquiryToken]: true }));
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5000/api/itinerary/${inquiryToken}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setItineraries(prev => prev.filter(itinerary => itinerary.inquiryToken !== inquiryToken));
      setSnackbar({
        open: true,
        message: 'Itinerary deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting itinerary:', error.response || error);
      setSnackbar({
        open: true,
        message: 'Failed to delete itinerary',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(prev => ({ ...prev, [inquiryToken]: false }));
    }
  };

  const InfoItem = ({ icon, label, value }) => (
    <Box 
      sx={{ 
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        overflow: 'hidden',
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 20, color: theme.palette.primary.main } })}
      <Box sx={{ overflow: 'hidden', flex: 1 }}>
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
        <Typography 
          variant="body1" 
          fontWeight="medium"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

  const ProfileSection = () => (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, #2A2A2A 0%, #3A3A3A 100%)'
          : 'linear-gradient(145deg, #FFFFFF 0%, #F8F8F8 100%)',
        borderRadius: 2,
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
        }
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="center">
          {loading ? (
            <Skeleton variant="circular" width={120} height={120} />
          ) : (
            <Avatar
              alt={`${user.firstName} ${user.lastName}`}
              src="/assets/images/profile-placeholder.png"
              sx={{
                width: 120,
                height: 120,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            />
          )}
        </Grid>

        <Grid item xs={12} textAlign="center">
          {loading ? (
            <>
              <Skeleton variant="text" width={200} height={40} sx={{ mx: 'auto' }} />
              <Skeleton variant="text" width={150} height={24} sx={{ mx: 'auto' }} />
            </>
          ) : (
            <>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {`${user.firstName} ${user.lastName}`}
              </Typography>
            </>
          )}
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        <Grid container item xs={12} spacing={2}>
          {loading ? (
            [...Array(4)].map((_, index) => (
              <Grid item xs={12} key={index}>
                <Skeleton variant="rectangular" height={60} />
              </Grid>
            ))
          ) : (
            <>
              <Grid item xs={12}>
                <InfoItem icon={<EmailIcon />} label="Email" value={user.email} />
              </Grid>
              <Grid item xs={12}>
                <InfoItem icon={<PhoneIcon />} label="Phone" value={user.phoneNumber} />
              </Grid>
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={6}>
                  <InfoItem icon={<FlagIcon />} label="Country" value={user.country} />
                </Grid>
                <Grid item xs={6}>
                  <InfoItem 
                    icon={<CakeIcon />} 
                    label="Birthday" 
                    value={new Date(user.dob).toLocaleDateString()} 
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Grid>

        <Grid item xs={12} display="flex" justifyContent="center" mt={4}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogout}
            sx={{
              minWidth: 200,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(0,0,0,0.15)',
              },
            }}
          >
            Logout
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  const ItineraryCard = ({ itinerary }) => {
    // Get payment status and booking ID if available
    const bookingData = itinerary.bookingData;
    const paymentStatus = bookingData?.paymentStatus;
    const bookingId = bookingData?.bookingId;
    
    // Determine button text and icon based on payment status
    let buttonText = "View Itinerary";
    let buttonIcon = <ViewIcon sx={{ fontSize: 18 }} />;
    
    switch (paymentStatus) {
      case 'completed':
        buttonText = "View Booking";
        buttonIcon = <ViewIcon sx={{ fontSize: 18 }} />;
        break;
      case 'pending':
        buttonText = "Pay Now";
        buttonIcon = <CreditCard size={18} />;
        break;
      case 'failed':
        buttonText = "Retry Itinerary";
        buttonIcon = <RefreshCw size={18} />;
        break;
      default:
        // Default already set
        break;
    }
    
    // Determine chip color and text based on payment status
    let chipColor = "default";
    let chipText = "";
    
    switch (paymentStatus) {
      case 'completed':
        chipColor = "success";
        chipText = "PAID";
        break;
      case 'pending':
        chipColor = "warning";
        chipText = "PAYMENT PENDING";
        break;
      case 'failed':
        chipColor = "error";
        chipText = "FAILED";
        break;
      default:
        // No chip for default case
        break;
    }
    
    return (
      <Card 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
          },
          position: 'relative'
        }}
      >
        {chipText && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Chip 
              label={chipText} 
              color={chipColor} 
              sx={{ 
                fontWeight: 'bold', 
                fontSize: '0.9rem',
                padding: '20px 16px',
                height: 'auto',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                border: '2px solid',
                borderColor: theme => theme.palette[chipColor].main
              }} 
            />
          </Box>
        )}
        <CardContent sx={{ pb: 1, pt: 2, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Box display="flex" alignItems="center" gap={1} flex={1}>
                <LocationIcon sx={{ fontSize: 20 }} />
                <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                  {itinerary.cities.map(city => city.city).join(' → ')}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={buttonIcon}
                  onClick={() => handleViewItinerary(itinerary)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    height: '100%',
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  {buttonText}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 size={18} />}
                  onClick={() => handleDelete(itinerary.inquiryToken)}
                  disabled={deleteLoading[itinerary.inquiryToken]}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    height: '100%',
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.error.main,
                      color: 'white',
                    },
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon sx={{ fontSize: 20 }} />
                <Typography color="textSecondary">
                  {new Date(itinerary.cities[0].startDate).toLocaleDateString()} - {' '}
                  {new Date(itinerary.cities[itinerary.cities.length - 1].endDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                {/* Show booking ID for all cases where it exists */}
                {bookingId && (
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Booking ID: {bookingId}
                  </Typography>
                )}
                
                {/* Show payment ID if it exists (checking multiple possible paths) */}
                {(bookingData?.razorpay?.paymentId) && (
                  
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                    Payment ID: {bookingData?.razorpay?.id || bookingData?.razorpay?.paymentId || bookingData?.payment?.id}
                  </Typography>
                )}
                
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: '2rem', py: 4, px: { xs: 1, sm: 2, md: 4 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={4}>
          <ProfileSection />
        </Grid>

        <Grid item xs={12} md={8} lg={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #2A2A2A 0%, #3A3A3A 100%)'
                : 'linear-gradient(145deg, #FFFFFF 0%, #F8F8F8 100%)',
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ fontSize: 24 }} />
              Your Itineraries
            </Typography>

            {loading ? (
              [...Array(3)].map((_, index) => (
                <Skeleton key={index} variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
              ))
            ) : itineraries?.length > 0 ? (
              itineraries.map((itinerary, index) => (
                <ItineraryCard 
                  key={itinerary.itineraryToken || index} 
                  itinerary={itinerary} 
                />
              ))
            ) : (
              <Typography color="textSecondary" align="center">
                No itineraries found
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;