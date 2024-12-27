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
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material';
import axios from 'axios';
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
  const [itineraryLoading, setItineraryLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        setItineraryLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:5000/api/auth/itineraries', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          console.log('Itineraries:', response.data);  // Debug log
          setItineraries(response.data.itineraries);
        }
      } catch (error) {
        console.error('Error fetching itineraries:', error.response || error);  // Enhanced error logging
      } finally {
        setItineraryLoading(false);
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
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

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
              sx={{
                width: 120,
                height: 120,
                bgcolor: theme.palette.primary.main,
                fontSize: '2.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </Avatar>
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

  const ItineraryCard = ({ itinerary }) => {
    return (
    <Card 
      sx={{ 
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Box display="flex" alignItems="center" gap={1} flex={1}>
              <LocationIcon sx={{ fontSize: 20 }} />
              <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                {itinerary.cities.map(city => city.city).join(' → ')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<ViewIcon sx={{ fontSize: 18 }} />}
              onClick={() => navigate('/itinerary', { 
                state: { 
                  itineraryInquiryToken: itinerary.inquiryToken,
                  origin: 'profile'
                },
                replace: true
              })}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                alignSelf: 'center',
                height: '100%',
              }}
            >
              View Itinerary
            </Button>
          </Grid>
          
          <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon sx={{ fontSize: 20 }} />
              <Typography color="textSecondary">
                {new Date(itinerary.cities[0].startDate).toLocaleDateString()} - {' '}
                {new Date(itinerary.cities[itinerary.cities.length - 1].endDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary">
              Itinerary Token: {itinerary.itineraryToken}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );}
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
            ) : itineraryLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <Typography>Loading itineraries...</Typography>
              </Box>
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
    </Container>
  );
};

export default Profile;