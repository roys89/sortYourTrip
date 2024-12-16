import { Check, ChevronLeft } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Calendar,
  IdCard,
  Info,
  MapPin,
  Send,
  UserCheck
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Summary from '../../components/BookingSummary/BookingSummary';

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { data: reduxItinerary } = useSelector((state) => state.itinerary);
  
  const locationItinerary = location.state?.itinerary;
  const bookingItinerary = locationItinerary || reduxItinerary;

  // Form state
  const [formData, setFormData] = useState({
    travelers: [],
    commonActivityAnswers: {},
    specialRequirements: ''
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const styles = {
    formContainer: {
      position: 'relative',
      background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/assets/images/booking_back.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
      justifyContent: 'center',
      pt: { xs: 8, sm: 12 }, // Added top padding
      pb: { xs: 4, sm: 6 }   // Bottom padding
    },
    paper: {
      borderRadius: { xs: '8px', sm: '16px' },
      maxWidth: '1200px',
      width: '100%',
      p: { xs: 2, sm: 4 },
      backgroundColor: theme.palette.mode === 'light' 
        ? 'rgba(255, 255, 255, 0.5)' // More translucent background
        : 'rgba(66, 66, 66, 0.5)',   // More translucent background for dark mode
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    },
    travelerSection: {
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(248, 249, 250, 0.5)' // Make sections more translucent too
        : 'rgba(48, 48, 48, 0.5)',
      borderRadius: '12px',
      p: 3,
      mb: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-5px)'
      }
    },
    specialRequirements: {
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(240, 242, 245, 0.5)' // Make special requirements section more translucent
        : 'rgba(48, 48, 48, 0.5)',
      borderRadius: '12px',
      p: 3,
      mt: 2
    },
    sectionTitle: {
      color: theme.palette.primary.main,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      mb: 3
    },
    textField: {
      mt: 1,
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'transparent', // Remove the white background
        '&:hover': {
          backgroundColor: 'transparent' // Remove hover background too
        }
      }
    },
    // Update select style to match
    select: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'transparent', // Remove the white background
        '&:hover': {
          backgroundColor: 'transparent' // Remove hover background too
        }
      }
    },
    submitButton: {
      background: 'linear-gradient(45deg, #4a90e2, #50c878)',
      color: 'white',
      py: '12px',
      px: '24px',
      borderRadius: '30px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
      },
      '&:disabled': {
        background: theme.palette.action.disabledBackground
      }
    },
    backButton: {
      borderColor: theme.palette.secondary.main,
      color: theme.palette.secondary.main,
      '&:hover': {
        borderColor: theme.palette.secondary.dark,
        backgroundColor: `${theme.palette.secondary.light}20`
      }
    },
    icon: {
      color: theme.palette.text.secondary,
      marginRight: 1
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    if (!bookingItinerary) {
      navigate('/', { replace: true });
      return;
    }

    // Initialize travelers from itinerary
    if (bookingItinerary.travelersDetails) {
      const initialTravelers = [];
      
      if (bookingItinerary.travelersDetails.type === 'family') {
        bookingItinerary.travelersDetails.rooms.forEach(room => {
          // Add adult travelers
          room.adults.forEach(age => {
            initialTravelers.push({
              title: 'Mr.',
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              dateOfBirth: '',
              age: age,
              passportNumber: '',
              passportIssueDate: '',
              passportExpiryDate: '',
              nationality: '',
              weight: '',
              height: '',
              preferredLanguage: '',
              foodPreference: ''
            });
          });

          // Add child travelers
          room.children?.forEach(age => {
            initialTravelers.push({
              title: 'Mr.',
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              dateOfBirth: '',
              age: age,
              passportNumber: '',
              passportIssueDate: '',
              passportExpiryDate: '',
              nationality: '',
              weight: '',
              height: '',
              preferredLanguage: '',
              foodPreference: ''
            });
          });
        });
      }

      setFormData({
        travelers: initialTravelers,
        commonActivityAnswers: {},
        specialRequirements: ''
      });
    }
  }, [isAuthenticated, bookingItinerary, navigate, location.pathname]);

  const handleTravelerChange = (index, field, value) => {
    setFormData(prev => {
      const updatedTravelers = [...prev.travelers];
      updatedTravelers[index] = {
        ...updatedTravelers[index],
        [field]: value
      };

      if (field === 'dateOfBirth' && value) {
        updatedTravelers[index].age = calculateAge(value).toString();
      }

      return {
        ...prev,
        travelers: updatedTravelers
      };
    });
  };

  const validateForm = () => {
    // Validate basic traveler info
    const isTravelerInfoValid = formData.travelers.every(traveler => 
      traveler.firstName &&
      traveler.lastName &&
      traveler.email &&
      traveler.phone &&
      traveler.dateOfBirth &&
      traveler.passportNumber &&
      traveler.passportIssueDate &&
      traveler.passportExpiryDate &&
      traveler.nationality &&
      traveler.weight &&
      traveler.height &&
      traveler.preferredLanguage &&
      traveler.foodPreference
    );

    if (!isTravelerInfoValid) {
      setError('Please fill in all required fields for all travelers');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare booking data for each activity
      const activityBookings = bookingItinerary.cities.flatMap(city => 
        city.days.flatMap(day => 
          (day.activities || [])
            .filter(activity => activity.activityType === 'online')
            .map(activity => ({
              activityCode: activity.activityCode,
              bookingRef: activity.bookingReference?.bookingRef,
              rateKey: `${activity.packageDetails.rateKey}|${activity.bookingReference?.bookingRef}`,
              fromDate: day.date,
              toDate: day.date,
              groupCode: activity.groupCode,
              QuestionAnswers: [
                // Map common questions from traveler info
                ...formData.travelers.flatMap((traveler, index) => [
                  {
                    question: "AGEBAND",
                    answer: parseInt(traveler.age) >= 12 ? "ADULT" : "CHILD",
                    travelerNum: (index + 1).toString()
                  },
                  {
                    question: "FULL_NAMES_FIRST",
                    answer: traveler.firstName,
                    travelerNum: (index + 1).toString()
                  },
                  {
                    question: "FULL_NAMES_LAST",
                    answer: traveler.lastName,
                    travelerNum: (index + 1).toString()
                  },
                  {
                    question: "WEIGHT",
                    answer: traveler.weight,
                    unit: "kg",
                    travelerNum: (index + 1).toString()
                  },
                  {
                    question: "HEIGHT",
                    answer: traveler.height,
                    unit: "cm",
                    travelerNum: (index + 1).toString()
                  }
                ]),
                // Add special requirements if provided
                ...(formData.specialRequirements ? [{
                  question: "SPECIAL_REQUIREMENTS",
                  answer: formData.specialRequirements
                }] : []),
                // Auto-filled answers
                {
                  question: "PICKUP_POINT",
                  answer: "CONTACT_SUPPLIER_LATER"
                },
                {
                  question: "TRANSFER_ARRIVAL_MODE",
                  answer: "OTHER"
                }
              ],
              travelers: formData.travelers.map((traveler, index) => ({
                title: traveler.title,
                name: traveler.firstName,
                surname: traveler.lastName,
                type: parseInt(traveler.age) >= 12 ? 'AD' : 'CH',
                age: traveler.age
              }))
            }))
        )
      );

      const bookingData = {
        itineraryToken: bookingItinerary.itineraryToken,
        inquiryToken: bookingItinerary.inquiryToken,
        travelers: formData.travelers,
        activityBookings
      };

      console.log('Booking data to submit:', bookingData);
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/booking-confirmation', {
          state: { 
            bookingData,
            itinerary: bookingItinerary
          }
        });
      }, 1500);
    } catch (error) {
      console.error('Booking failed:', error);
      setError(error.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !bookingItinerary) {
    return null;
  }

  return (
    <React.Fragment>
      <Box sx={styles.formContainer}>
        <Container maxWidth="xl">
          {bookingItinerary && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12} md={8}>
                <Paper elevation={3} sx={styles.paper}>
                  <Typography variant="h4" sx={styles.sectionTitle}>
                    <UserCheck size={32} />
                    Complete Your Booking
                  </Typography>

                  <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
                    {formData.travelers.map((traveler, index) => (
                      <Box key={index} sx={styles.travelerSection}>
                        <Typography variant="h6" sx={styles.sectionTitle}>
                          <UserCheck size={24} />
                          Traveler {index + 1}
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth sx={styles.select}>
                              <InputLabel>Title</InputLabel>
                              <Select
                                value={traveler.title}
                                onChange={(e) => handleTravelerChange(index, 'title', e.target.value)}
                                disabled={loading}
                              >
                                <MenuItem value="Mr.">Mr.</MenuItem>
                                <MenuItem value="Mrs.">Mrs.</MenuItem>
                                <MenuItem value="Ms.">Ms.</MenuItem>
                                <MenuItem value="Dr.">Dr.</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="First Name"
                              value={traveler.firstName}
                              onChange={(e) => handleTravelerChange(index, 'firstName', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Info size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Last Name"
                              value={traveler.lastName}
                              onChange={(e) => handleTravelerChange(index, 'lastName', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Info size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Email"
                              type="email"
                              value={traveler.email}
                              onChange={(e) => handleTravelerChange(index, 'email', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Info size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Phone"
                              value={traveler.phone}
                              onChange={(e) => handleTravelerChange(index, 'phone', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Info size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Date of Birth"
                              type="date"
                              value={traveler.dateOfBirth}
                              onChange={(e) => handleTravelerChange(index, 'dateOfBirth', e.target.value)}
                              disabled={loading}
                              InputLabelProps={{ shrink: true }}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Calendar size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Age"
                              value={traveler.age}
                              disabled
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Calendar size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Passport Number"
                              value={traveler.passportNumber}
                              onChange={(e) => handleTravelerChange(index, 'passportNumber', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <IdCard size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Nationality"
                              value={traveler.nationality}
                              onChange={(e) => handleTravelerChange(index, 'nationality', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <MapPin size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Passport Issue Date"
                              type="date"
                              value={traveler.passportIssueDate}
                              onChange={(e) => handleTravelerChange(index, 'passportIssueDate', e.target.value)}
                              disabled={loading}
                              InputLabelProps={{ shrink: true }}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Calendar size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Passport Expiry Date"
                              type="date"
                              value={traveler.passportExpiryDate}
                              onChange={(e) => handleTravelerChange(index, 'passportExpiryDate', e.target.value)}
                              disabled={loading}
                              InputLabelProps={{ shrink: true }}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Calendar size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Weight (kg)"
                              type="number"
                              value={traveler.weight}
                              onChange={(e) => handleTravelerChange(index, 'weight', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Info size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              label="Height (cm)"
                              type="number"
                              value={traveler.height}
                              onChange={(e) => handleTravelerChange(index, 'height', e.target.value)}
                              disabled={loading}
                              sx={styles.textField}
                              InputProps={{
                                startAdornment: <Info size={20} style={styles.icon} />
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required sx={styles.select}>
                              <InputLabel>Preferred Language</InputLabel>
                              <Select
                                value={traveler.preferredLanguage}
                                onChange={(e) => handleTravelerChange(index, 'preferredLanguage', e.target.value)}
                                label="Preferred Language"
                                disabled={loading}
                              >
                                <MenuItem value="English">English</MenuItem>
                                <MenuItem value="Hindi">Hindi</MenuItem>
                                <MenuItem value="Arabic">Arabic</MenuItem>
                                <MenuItem value="Spanish">Spanish</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required sx={styles.select}>
                              <InputLabel>Food Preference</InputLabel>
                              <Select
                                value={traveler.foodPreference}
                                onChange={(e) => handleTravelerChange(index, 'foodPreference', e.target.value)}
                                label="Food Preference"
                                disabled={loading}
                              >
                                <MenuItem value="Vegetarian">Vegetarian</MenuItem>
                                <MenuItem value="Non-Vegetarian">Non-Vegetarian</MenuItem>
                                <MenuItem value="Vegan">Vegan</MenuItem>
                                <MenuItem value="Halal">Halal</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}

                    <Box sx={styles.specialRequirements}>
                      <Typography variant="h6" sx={styles.sectionTitle}>
                        <Info size={24} />
                        Special Requirements
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        label="Additional Notes"
                        value={formData.specialRequirements}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          specialRequirements: e.target.value 
                        }))}
                        disabled={loading}
                        placeholder="Enter any special requirements or medical conditions"
                        sx={styles.textField}
                      />
                    </Box>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mt={4}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                        disabled={loading}
                        startIcon={<ChevronLeft />}
                        sx={styles.backButton}
                      >
                        Back to Itinerary
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={styles.submitButton}
                        endIcon={loading ? <CircularProgress size={20} /> : <Send />}
                      >
                        {loading ? 'Processing...' : 'Book Now'}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Summary itinerary={bookingItinerary} />
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={success}
        autoHideDuration={1500}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success"
          sx={{ width: '100%' }}
        >
          <Check size={20} />
          Booking successful! Redirecting...
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default BookingForm;