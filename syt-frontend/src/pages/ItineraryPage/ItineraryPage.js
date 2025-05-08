import {
    Attractions as AttractionsIcon,
    CalendarMonth as CalendarIcon,
    KeyboardArrowDown as ChevronDownIcon,
    ArrowForwardIos as ChevronRightIcon,
    Paid as DollarIcon,
    Edit as EditIcon,
    Flight as FlightIcon,
    Restaurant as FoodIcon,
    Favorite as HeartIcon,
    Hotel as HotelIcon,
    Luggage as LuggageIcon,
    LocationOn as MapPinIcon,
    PictureAsPdf as PdfIcon,
    PeopleAlt as PeopleIcon,
    SupportAgent as SupportIcon,
    DirectionsCar as TransportIcon,
} from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Chip,
    CircularProgress,
    Container,
    Drawer,
    Grid,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Alert as MuiAlert,
    AlertTitle as MuiAlertTitle,
    Snackbar,
    Typography,
    useTheme,
} from "@mui/material";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorBoundary from "../../components/ErrorBoundary";
import ItineraryDay from "../../components/Itinerary/ItineraryDay";
import PriceSummary from "../../components/Itinerary/PriceSummary";
import ItineraryMap from "../../components/Map/ItineraryMap";
import ModalManager from "../../components/ModalManager";
import ModificationModal from "../../components/ModificationModal/ModificationModal";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { useAuth } from "../../context/AuthContext";
import { clearAllActivityStates } from "../../redux/slices/activitySlice";
import {
    createItinerary,
    fetchItinerary,
    resetItineraryState,
} from "../../redux/slices/itinerarySlice";
import { generateItineraryPDF } from "../../utils/pdfGenerator";
import { calculateItineraryTotal } from "../../utils/priceCalculations";
import "./ItineraryPage.css";

// Helper function to render activity icons based on activity type
const renderActivityIcon = (activityType, theme, size = 20) => {
  switch (activityType?.toLowerCase()) {
    case "flight":
      return (
        <FlightIcon
          sx={{ color: theme.palette.primary.main, fontSize: size }}
        />
      );
    case "transport":
      return (
        <TransportIcon
          sx={{ color: theme.palette.primary.main, fontSize: size }}
        />
      );
    case "hotel":
    case "accommodation":
      return (
        <HotelIcon sx={{ color: theme.palette.primary.main, fontSize: size }} />
      );
    case "food":
    case "restaurant":
      return (
        <FoodIcon sx={{ color: theme.palette.primary.main, fontSize: size }} />
      );
    case "attraction":
    case "activity":
    case "sightseeing":
      return (
        <AttractionsIcon
          sx={{ color: theme.palette.primary.main, fontSize: size }}
        />
      );
    default:
      return (
        <LuggageIcon
          sx={{ color: theme.palette.primary.main, fontSize: size }}
        />
      );
  }
};

const ItineraryPage = () => {
  console.log('=== ItineraryPage Component Mounting ===');

  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCity, setExpandedCity] = useState(null);
  const dayRefs = useRef({});

  // States
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingProgress, setBookingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isModificationModalOpen, setIsModificationModalOpen] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modificationError, setModificationError] = useState(null);
  const [isCreatingNewItinerary, setIsCreatingNewItinerary] = useState(false);
  const [showTravelerDetails, setShowTravelerDetails] = useState(false);

  // Hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { inquiryToken: routeInquiryToken } = useParams();
  
  // Extract tokens from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const urlItineraryToken = searchParams.get('itineraryToken');
  const urlInquiryToken = searchParams.get('inquiryToken');
  
  // Redux selectors
  const {
    data: itinerary,
    loading,
    error,
    checkingExisting,
    itineraryToken: reduxItineraryToken,
  } = useSelector((state) => state.itinerary);

  const { markups, tcsRates } = useSelector((state) => state.markup);
  
  // Get inquiry token from URL parameter, state, or route param
  const inquiryToken = urlInquiryToken || location.state?.inquiryToken || routeInquiryToken;
  const itineraryToken = urlItineraryToken || location.state?.itineraryToken || reduxItineraryToken;

  console.log('Initial Component State:', {
    routeInquiryToken,
    locationState: location.state,
    inquiryToken,
    itineraryToken,
    reduxItineraryToken,
    isAuthenticated,
    pathname: location.pathname,
    searchParams: location.search
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle traveler details
  const toggleTravelerDetails = () => {
    setShowTravelerDetails(!showTravelerDetails);
  };

  // Close sidebar when clicking outside
  const handleClickOutside = useCallback(
    (event) => {
      if (
        sidebarOpen &&
        !event.target.closest(".sidebar-paper") &&
        !event.target.closest(".toggle-button")
      ) {
        setSidebarOpen(false);
      }
    },
    [sidebarOpen]
  );

  // Handle accordion expansion
  const handleAccordionChange = (cityIndex) => (event, isExpanded) => {
    setExpandedCity(isExpanded ? cityIndex : null);
  };

  // Navigate to specific day
  const handleDaySelect = (cityIndex, dayIndex) => {
    const dayId = `day-${cityIndex}-${dayIndex}`;
    if (dayRefs.current[dayId]) {
      dayRefs.current[dayId].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setSidebarOpen(false);
    }
  };

  const handleDownloadPDF = () => {
    if (itinerary) {
      generateItineraryPDF(itinerary);
    }
  };

  const handleBookingError = (error) => {
    setBookingError(error.message || "Error processing booking");
    setIsBooking(false);
  };

  const processActivity = async (activity, cityName, date) => {
    if (activity.bookingReference && activity.bookingReference.bookingRef) {
      console.log(
        `Booking reference already exists for activity ${activity.activityName}`
      );
      return true;
    }

    try {
      const referenceResponse = await axios.post(
        "http://localhost:5000/api/itinerary/activity/reference",
        {
          activityCode: activity.activityCode,
          searchId: activity.searchId,
          startTime: activity.packageDetails?.departureTime,
          gradeCode: activity.tourGrade?.gradeCode,
        },
        {
          headers: {
            "X-Inquiry-Token": inquiryToken,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Use reduxItineraryToken as fallback
      const currentItineraryToken = itineraryToken || reduxItineraryToken;
      
      await axios.put(
        `http://localhost:5000/api/itinerary/${currentItineraryToken}/activity/booking-ref`,
        {
          cityName,
          date,
          activityCode: activity.activityCode,
          bookingReference: referenceResponse.data,
        },
        {
          headers: {
            "X-Inquiry-Token": inquiryToken,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error("Error processing activity:", error);
      return false;
    }
  };

  const handlePriceUpdate = async () => {
    try {
      // Use reduxItineraryToken as fallback
      const currentItineraryToken = itineraryToken || reduxItineraryToken;
      
      const totals = calculateItineraryTotal(itinerary, markups, tcsRates);
      await axios.put(
        `http://localhost:5000/api/itinerary/${currentItineraryToken}/prices`,
        {
          priceTotals: {
            ...totals.segmentTotals,
            subtotal: totals.subtotal,
            tcsAmount: totals.tcsAmount,
            tcsRate: totals.tcsRate,
            grandTotal: totals.grandTotal,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating prices:", error);
      throw error;
    }
  };

  const handleModifyItinerary = async (modifiedData) => {
    setIsModifying(true); // Set loading state for the entire modification process
    setModificationError(null);
    const token = localStorage.getItem("token");

    if (!inquiryToken) {
      setModificationError("Inquiry token is missing.");
      setIsModifying(false);
      return;
    }
    if (!token) {
      setModificationError("Authentication token is missing.");
      setIsModifying(false);
      navigate("/auth/login"); // Redirect to login if token is missing
      return;
    }

    try {
      console.log("Step 1: Updating Itinerary Inquiry with token:", inquiryToken);
      console.log("Update Data:", modifiedData);

      // Step 1: Call API to update the Itinerary Inquiry document
      const updateResponse = await axios.put(
        `http://localhost:5000/api/itineraryInquiry/${inquiryToken}`,
        modifiedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (updateResponse.status !== 200) {
        // Handle potential non-200 success codes if necessary, or rely on axios throwing for >= 400
        throw new Error(updateResponse.data?.message || "Failed to update itinerary inquiry details.");
      }

      console.log("Step 1 Success: Inquiry updated.", updateResponse.data);

      // Step 2: Reset Redux state and create the new Itinerary based on the UPDATED inquiry
      console.log("Step 2: Resetting state and creating new itinerary...");
      setIsCreatingNewItinerary(true); // Indicate new itinerary creation phase
      await dispatch(resetItineraryState());
      
      // Instead of using the Redux thunk action that has the existing itinerary check,
      // make a direct API call to the backend which will automatically handle deletion
      // of any existing itinerary with this inquiry token before creating a new one
      const directApiResponse = await axios.post(
        `http://localhost:5000/api/itinerary/${inquiryToken}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update Redux store with the newly created itinerary
      console.log("Step 2 Success: New itinerary created.", directApiResponse.data);
      
      // Update Redux store with the new itinerary data
      dispatch({ 
        type: 'itinerary/createItinerary/fulfilled', 
        payload: directApiResponse.data 
      });

      setIsModificationModalOpen(false); // Close modal only after full success

    } catch (error) {
      console.error("Error during itinerary modification process:", error);
      const errMsg = error.response?.data?.message || error.message || "An error occurred during modification.";
      setModificationError(errMsg);
    } finally {
      setIsCreatingNewItinerary(false); // Reset creation indicator regardless of outcome
      setIsModifying(false); // Reset overall modifying indicator
    }
  };

  const handleBookTrip = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth/login", {
          state: { from: location.pathname },
          replace: true,
        });
        return;
      }

      // Check payment status first
      if (itinerary.paymentStatus === "completed") {
        // If payment is completed, navigate directly to booking confirmation
        navigate("/booking-confirmation", {
          state: {
            bookingId: itinerary.bookingId,
            paymentSuccess: true,
            itinerary,
          },
          replace: true,
        });
        return;
      }

      // If payment is pending, continue with booking process
      if (!itinerary || !markups || !tcsRates) {
        console.error("Missing required data for booking:", {
          hasItinerary: !!itinerary,
          hasMarkups: !!markups,
          hasTcsRates: !!tcsRates,
        });
        return;
      }

      setIsBooking(true);
      setBookingError(null);

      // Use the reduxItineraryToken if itineraryToken is undefined
      const currentItineraryToken = itineraryToken || reduxItineraryToken;
      console.log("Using itinerary token for booking:", currentItineraryToken);

      const onlineActivities = itinerary.cities.flatMap((city) =>
        city.days.flatMap(
          (day) =>
            day.activities?.filter(
              (activity) => activity.activityType === "online"
            ) || []
        )
      );

      const totalItems = onlineActivities.length;
      setBookingProgress({ current: 0, total: totalItems });

      for (const activity of onlineActivities) {
        const cityDay = itinerary.cities
          .flatMap((city) =>
            city.days.map((day) => ({
              cityName: city.city,
              date: day.date,
              activities: day.activities,
            }))
          )
          .find((item) =>
            item.activities?.some(
              (a) => a.activityCode === activity.activityCode
            )
          );

        if (cityDay) {
          const success = await processActivity(
            activity,
            cityDay.cityName,
            cityDay.date
          );
          if (!success) {
            throw new Error(
              `Failed to process activity ${activity.activityName}`
            );
          }

          setBookingProgress((prev) => ({
            ...prev,
            current: prev.current + 1,
          }));
        }
      }

      await handlePriceUpdate();
      navigate("/booking-form", {
        state: {
          itinerary,
          itineraryToken: currentItineraryToken || itineraryToken,
          inquiryToken,
        },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/auth/login", {
          state: { from: location.pathname },
          replace: true,
        });
      } else {
        handleBookingError(error);
      }
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    console.log("ItineraryPage Effect Running:", {
      isAuthenticated,
      inquiryToken,
      itineraryToken,
      pathname: location.pathname,
      isNewRoute: location.pathname.includes('/itinerary/new/')
    });

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/auth/login", {
        state: { 
          from: location.pathname + location.search,
        },
        replace: true,
      });
      return;
    }

    if (!inquiryToken) {
      console.log("No inquiry token found, redirecting to home");
      navigate("/", { replace: true });
      return;
    }

    dispatch(clearAllActivityStates());

    const handleItinerary = async () => {
      try {
        // If we're on the /new route, always create new itinerary
        if (location.pathname.includes('/itinerary/new/')) {
          console.log("Creating new itinerary with inquiry token:", inquiryToken);
          const result = await dispatch(createItinerary(inquiryToken)).unwrap();
          console.log("Successfully created new itinerary:", result);
          
          // Store the newly created itinerary token in URL search params
          const newSearchParams = new URLSearchParams(location.search);
          newSearchParams.set('itineraryToken', result.itineraryToken);
          newSearchParams.set('inquiryToken', inquiryToken);
          
          // Update the URL without causing a navigation
          window.history.replaceState(
            null, 
            '', 
            `${location.pathname.split('?')[0]}?${newSearchParams.toString()}`
          );
          
          console.log("Updated URL with new itinerary token:", result.itineraryToken);
          return;
        }

        // For other routes, try to get existing itinerary first
        if (itineraryToken) {
          console.log("Attempting to fetch existing itinerary:", {
            itineraryToken,
            inquiryToken
          });
          try {
            const result = await dispatch(fetchItinerary({ 
              itineraryToken,
              inquiryToken 
            })).unwrap();
            console.log("Successfully fetched existing itinerary:", result);
            return;
          } catch (err) {
            console.error("Failed to fetch existing itinerary:", err);
          }
        }

        // If no existing itinerary or fetch failed, create new
        console.log("Creating new itinerary (fallback) with inquiry token:", inquiryToken);
        const result = await dispatch(createItinerary(inquiryToken)).unwrap();
        console.log("Successfully created new itinerary (fallback):", result);
        
        // Store the newly created itinerary token in URL search params
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.set('itineraryToken', result.itineraryToken);
        newSearchParams.set('inquiryToken', inquiryToken);
        
        // Update the URL without causing a navigation
        window.history.replaceState(
          null, 
          '', 
          `${location.pathname.split('?')[0]}?${newSearchParams.toString()}`
        );
        
        console.log("Updated URL with new itinerary token:", result.itineraryToken);
      } catch (err) {
        console.error("Error in handleItinerary:", err);
        navigate("/", { replace: true });
      }
    };

    handleItinerary();
  }, [
    dispatch,
    inquiryToken,
    itineraryToken,
    navigate,
    isAuthenticated,
    location.pathname,
    location.search,
  ]);

  // Setup click outside listener in a separate effect
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Get total number of travelers
  const getTotalTravelers = (travelersDetails) => {
    if (!travelersDetails || !travelersDetails.rooms) return 0;

    return travelersDetails.rooms.reduce((total, room) => {
      const adults = room.adults ? room.adults.length : 0;
      const children = room.children ? room.children.length : 0;
      return total + adults + children;
    }, 0);
  };

  // Get duration of trip in days
  const getTripDuration = (cities) => {
    if (!cities || cities.length === 0) return 0;

    const startDate = new Date(cities[0].startDate);
    const endDate = new Date(cities[cities.length - 1].endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    return daysDiff;
  };

  // Format budget for display
  const formatBudget = (budget) => {
    if (!budget) return "Standard";

    const budgetMap = {
      Budget: "Budget-friendly",
      Standard: "Standard",
      Premium: "Premium",
      Luxury: "Luxury",
    };

    return budgetMap[budget] || budget;
  };

  if (loading || checkingExisting) {
    return (
      <div className="loading-container">
        <LoadingSpinner
          message={
            checkingExisting
              ? "Checking your existing itinerary..."
              : "Crafting your perfect journey..."
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-message"
          >
            <MuiAlert severity="error" variant="filled" className="error-alert">
              <MuiAlertTitle>Unable to Load Itinerary</MuiAlertTitle>
              {error}
            </MuiAlert>
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              className="home-button"
            >
              Return Home
            </Button>
          </motion.div>
        </Container>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="loading-container">
        <LoadingSpinner message="Preparing your itinerary details..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className="itinerary-page"
        style={{
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.grey[900]
              : theme.palette.grey[100],
        }}
      >
        {/* Navbar toggle button */}
        <div
          className="navbar-toggle"
          style={{
            left: sidebarOpen ? "240px" : "0",
          }}
        >
          <IconButton
            onClick={toggleSidebar}
            className={`toggle-button ${sidebarOpen ? "open" : ""}`}
            style={{
              backgroundColor:
                theme.palette.mode === "dark"
                  ? `rgba(${theme.palette.grey[800]}, 0.5)`
                  : "rgba(251, 203, 173, 0.5)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <ChevronRightIcon
              sx={{
                fontSize: 28,
                transition: "transform 0.3s ease",
                transform: sidebarOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
              className="arrow-icon"
            />
          </IconButton>
        </div>

        {/* Navigation Sidebar */}
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          variant="persistent"
          className={`sidebar-drawer ${!sidebarOpen ? "closed" : ""}`}
          PaperProps={{
            className: "sidebar-paper",
            sx: {
              width: 240,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.grey[50],
              boxShadow: "0 0 20px rgba(0,0,0,0.2)",
              top: 0,
              paddingTop: 0,
              marginTop: 0,
            },
          }}
        >
          <div className="sidebar-header">
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1,
                mt: 4,
              }}
            ></Typography>
          </div>

          <div className="sidebar-content">
            {itinerary.cities.map((city, cityIndex) => (
              <Accordion
                key={`city-accordion-${cityIndex}`}
                defaultExpanded={cityIndex === 0}
                sx={{
                  mb: 1,
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ChevronDownIcon
                      sx={{
                        fontSize: 18,
                        color: theme.palette.primary.main,
                        transition: "transform 0.3s ease",
                      }}
                    />
                  }
                  sx={{
                    backgroundColor: `${theme.palette.primary.main}15`,
                    "&:hover": {
                      backgroundColor: `${theme.palette.primary.main}20`,
                    },
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <MapPinIcon
                      sx={{
                        color: theme.palette.primary.main,
                        fontSize: 18,
                        animation:
                          expandedCity === cityIndex
                            ? "pulse 2s infinite"
                            : "none",
                        "@keyframes pulse": {
                          "0%": { opacity: 0.7 },
                          "50%": { opacity: 1 },
                          "100%": { opacity: 0.7 },
                        },
                      }}
                    />
                    {city.city}, {city.country}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List disablePadding>
                    {city.days.map((day, dayIndex) => (
                      <ListItemButton
                        key={`day-button-${cityIndex}-${dayIndex}`}
                        onClick={() => handleDaySelect(cityIndex, dayIndex)}
                        sx={{
                          py: 0.75,
                          pl: 3,
                          borderRadius: "6px",
                          mb: 0.5,
                          "&:hover": {
                            backgroundColor: `${theme.palette.primary.main}10`,
                            "& .day-icon": { transform: "scale(1.1)" },
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <CalendarIcon
                          className="day-icon"
                          sx={{
                            marginRight: "8px",
                            color: theme.palette.primary.main,
                            fontSize: 18,
                            transition: "transform 0.2s ease",
                          }}
                        />
                        <ListItemText
                          primary={formatDate(day.date)}
                          primaryTypographyProps={{
                            fontSize: "0.875rem",
                            fontWeight: 400,
                            color: theme.palette.text.primary,
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </Drawer>

        <Container maxWidth="xl" className="main-container">
          {/* Header Section with Trip Overview in One Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="header-section"
          >
            <div
              style={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "center", md: "center" },
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: { xs: 1, md: 1.5 },
                padding: { xs: 1, md: 1.5 },
                mb: 2,
                borderRadius: "12px",
              }}
            >
              {/* Greeting Text - No background */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="h4"
                  className="page-title"
                  sx={{
                    color: theme.palette.text.special,
                    fontSize: { xs: "1.25rem", md: "1.5rem" },
                    marginBottom: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {itinerary.userInfo?.firstName
                    ? `Hi ${itinerary.userInfo.firstName}!`
                    : " "}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                    fontSize: { xs: "1.25rem", md: "1.5rem" },
                    marginBottom: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Your personalized travel itinerary is ready 🎉
                </Typography>
              </div>

              {/* Trip Overview Details - With city-dates style background */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: { xs: "center", md: "flex-end" },
                  gap: { xs: 1, md: 1.5 },
                  alignItems: "center",
                  backgroundColor: "rgba(251, 203, 173, 0.3)",
                  borderRadius: "30px",
                  padding: "0.5rem 1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <CalendarIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 20,
                    }}
                  />
                  <Typography variant="body1">
                    <strong>{getTripDuration(itinerary.cities)}</strong> Days
                  </Typography>
                </div>
                <div
                  style={{
                    paddingLeft: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <MapPinIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 20,
                    }}
                  />
                  <Typography variant="body1">
                    <strong>{itinerary.cities.length}</strong>{" "}
                    {itinerary.cities.length === 1 ? "City" : "Cities"}
                  </Typography>
                </div>
                <div
                  style={{
                    paddingLeft: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <PeopleIcon
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 20,
                    }}
                  />
                  <Typography variant="body1">
                    <strong>
                      {getTotalTravelers(itinerary.travelersDetails)}
                    </strong>{" "}
                    Travelers
                  </Typography>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Area */}
          <Grid container spacing={3} className="content-area">
            {/* Left Side - All Cities and Days */}
            <Grid item xs={12} md={9}>
              {/* Display all cities and days */}
              {itinerary.cities.map((city, cityIndex) => (
                <div key={`city-${cityIndex}`} className="city-section">
                  {/* City Header */}
                  <div
                    className="city-header"
                    style={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.grey[50],
                      color: theme.palette.text.primary,
                    }}
                  >
                    <div className="city-title">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <MapPinIcon
                          sx={{
                            color: theme.palette.primary.main,
                            fontSize: 24,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "scale(1.1)",
                            },
                          }}
                          className="city-icon"
                        />
                        <Typography variant="h5" className="city-name">
                          {city.city}, {city.country}
                        </Typography>
                      </div>
                      <Typography variant="h6" className="city-dates">
                        {formatDate(city.startDate)} -{" "}
                        {formatDate(city.endDate)}
                      </Typography>
                    </div>
                  </div>

                  {/* City Days */}
                  <div className="city-days">
                    {city.days.map((day, dayIndex) => (
                      <div
                        key={`day-${cityIndex}-${dayIndex}`}
                        className="day-wrapper"
                        ref={(el) =>
                          (dayRefs.current[`day-${cityIndex}-${dayIndex}`] = el)
                        }
                        id={`day-${cityIndex}-${dayIndex}`}
                      >
                        <div
                          className="day-content-card"
                          style={{
                            backgroundColor:
                              theme.palette.mode === "dark"
                                ? theme.palette.grey[800]
                                : theme.palette.grey[50],
                            borderRadius: "24px",
                          }}
                        >
                          <ItineraryDay
                            day={day}
                            city={city}
                            inquiryToken={inquiryToken}
                            itineraryToken={itineraryToken}
                            travelersDetails={itinerary.travelersDetails}
                            renderActivityIcon={renderActivityIcon}
                            theme={theme}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Grid>

            {/* Right Side - Price Summary & Booking */}
            <Grid item xs={12} md={3}>
              <div className="sticky-sidebar">
                {/* Modify Itinerary Button - Moved to the top */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ marginBottom: "1.5rem" }}
                >
                  <Button
                    variant="outlined"
                    startIcon={
                      <EditIcon
                        sx={{
                          fontSize: 20,
                          transition: "transform 0.3s ease",
                        }}
                      />
                    }
                    onClick={() => setIsModificationModalOpen(true)}
                    disabled={isBooking || isModifying}
                    className="action-button modify-button"
                    fullWidth
                    sx={{
                      color: theme.palette.text.primary,
                      borderColor: `${theme.palette.primary.main}60`,
                      padding: "0.75rem",
                      borderRadius: "8px",
                      fontWeight: 500,
                      fontFamily: "'Poppins', sans-serif",
                      textTransform: "none",
                      letterSpacing: 0,
                      height: "48px", // Set exact height to match city header
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: `${theme.palette.primary.main}10`,
                        transform: "translateY(-2px)",
                        "& .MuiSvgIcon-root": { transform: "scale(1.1)" },
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isModifying ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Modifying...
                      </>
                    ) : (
                      "Modify Itinerary"
                    )}
                  </Button>
                </motion.div>

                {/* Price Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="price-summary-wrapper"
                  style={{
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 20px rgba(0,0,0,0.3)"
                        : "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                >
                  {itinerary && <PriceSummary itinerary={itinerary} />}
                </motion.div>

                {/* Map */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="price-summary-wrapper"
                  style={{
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[50],
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 20px rgba(0,0,0,0.3)"
                        : "0 4px 20px rgba(0,0,0,0.1)",
                    marginTop: "1.5rem",
                  }}
                >
                  {itinerary && <ItineraryMap itineraryData={itinerary} />}
                </motion.div>

                {/* Travel Preferences */}
                {itinerary.preferences && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.grey[50],
                      borderRadius: "12px",
                      padding: "1.25rem",
                      marginTop: "1.5rem",
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 4px 20px rgba(0,0,0,0.3)"
                          : "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ mb: 1.5, fontWeight: 600, fontSize: "1.1rem" }}
                    >
                      Your Travel Style
                    </Typography>

                    {itinerary.preferences.budget && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <DollarIcon
                          sx={{
                            color: theme.palette.primary.main,
                            fontSize: 20,
                            marginRight: "0.75rem",
                          }}
                        />
                        <div>
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            Budget Level
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {formatBudget(itinerary.preferences.budget)}
                          </Typography>
                        </div>
                      </div>
                    )}

                    {itinerary.preferences.selectedInterests &&
                      itinerary.preferences.selectedInterests.length > 0 && (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <HeartIcon
                              sx={{
                                color: theme.palette.primary.main,
                                fontSize: 20,
                                marginRight: "0.75rem",
                                marginTop: "0.2rem",
                              }}
                            />
                            <div>
                              <Typography
                                variant="body2"
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                Interests
                              </Typography>
                            </div>
                          </div>
                          <div
                            style={{
                              paddingLeft: "2rem",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.5rem",
                            }}
                          >
                            {itinerary.preferences.selectedInterests.map(
                              (interest, index) => (
                                <Chip
                                  key={index}
                                  label={interest}
                                  size="small"
                                  sx={{
                                    backgroundColor: `${theme.palette.primary.main}15`,
                                    color: theme.palette.text.primary,
                                  }}
                                />
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </motion.div>
                )}

                {/* Action Buttons - Removed the Modify button from here */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="action-buttons"
                  style={{ marginTop: "1.5rem" }}
                >
                  <Button
                    variant="contained"
                    startIcon={
                      isBooking ? null : (
                        <FlightIcon
                          sx={{
                            fontSize: 22,
                            transition: "transform 0.3s ease",
                          }}
                        />
                      )
                    }
                    onClick={handleBookTrip}
                    disabled={isBooking}
                    className="action-button book-button"
                    fullWidth
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                        "& .MuiSvgIcon-root": { transform: "translateX(4px)" },
                      },
                    }}
                  >
                    {isBooking ? (
                      <>
                        <CircularProgress
                          size={20}
                          color="inherit"
                          sx={{ mr: 1 }}
                        />
                        Processing...
                      </>
                    ) : (
                      "Book Your Trip"
                    )}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={
                      <PdfIcon
                        sx={{
                          fontSize: 22,
                          transition: "transform 0.3s ease",
                        }}
                      />
                    }
                    onClick={handleDownloadPDF}
                    disabled={isBooking}
                    className="action-button pdf-button"
                    fullWidth
                    sx={{
                      color: theme.palette.text.primary,
                      borderColor: `${theme.palette.primary.main}60`,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: `${theme.palette.primary.main}10`,
                        "& .MuiSvgIcon-root": { transform: "scale(1.1)" },
                      },
                    }}
                  >
                    Download PDF
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={
                      <SupportIcon
                        sx={{
                          fontSize: 22,
                          transition: "transform 0.3s ease",
                        }}
                      />
                    }
                    className="action-button contact-button"
                    fullWidth
                    sx={{
                      color: theme.palette.text.primary,
                      borderColor: `${theme.palette.primary.main}60`,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: `${theme.palette.primary.main}10`,
                        "& .MuiSvgIcon-root": { transform: "scale(1.1)" },
                      },
                    }}
                  >
                    Contact Support
                  </Button>
                </motion.div>
              </div>
            </Grid>
          </Grid>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isBooking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="process-overlay"
              >
                <div
                  className="process-content"
                  style={{
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[50],
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 20px rgba(0,0,0,0.5)"
                        : "0 4px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  <CircularProgress
                    size={50}
                    sx={{ color: theme.palette.primary.main }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    Processing Booking
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {bookingProgress.current} of {bookingProgress.total}{" "}
                    activities
                  </Typography>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Creating New Itinerary Alert */}
          <AnimatePresence>
            {isCreatingNewItinerary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="process-overlay"
              >
                <div
                  className="process-content"
                  style={{
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[50],
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 4px 20px rgba(0,0,0,0.5)"
                        : "0 4px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  <Alert>
                    <AlertTitle>Modifying Itinerary</AlertTitle>
                    <AlertDescription>
                      Please wait while we create your new itinerary with the
                      modified details...
                    </AlertDescription>
                  </Alert>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Snackbar */}
          <AnimatePresence>
            {(bookingError || modificationError) && (
              <Snackbar
                open={Boolean(bookingError || modificationError)}
                autoHideDuration={6000}
                onClose={() => {
                  setBookingError(null);
                  setModificationError(null);
                }}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <MuiAlert
                  severity="error"
                  onClose={() => {
                    setBookingError(null);
                    setModificationError(null);
                  }}
                >
                  <MuiAlertTitle>
                    {bookingError ? "Booking Error" : "Modification Error"}
                  </MuiAlertTitle>
                  {bookingError || modificationError}
                </MuiAlert>
              </Snackbar>
            )}
          </AnimatePresence>

          {/* Modification Modal */}
          <ModificationModal
            open={isModificationModalOpen}
            onClose={() => !isModifying && setIsModificationModalOpen(false)}
            itineraryInquiryToken={inquiryToken}
            onModify={handleModifyItinerary}
            isModifying={isModifying}
          />

          <ModalManager />
        </Container>
      </div>
    </ErrorBoundary>
  );
};

export default ItineraryPage;
