import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
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
  useTheme,
} from "@mui/material";

import axios from "axios";
import { Check, ChevronLeft, Hotel, Info, Send, UserCheck } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Summary from "../../components/BookingSummary/BookingSummary";
import PriceCheckModal from "../../components/PriceCheckModal/PriceCheckModal";
import ReviewBookingModal from "../../components/ReviewBookingModal/ReviewBookingModal";
import { createBooking } from "../../redux/slices/bookingSlice";
import { resetPriceCheck } from "../../redux/slices/priceCheckSlice";
import { transformBookingData } from "../../utils/bookingDataTransformer";

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
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Get auth state from Redux
  const { isAuthenticated, loading: authLoading } = useSelector(
    (state) => state.auth
  );

  
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);

  // Local state
  const [countries, setCountries] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    travelers: [],
    rooms: [
      {
        roomNumber: 1,
        travelers: [],
      },
    ],
    specialRequirements: "",
  });

  const initialTravelerState = useMemo(
    () => ({
      title: "Mr",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      age: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      nationality: "Indian",
      weight: "",
      height: "",
      preferredLanguage: "",
      foodPreference: "",
      type: "adult",
      gender: "male",
      addressLineOne: "",
      addressLineTwo: "",
      city: "",
      country: "India",
      cellCountryCode: "91",
      countryCode: "IN",
      panNumber: "",
      frequentFlyerAirlineCode: null,
      frequentFlyerNumber: null,
      gstCompanyAddress: null,
      gstCompanyContactNumber: null,
      gstCompanyEmail: null,
      gstCompanyName: null,
      gstNumber: null,
    }),
    []
  );

  // Get tokens from location state first, then URL params
  const tokens = {
    itinerary:
      location.state?.itineraryToken ||
      new URLSearchParams(location.search).get("token"),
    inquiry:
      location.state?.inquiryToken ||
      new URLSearchParams(location.search).get("inquiry"),
  };

  // Styles
  const styles = {
    formContainer: {
      position: "relative",
      background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/assets/images/booking_back.jpg')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      minHeight: "100vh",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      pt: { xs: 8, sm: 12 },
      pb: { xs: 4, sm: 6 },
    },
    paper: {
      borderRadius: { xs: "8px", sm: "16px" },
      maxWidth: "1200px",
      width: "100%",
      p: { xs: 2, sm: 4 },
      backgroundColor:
        theme.palette.mode === "light"
          ? "rgba(255, 255, 255, 0.5)"
          : "rgba(66, 66, 66, 0.5)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    },
    roomSection: {
      backgroundColor:
        theme.palette.mode === "light"
          ? "rgba(255, 255, 255, 0.2)"
          : "rgba(66, 66, 66, 0.2)",
      borderRadius: "16px",
      p: 4,
      mb: 4,
    },
    travelerSection: {
      backgroundColor:
        theme.palette.mode === "light"
          ? "rgba(248, 249, 250, 0.5)"
          : "rgba(48, 48, 48, 0.5)",
      borderRadius: "12px",
      p: 3,
      mb: 3,
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)",
        transform: "translateY(-5px)",
      },
    },
    specialRequirements: {
      backgroundColor:
        theme.palette.mode === "light"
          ? "rgba(240, 242, 245, 0.5)"
          : "rgba(48, 48, 48, 0.5)",
      borderRadius: "12px",
      p: 3,
      mt: 2,
    },
    sectionTitle: {
      color: theme.palette.primary.main,
      display: "flex",
      alignItems: "center",
      gap: 1,
      mb: 3,
    },
    textField: {
      mt: 1,
      "& .MuiOutlinedInput-root": {
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
        },
      },
    },
    select: {
      "& .MuiOutlinedInput-root": {
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
        },
      },
    },
    accordion: {
      backgroundColor:
        theme.palette.mode === "light"
          ? "rgba(248, 249, 250, 0.5)"
          : "rgba(48, 48, 48, 0.5)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderRadius: "12px",
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)",
        transform: "translateY(-2px)",
      },
      "& .MuiAccordionSummary-root": {
        backgroundColor: "transparent",
        borderRadius: "12px",
        "&.Mui-expanded": {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
      },
      "& .MuiAccordionDetails-root": {
        backgroundColor: "transparent",
      },
      "& .MuiPaper-root": {
        backgroundColor: "transparent",
      },
    },
    submitButton: {
      background: "linear-gradient(45deg, #4a90e2, #50c878)",
      color: "white",
      py: "12px",
      px: "24px",
      borderRadius: "30px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "1px",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
      "&:hover": {
        transform: "scale(1.05)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
      },
      "&:disabled": {
        background: theme.palette.action.disabledBackground,
      },
    },
    backButton: {
      borderColor: theme.palette.secondary.main,
      color: theme.palette.secondary.main,
      "&:hover": {
        borderColor: theme.palette.secondary.dark,
        backgroundColor: `${theme.palette.secondary.light}20`,
      },
    },
    icon: {
      color: theme.palette.text.secondary,
      marginRight: 1,
    },
  };

  // API Functions
  const fetchCountries = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/countries");
      return response.data;
    } catch (error) {
      console.error("Error fetching countries:", error);
      return [];
    }
  };

  const fetchItinerary = useCallback(async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/itinerary/${tokens.itinerary}`,
        {
          headers: {
            "X-Inquiry-Token": tokens.inquiry,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch itinerary"
      );
    }
  }, [tokens.itinerary, tokens.inquiry]);

  // Form handling functions
  const handleTravelerChange = (roomIndex, travelerIndex, field, value) => {
    setFormData((prev) => {
      const updatedRooms = [...prev.rooms];
      const room = updatedRooms[roomIndex];
      const updatedTravelers = [...room.travelers];

      if (field === "gender") {
        const defaultTitles = { male: "Mr", female: "Ms", other: "Mr" };
        updatedTravelers[travelerIndex].gender = value;
        updatedTravelers[travelerIndex].title = defaultTitles[value];
      } else if (field === "country") {
        const selectedCountry = countries.find((c) => c.name === value);
        if (selectedCountry) {
          updatedTravelers[travelerIndex] = {
            ...updatedTravelers[travelerIndex],
            country: value,
            nationality: selectedCountry.nationality || "Indian",
            countryCode: selectedCountry.countryCode || "IN",
            cellCountryCode: (selectedCountry.code || "+91").replace("+", ""),
          };
        }
      } else {
        updatedTravelers[travelerIndex] = {
          ...updatedTravelers[travelerIndex],
          [field]: value,
        };
      }

      if (field === "dateOfBirth" && value) {
        updatedTravelers[travelerIndex].age = calculateAge(value).toString();
        updatedTravelers[travelerIndex].type =
          calculateAge(value) >= 12 ? "adult" : "child";
      }

      updatedRooms[roomIndex] = { ...room, travelers: updatedTravelers };
      return { ...prev, rooms: updatedRooms };
    });
  };

  const validateForm = () => {
    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      dateOfBirth: "Date of Birth",
      passportNumber: "Passport Number",
      passportIssueDate: "Passport Issue Date",
      passportExpiryDate: "Passport Expiry Date",
      nationality: "Nationality",
      weight: "Weight",
      height: "Height",
      preferredLanguage: "Preferred Language",
      foodPreference: "Food Preference",
      gender: "Gender",
      addressLineOne: "Address Line 1",
      city: "City",
      panNumber: "PAN Number",
    };

    let isValid = true;
    let missingFields = [];

    formData.rooms?.forEach((room, roomIndex) => {
      room.travelers.forEach((traveler, travelerIndex) => {
        const missing = Object.entries(requiredFields)
          .filter(([field]) => !traveler[field]?.toString().trim())
          .map(([, label]) => label);

        if (missing.length > 0) {
          isValid = false;
          missingFields.push({
            room: roomIndex + 1,
            traveler: travelerIndex + 1,
            fields: missing,
          });
        }
      });
    });

    if (!isValid) {
      const errorMessage = missingFields
        .map(
          ({ room, traveler, fields }) =>
            `Room ${room}, Traveler ${traveler}:\n${fields.join(", ")}`
        )
        .join("\n\n");
      setError(
        `Please fill in the following required fields:\n\n${errorMessage}`
      );
    }

    return isValid;
  };



// Add this utility function at the top of the file
const generateBookingId = () => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `BK-${timestamp}-${randomPart}`;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const bookingId = generateBookingId();

    const result = await dispatch(createBooking({
      bookingId,
      itineraryToken: tokens.itinerary,
      inquiryToken: tokens.inquiry,
      userInfo: itinerary?.userInfo || {},
      rooms: formData.rooms,
      specialRequirements: formData.specialRequirements
    })).unwrap();

    if (result.success) {
      setFormData(prev => ({
        ...prev,
        bookingId
      }));
      setShowReviewModal(true);
    }

  } catch (error) {
    setError(error.message || "Failed to process form");
  } finally {
    setLoading(false);
  }
};

// Add new function for handling review confirmation

  // Separate function for the actual booking process
  const proceedWithBooking = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const transformedTravelersDetails = {
        type: itinerary.travelersDetails.type,
        rooms: formData.rooms.map((room) => {
          const adults = room.travelers
            .filter((t) => t.type === "adult")
            .map((t) => t.age);
  
          const children = room.travelers
            .filter((t) => t.type === "child")
            .map((t) => t.age);
  
          return {
            adults,
            children,
          };
        }),
      };
  
      const bookingData = transformBookingData(itinerary, {
        bookingId: generateBookingId(), // Regenerate booking ID for final booking
        travelers: formData.rooms.flatMap((room) => room.travelers),
        rooms: formData.rooms,
        specialRequirements: formData.specialRequirements,
        travelersDetails: transformedTravelersDetails,
      });
  
      const result = await dispatch(createBooking(bookingData)).unwrap();
  
      setSuccess(true);
  
      setTimeout(() => {
        navigate("/booking-confirmation", {
          state: {
            bookingId: result.data.bookingId,
            bookingData: result.data,
            itinerary: itinerary,
          },
        });
      }, 1500);
    } catch (error) {
      console.error("Booking failed:", error);
      setError(error.message || "Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setShowPriceCheckModal(false);
    dispatch(resetPriceCheck());
  };


  // Fetch countries on mount
  useEffect(() => {
    const getCountries = async () => {
      const countryData = await fetchCountries();
      setCountries(countryData);
    };
    getCountries();
  }, []);

  // Combined effect for auth check and data fetching
  useEffect(() => {
    // Skip effect if auth is still loading
    if (authLoading) {
      return;
    }

    // Only proceed with data fetching if authenticated
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname,
          search: location.search,
          itineraryToken: tokens.itinerary,
          inquiryToken: tokens.inquiry,
        },
        replace: true,
      });
      return;
    }

    // Token validation after auth check
    if (!tokens.itinerary || !tokens.inquiry) {
      navigate("/itinerary");
      return;
    }

    const getItineraryData = async () => {
      try {
        setLoading(true);
        const data = await fetchItinerary();
        setItinerary(data);

        // Initialize travelers from itinerary data
        if (data.travelersDetails) {
          const roomsWithTravelers = data.travelersDetails.rooms.map(
            (room, roomIndex) => {
              const roomTravelers = {
                roomNumber: roomIndex + 1,
                travelers: [],
              };

              // Add adult travelers with complete initial state
              room.adults?.forEach((age) => {
                roomTravelers.travelers.push({
                  ...initialTravelerState,
                  age: age.toString(),
                  type: "adult",
                });
              });

              // Add child travelers with complete initial state
              room.children?.forEach((age) => {
                roomTravelers.travelers.push({
                  ...initialTravelerState,
                  age: age.toString(),
                  type: "child",
                });
              });

              return roomTravelers;
            }
          );

          setFormData({
            rooms: roomsWithTravelers,
            specialRequirements: "",
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getItineraryData();
  }, [
    authLoading,
    isAuthenticated,
    tokens.itinerary,
    tokens.inquiry,
    fetchItinerary,
    navigate,
    location.pathname,
    location.search,
    initialTravelerState,
  ]);
  // Show loading state for auth or data fetching
  if (authLoading || loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          {authLoading
            ? "Verifying authentication..."
            : "Loading booking form..."}
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error || (!authLoading && (!tokens.itinerary || !tokens.inquiry))) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error || "Missing required booking information"}
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{ mt: 2 }}
            onClick={() => navigate("/itinerary")}
          >
            Return to Itinerary
          </Button>
        </Alert>
      </Box>
    );
  }

  // No itinerary state
  if (!itinerary) {
    return null;
  }
  return (
    <React.Fragment>
      <Box sx={styles.formContainer}>
        <Container maxWidth="xl">
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={styles.paper}>
                <Typography variant="h4" sx={styles.sectionTitle}>
                  <UserCheck size={32} />
                  Complete Your Booking
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                  {formData.rooms?.map((room, roomIndex) => (
                    <Box key={roomIndex} sx={styles.roomSection}>
                      <Typography variant="h5" sx={styles.sectionTitle}>
                        <Hotel size={28} />
                        Room {room.roomNumber}
                      </Typography>

                      {room.travelers.map((traveler, travelerIndex) => (
                        <Box key={travelerIndex} sx={styles.travelerSection}>
                          <Typography variant="h6" sx={styles.sectionTitle}>
                            <UserCheck size={24} />
                            {traveler.type === "adult" ? "Adult" : "Child"}{" "}
                            {travelerIndex + 1}
                          </Typography>
                          <Grid container spacing={3}>
                            {/* Basic Details */}
                            <Grid item xs={12} sm={6}>
                              <FormControl
                                fullWidth
                                required
                                sx={styles.select}
                              >
                                <InputLabel>Gender</InputLabel>
                                <Select
                                  value={traveler.gender}
                                  onChange={(e) =>
                                    handleTravelerChange(
                                      roomIndex,
                                      travelerIndex,
                                      "gender",
                                      e.target.value
                                    )
                                  }
                                  disabled={loading}
                                  label="Gender"
                                >
                                  <MenuItem value="male">Male</MenuItem>
                                  <MenuItem value="female">Female</MenuItem>
                                  <MenuItem value="other">Other</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl
                                fullWidth
                                required
                                sx={styles.select}
                              >
                                <InputLabel>Title</InputLabel>
                                <Select
                                  value={traveler.title}
                                  onChange={(e) =>
                                    handleTravelerChange(
                                      roomIndex,
                                      travelerIndex,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  disabled={loading}
                                  label="Title"
                                >
                                  <MenuItem value="Mr">Mr</MenuItem>
                                  <MenuItem value="Mrs">Mrs</MenuItem>
                                  <MenuItem value="Ms">Ms</MenuItem>
                                  <MenuItem value="Dr">Dr</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="First Name"
                                value={traveler.firstName}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "firstName",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="Last Name"
                                value={traveler.lastName}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "lastName",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            {/* Date of Birth & Age */}
                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Date of Birth"
                                type="date"
                                value={traveler.dateOfBirth}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "dateOfBirth",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                InputLabelProps={{ shrink: true }}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                label="Age"
                                value={traveler.age}
                                disabled
                                sx={styles.textField}
                              />
                            </Grid>
                            {/* Contact & Country Details */}
                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="Email"
                                type="email"
                                value={traveler.email}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "email",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <FormControl
                                fullWidth
                                required
                                sx={styles.select}
                              >
                                <InputLabel>Country</InputLabel>
                                <Select
                                  value={traveler.country}
                                  onChange={(e) =>
                                    handleTravelerChange(
                                      roomIndex,
                                      travelerIndex,
                                      "country",
                                      e.target.value
                                    )
                                  }
                                  label="Country"
                                  disabled={loading}
                                >
                                  {countries.map((country) => (
                                    <MenuItem
                                      key={country.countryCode}
                                      value={country.name}
                                    >
                                      {country.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Nationality"
                                value={traveler.nationality || "Indian"}
                                disabled={true}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                required
                                fullWidth
                                label="Country Code"
                                value={traveler.countryCode}
                                disabled={true}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <TextField
                                required
                                fullWidth
                                label="Phone Country Code"
                                value={traveler.cellCountryCode}
                                disabled={true}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="Phone Number"
                                value={traveler.phone}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "phone",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>
                            {/* Address Details */}
                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="City"
                                value={traveler.city}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "city",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="Address Line 1"
                                value={traveler.addressLineOne}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "addressLineOne",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Address Line 2"
                                value={traveler.addressLineTwo}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "addressLineTwo",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            {/* Passport Details */}
                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Passport Number"
                                value={traveler.passportNumber}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "passportNumber",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Passport Issue Date"
                                type="date"
                                value={traveler.passportIssueDate}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "passportIssueDate",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                InputLabelProps={{ shrink: true }}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <TextField
                                required
                                fullWidth
                                label="Passport Expiry Date"
                                type="date"
                                value={traveler.passportExpiryDate}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "passportExpiryDate",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                InputLabelProps={{ shrink: true }}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                required
                                fullWidth
                                label="PAN Number"
                                value={traveler.panNumber}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "panNumber",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>
                            {/* Additional Info */}
                            <Grid item xs={12} sm={3}>
                              <TextField
                                required
                                fullWidth
                                label="Weight (kg)"
                                type="number"
                                value={traveler.weight}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "weight",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                              <TextField
                                required
                                fullWidth
                                label="Height (cm)"
                                type="number"
                                value={traveler.height}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "height",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <FormControl
                                fullWidth
                                required
                                sx={styles.select}
                              >
                                <InputLabel>Preferred Language</InputLabel>
                                <Select
                                  value={traveler.preferredLanguage}
                                  onChange={(e) =>
                                    handleTravelerChange(
                                      roomIndex,
                                      travelerIndex,
                                      "preferredLanguage",
                                      e.target.value
                                    )
                                  }
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
                              <FormControl
                                fullWidth
                                required
                                sx={styles.select}
                              >
                                <InputLabel>Food Preference</InputLabel>
                                <Select
                                  value={traveler.foodPreference}
                                  onChange={(e) =>
                                    handleTravelerChange(
                                      roomIndex,
                                      travelerIndex,
                                      "foodPreference",
                                      e.target.value
                                    )
                                  }
                                  label="Food Preference"
                                  disabled={loading}
                                >
                                  <MenuItem value="Vegetarian">
                                    Vegetarian
                                  </MenuItem>
                                  <MenuItem value="Non-Vegetarian">
                                    Non-Vegetarian
                                  </MenuItem>
                                  <MenuItem value="Vegan">Vegan</MenuItem>
                                  <MenuItem value="Halal">Halal</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            {/* GST Details Section */}
                            {traveler.type === "adult" && (
                              <Grid item xs={12}>
                                <Accordion sx={styles.accordion}>
                                  <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    aria-controls="gst-content"
                                    id="gst-header"
                                  >
                                    <Typography variant="subtitle1">
                                      GST Details (Optional)
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          fullWidth
                                          label="GST Number"
                                          value={traveler.gstNumber || ""}
                                          onChange={(e) =>
                                            handleTravelerChange(
                                              roomIndex,
                                              travelerIndex,
                                              "gstNumber",
                                              e.target.value
                                            )
                                          }
                                          disabled={loading}
                                          sx={styles.textField}
                                        />
                                      </Grid>

                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          fullWidth
                                          label="Company Name"
                                          value={traveler.gstCompanyName || ""}
                                          onChange={(e) =>
                                            handleTravelerChange(
                                              roomIndex,
                                              travelerIndex,
                                              "gstCompanyName",
                                              e.target.value
                                            )
                                          }
                                          disabled={loading}
                                          sx={styles.textField}
                                        />
                                      </Grid>

                                      <Grid item xs={12}>
                                        <TextField
                                          fullWidth
                                          label="Company Address"
                                          value={
                                            traveler.gstCompanyAddress || ""
                                          }
                                          onChange={(e) =>
                                            handleTravelerChange(
                                              roomIndex,
                                              travelerIndex,
                                              "gstCompanyAddress",
                                              e.target.value
                                            )
                                          }
                                          disabled={loading}
                                          sx={styles.textField}
                                        />
                                      </Grid>

                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          fullWidth
                                          label="Company Email"
                                          type="email"
                                          value={traveler.gstCompanyEmail || ""}
                                          onChange={(e) =>
                                            handleTravelerChange(
                                              roomIndex,
                                              travelerIndex,
                                              "gstCompanyEmail",
                                              e.target.value
                                            )
                                          }
                                          disabled={loading}
                                          sx={styles.textField}
                                        />
                                      </Grid>

                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          fullWidth
                                          label="Company Contact"
                                          value={
                                            traveler.gstCompanyContactNumber ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleTravelerChange(
                                              roomIndex,
                                              travelerIndex,
                                              "gstCompanyContactNumber",
                                              e.target.value
                                            )
                                          }
                                          disabled={loading}
                                          sx={styles.textField}
                                        />
                                      </Grid>
                                    </Grid>
                                  </AccordionDetails>
                                </Accordion>
                              </Grid>
                            )}

                            {/* Frequent Flyer Section */}
                            <Grid item xs={12}>
                              <Typography
                                variant="subtitle1"
                                sx={{ mt: 2, mb: 1 }}
                              >
                                Frequent Flyer Details (Optional)
                              </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Airline Code"
                                value={traveler.frequentFlyerAirlineCode || ""}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "frequentFlyerAirlineCode",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Frequent Flyer Number"
                                value={traveler.frequentFlyerNumber || ""}
                                onChange={(e) =>
                                  handleTravelerChange(
                                    roomIndex,
                                    travelerIndex,
                                    "frequentFlyerNumber",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                                sx={styles.textField}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Box>
                  ))}

                  {/* Special Requirements Section */}
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          specialRequirements: e.target.value,
                        }))
                      }
                      disabled={loading}
                      placeholder="Enter any special requirements or medical conditions"
                      sx={styles.textField}
                    />
                  </Box>

                  {/* Form Buttons */}
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
  {loading ? "Processing..." : "Review & Book"}  {/* Updated button text */}
</Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Summary itinerary={itinerary} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <ReviewBookingModal 
  open={showReviewModal}
  onClose={() => setShowReviewModal(false)}
  formData={formData}
  itinerary={itinerary}
  tokens={tokens}
  onAllocationComplete={() => {
    setShowReviewModal(false);
    setShowPriceCheckModal(true);
  }}
/>

   <PriceCheckModal
        open={showPriceCheckModal}
        onClose={handleModalClose}
        onConfirm={proceedWithBooking}
        itinerary={itinerary}
        tokens={tokens}
      />


      {/* Snackbars for Error and Success */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={1500}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          <Check size={20} />
          Booking successful! Redirecting...
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default BookingForm;