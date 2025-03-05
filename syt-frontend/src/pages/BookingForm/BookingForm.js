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
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import axios from "axios";
import { Check, ChevronLeft, Info, Send, UserCheck } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Summary from "../../components/BookingSummary/BookingSummary";
import PriceCheckModal from "../../components/PriceCheckModal/PriceCheckModal";
import ReviewBookingModal from "../../components/ReviewBookingModal/ReviewBookingModal";
import { createBooking } from "../../redux/slices/bookingSlice";
import { resetPriceCheck } from "../../redux/slices/priceCheckSlice";

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

// Custom Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`room-tabpanel-${index}`}
      aria-labelledby={`room-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

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
  
  // New state for active room tab
  const [activeRoomTab, setActiveRoomTab] = useState(0);
  
  // New state for active section (Personal, Travel, Payment)
  const [activeSection, setActiveSection] = useState(0);

  // Local state
  const [countries, setCountries] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success] = useState(false);
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
      background: theme.palette.grey[50],
      minHeight: "100vh",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      pt: { xs: 8, sm: 10 },
      pb: { xs: 4, sm: 6 },
      mt: { xs: 2, md: 0 },
    },
    paper: {
      borderRadius: "12px",
      maxWidth: "1200px",
      width: "100%",
      p: { xs: 0, sm: 0 },
      backgroundColor: theme.palette.background.paper,
      border: "1px solid",
      borderColor: theme.palette.divider,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
      overflow: "hidden",
    },
    formHeader: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      p: 3,
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    },
    mainTabs: {
      borderBottom: 1,
      borderColor: "divider",
      backgroundColor: theme.palette.background.paper,
      "& .MuiTab-root": {
        minHeight: 48,
        textTransform: "none",
      }
    },
    formContent: {
      p: { xs: 2, sm: 4 },
      backgroundColor: theme.palette.background.paper
    },
    roomTabs: {
      borderColor: 'divider',
      mb: 2,
      backgroundColor: theme.palette.grey[50],
      borderRadius: "0",
      "& .MuiTab-root": {
        textTransform: "none",
        minHeight: 42,
        fontSize: "0.95rem",
      }
    },
    sectionTitle: {
      color: theme.palette.text.primary,
      display: "flex",
      alignItems: "center",
      gap: 1,
      mb: 2,
      mt: 1,
      fontSize: "1.1rem",
      fontWeight: 500,
    },
    formSection: {
      mb: 3,
    },
    textField: {
      mt: 0.5,
      "& .MuiOutlinedInput-root": {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
        height: "42px", // Fixed height for inputs
      },
      "& .MuiInputLabel-root": {
        transform: "translate(14px, 13px) scale(1)",
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)",
      },
    },
    select: {
      mt: 0.5,
      "& .MuiOutlinedInput-root": {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
        height: "42px", // Matching height with text fields
      },
      "& .MuiInputLabel-root": {
        transform: "translate(14px, 13px) scale(1)",
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)",
      },
    },
    multilineTextField: {
      mt: 0.5,
      "& .MuiOutlinedInput-root": {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
      },
      "& .MuiInputLabel-root": {
        transform: "translate(14px, 13px) scale(1)",
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)",
      },
    },
    dateField: {
      mt: 0.5,
      "& .MuiOutlinedInput-root": {
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
        height: "42px",
      },
      "& .MuiInputLabel-root": {
        transform: "translate(14px, 13px) scale(1)",
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)",
      },
    },
    accordion: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: "12px",
      transition: "all 0.2s ease",
      border: "1px solid",
      borderColor: theme.palette.divider,
      boxShadow: "none",
      "&:hover": {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
      },
      "& .MuiAccordionSummary-root": {
        backgroundColor: theme.palette.grey[50],
        borderRadius: "12px",
        minHeight: "46px",
        "&.Mui-expanded": {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          minHeight: "46px",
        },
      },
      "& .MuiAccordionDetails-root": {
        backgroundColor: theme.palette.background.paper,
        p: 2.5,
      },
      "& .MuiAccordionSummary-content": {
        margin: "10px 0",
        "&.Mui-expanded": {
          margin: "10px 0",
        }
      }
    },
    submitButton: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      py: "10px",
      px: "20px",
      borderRadius: "12px",
      fontWeight: 600,
      textTransform: "none",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
        backgroundColor: theme.palette.primary.dark,
      },
      "&:disabled": {
        background: theme.palette.action.disabledBackground,
      },
    },
    backButton: {
      borderColor: theme.palette.divider,
      color: theme.palette.text.secondary,
      borderRadius: "12px",
      py: "10px",
      px: "16px",
      fontWeight: 500,
      textTransform: "none",
      "&:hover": {
        borderColor: theme.palette.text.secondary,
        backgroundColor: "rgba(0, 0, 0, 0.03)",
      },
    },
    icon: {
      color: theme.palette.text.secondary,
      marginRight: 1,
    },
    alert: {
      borderRadius: "12px",
      border: "1px solid",
      backgroundColor: "rgba(229, 246, 253, 0.5)", // Very light blue
      borderColor: theme.palette.divider,
      mb: 3,
      "& .MuiAlert-icon": {
        color: theme.palette.primary.main,
      }
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
        specialRequirements: formData.specialRequirements,
        totalAmount: itinerary.priceTotals.grandTotal,
        tcsAmount: itinerary.priceTotals.tcsAmount,
        tcsRate: itinerary.priceTotals.tcsRate
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

  const priceCheck = useSelector(state => state.priceCheck);
  
  const proceedWithBooking = async () => {
    try {
      setLoading(true);
      setError(null);

      const finalItinerary = priceCheck.priceSummary?.updatedItinerary || itinerary;

      navigate("/payment", {
        state: {
          bookingId: formData.bookingId,
          bookingData: formData,
          itinerary: finalItinerary
        }
      });
      const nevigatingState= {
        bookingId: formData.bookingId,
        bookingData: formData,
        itinerary: finalItinerary  
      }
      console.log(nevigatingState);

    } catch (error) {
      console.error("Navigation failed:", error);
      setError("Failed to proceed to payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
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
    if (authLoading) {
      return;
    }

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

    if (!tokens.itinerary || !tokens.inquiry) {
      navigate("/itinerary");
      return;
    }

    const getItineraryData = async () => {
      try {
        setLoading(true);
        const data = await fetchItinerary();
        setItinerary(data);

        if (data.travelersDetails) {
          const roomsWithTravelers = data.travelersDetails.rooms.map(
            (room, roomIndex) => {
              const roomTravelers = {
                roomNumber: roomIndex + 1,
                travelers: [],
              };

              room.adults?.forEach((age) => {
                roomTravelers.travelers.push({
                  ...initialTravelerState,
                  age: age.toString(),
                  type: "adult",
                });
              });

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
  
  // Loading state
  if (authLoading || loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ background: theme.palette.grey[50] }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          {authLoading ? "Verifying authentication..." : "Loading booking form..."}
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error || (!authLoading && (!tokens.itinerary || !tokens.inquiry))) {
    return (
      <Box p={3} sx={{ background: theme.palette.grey[50], minHeight: "100vh" }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mt: 4, borderRadius: "12px" }}>
            <AlertTitle>Error</AlertTitle>
            {error || "Missing required booking information"}
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 2, borderRadius: "12px", textTransform: "none" }}
              onClick={() => navigate("/itinerary")}
            >
              Return to Itinerary
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }

  // No itinerary state
  if (!itinerary) {
    return null;
  }

  // Render room tabs
  const renderRoomTabs = () => {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeRoomTab}
          onChange={(e, newValue) => setActiveRoomTab(newValue)}
          aria-label="room tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={styles.roomTabs}
        >
          {formData.rooms?.map((room, index) => (
            <Tab 
              key={index} 
              label={`Room ${room.roomNumber}`}
              id={`room-tab-${index}`}
              aria-controls={`room-tabpanel-${index}`}
              sx={{ 
                fontWeight: activeRoomTab === index ? 600 : 400,
                color: activeRoomTab === index ? theme.palette.primary.main : theme.palette.text.secondary
              }}
            />
          ))}
        </Tabs>
      </Box>
    );
  };

  // Render traveler form for a room
  const renderTravelerForm = (room, roomIndex) => {
    return (
      <TabPanel value={activeRoomTab} index={roomIndex} key={roomIndex}>
        {room.travelers.map((traveler, travelerIndex) => (
          <Box key={travelerIndex} sx={styles.formSection}>
            <Typography variant="h6" sx={styles.sectionTitle}>
              <UserCheck size={22} />
              {traveler.type === "adult" ? "Adult" : "Child"} {travelerIndex + 1}
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                borderRadius: "12px", 
                border: "1px solid", 
                borderColor: theme.palette.divider,
                mb: 2.5,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
              }}
            >
              <Grid container spacing={2}>
                {/* Basic Details */}
                <Grid item xs={12} sm={3} md={3}>
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
                <Grid item xs={12} sm={4.5} md={4.5}>
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

                <Grid item xs={12} sm={4.5} md={4.5}>
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

                <Grid item xs={12} sm={3} md={3}>
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

                {/* Date of Birth & Age */}
                <Grid item xs={12} sm={4.5}>
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
                    sx={styles.dateField}
                  />
                </Grid>

                <Grid item xs={12} sm={4.5}>
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

                <Grid item xs={12} sm={3}>
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

                <Grid item xs={12} sm={3}>
                  <TextField
                    required
                    fullWidth
                    label="Nationality"
                    value={traveler.nationality || "Indian"}
                    disabled={true}
                    sx={styles.textField}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    required
                    fullWidth
                    label="Country Code"
                    value={traveler.countryCode}
                    disabled={true}
                    sx={styles.textField}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
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
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, mt: 1, fontSize: "0.95rem", color: theme.palette.primary.main }}>
                    Address Information
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                </Grid>

                <Grid item xs={12} sm={3}>
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

                <Grid item xs={12} sm={4.5}>
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

                <Grid item xs={12} sm={4.5}>
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
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, mt: 1, fontSize: "0.95rem", color: theme.palette.primary.main }}>
                    Passport Information
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                </Grid>

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
                    sx={styles.dateField}
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
                    sx={styles.dateField}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, mt: 1, fontSize: "0.95rem", color: theme.palette.primary.main }}>
                    Additional Information
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
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
                  <Accordion sx={styles.accordion}>
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      aria-controls="frequent-flyer-content"
                      id="frequent-flyer-header"
                    >
                      <Typography variant="subtitle1">
                        Frequent Flyer Details (Optional)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
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
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        ))}
      </TabPanel>
    );
  };

  return (
    <React.Fragment>
      <Box sx={styles.formContainer}>
        <Container maxWidth="xl">
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={styles.paper}>
                {/* Form Header */}
                <Box sx={styles.formHeader}>
                  <Typography variant="h4" fontWeight={600}>Complete Your Booking</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                    Please provide traveler details to confirm your reservation
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  <Box sx={styles.formContent}>
                    {/* Room Tabs */}
                    {renderRoomTabs()}
                    
                    {/* Room Content */}
                    {formData.rooms?.map((room, roomIndex) => (
                      renderTravelerForm(room, roomIndex)
                    ))}

                    {/* Special Requirements */}
                    <Box sx={{ mt: 4, mb: 3 }}>
                      <Typography variant="h6" sx={styles.sectionTitle}>
                        <Info size={22} />
                        Special Requirements
                      </Typography>

                      <Alert severity="info" sx={styles.alert}>
                        If you have any special requirements for your trip such as dietary restrictions, medical conditions, or accessibility needs, please let us know so we can better assist you.
                      </Alert>

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
                        placeholder="Enter any special requirements or preferences"
                        sx={styles.multilineTextField}
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
                        startIcon={<ChevronLeft size={18} />}
                        sx={styles.backButton}
                      >
                        Back to Itinerary
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={styles.submitButton}
                        endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                      >
                        {loading ? "Processing..." : "Review & Book"}
                      </Button>
                    </Box>
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
          sx={{ width: "100%", borderRadius: "12px" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={1500}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%", borderRadius: "12px" }}>
          <Check size={20} />
          Booking successful! Redirecting...
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default BookingForm;