import {
  ArrowBack,
  ArrowForward,
  AttachMoney,
  DirectionsWalk,
  Favorite,
  FlightTakeoff,
  Group
} from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  Modal,
  Typography,
  useTheme
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import DepartureDetailsForm from "../../components/ItineraryInquiryForm/DepartureDetailsForm/DepartureDetailsForm";
import PreferencesForm from "../../components/ItineraryInquiryForm/PreferencesForm/PreferencesForm";
import ReviewForm from "../../components/ItineraryInquiryForm/ReviewForm/ReviewForm";
import SelectCityForm from "../../components/ItineraryInquiryForm/SelectCityForm/SelectCityForm";
import TravelersDetailsForm from "../../components/ItineraryInquiryForm/TravelersDetailsForm/TravelersDetailsForm";
import SignIn from "../../components/SignIn/SignIn";
import SignUp from "../../components/SignUp/SignUp";
import "./ItineraryInquiryPage.css";

const ItineraryInquiryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Redux state
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Local state
  const [activeStep, setActiveStep] = useState(0);
  const [isSignUpPopupOpen, setIsSignUpPopupOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(true);
  const { destination, destinationType } = location.state || {};

  // Form state
  const [itineraryData, setItineraryData] = useState({
    selectedCities: [],
    departureCity: null,
    departureDates: { startDate: "", endDate: "" },
    travelersDetails: {
      type: "",
      rooms: [],
    },
    preferences: {
      selectedInterests: [],
      budget: "",
    },
    includeInternational: false,
    includeGroundTransfer: true, // Always set to true by default
    includeFerryTransport: false,
    userInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

  // Update user info when authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      setItineraryData((prev) => ({
        ...prev,
        userInfo: {
          userId: user._id || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
        },
      }));
    }
  }, [user, isAuthenticated]);

  // Configuration
  // Updated steps to reflect combined departure form
  const steps = [
    "Select Cities",
    "Departure Details", // Updated step name
    "Travelers Details",
    "Preferences",
    "Review",
  ];

  const icons = [
    <DirectionsWalk />,
    <FlightTakeoff />,
    <Group />,
    <Favorite />,
    <AttachMoney />,
  ];

  // Check validity of location state
  const isValid = useMemo(() => {
    return !!(destination && destinationType);
  }, [destination, destinationType]);

  // Navigation handlers with animated line transitions
  const handleNext = useCallback(() => {
    setActiveStep((prev) => {
      // Animate current step content
      const nextStep = document.querySelector(`.step-${prev}`);
      if (nextStep) {
        nextStep.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
          nextStep.style.animation = 'fadeIn 0.5s ease';
        }, 300);
      }
      
      return prev + 1;
    });
  }, []);
  
  const handleBack = useCallback(() => {
    setActiveStep((prev) => {
      // Animate current step content
      const currentStep = document.querySelector(`.step-${prev}`);
      if (currentStep) {
        currentStep.style.animation = 'fadeOutRight 0.3s ease forwards';
        setTimeout(() => {
          currentStep.style.animation = 'fadeInLeft 0.5s ease';
        }, 300);
      }
      
      return prev - 1;
    });
  }, []);

  // Form handlers
  const saveSelectedCities = useCallback((selectedCities) => {
    setItineraryData((prev) => ({ ...prev, selectedCities }));
  }, []);

  const saveDepartureCityData = useCallback((departureCityData) => {
    setItineraryData((prev) => ({
      ...prev,
      departureCity: departureCityData.selectedCity,
      includeInternational: departureCityData.includeInternational,
      includeGroundTransfer: true, // Always set to true, ignoring the value from the form
      includeFerryTransport: departureCityData.includeFerryTransport,
    }));
  }, []);

  const saveDepartureDates = useCallback((departureDates) => {
    setItineraryData((prev) => ({ ...prev, departureDates }));
  }, []);

  const saveTravelersDetails = useCallback((travelersDetails) => {
    setItineraryData((prev) => ({ ...prev, travelersDetails }));
  }, []);

  const savePreferences = useCallback((selectedInterests, budget) => {
    setItineraryData((prev) => ({
      ...prev,
      preferences: {
        selectedInterests: Array.isArray(selectedInterests) ? selectedInterests : [],
        budget,
      },
    }));
  }, []);

  const handleReview = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Cost calculation and submission
  const handleGetCost = useCallback(async () => {
    if (!isAuthenticated) {
      setIsSignUpPopupOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        "http://localhost:5000/api/itineraryInquiry",
        {
          ...itineraryData,
          includeGroundTransfer: true, // Ensure it's always true when submitting
          userId: user?._id
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { itineraryInquiryToken } = response.data;
      navigate("/itinerary", { state: { itineraryInquiryToken } });
    } catch (error) {
      console.error("Error saving itinerary inquiry:", error);
      if (error.response?.status === 401) {
        setIsSignUpPopupOpen(true);
      }
    }
  }, [itineraryData, isAuthenticated, navigate, user]);

  // Auth handlers
  const handleSignUpSuccess = useCallback(() => {
    setIsSignUpPopupOpen(false);
    handleGetCost();
  }, [handleGetCost]);

  const handleSignInSuccess = useCallback(() => {
    setIsSignUpPopupOpen(false);
    handleGetCost();
  }, [handleGetCost]);

  // Redirect if invalid state
  if (!isValid) {
    navigate("/");
    return null;
  }

  // Render active step content - Updated to use DepartureDetailsForm
  const renderActiveStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <SelectCityForm
            handleNext={handleNext}
            destinationType={destinationType}
            destination={destination}
            saveSelectedCities={saveSelectedCities}
          />
        );
      case 1:
        // Using DepartureDetailsForm to combine city and date forms
        return (
          <DepartureDetailsForm
            handleNext={handleNext}
            handleBack={handleBack}
            saveDepartureCityData={saveDepartureCityData}
            saveDateData={saveDepartureDates}
            selectedDepartureCity={itineraryData.departureCity}
            selectedPreferences={{
              includeInternational: itineraryData.includeInternational,
              // Ground transfer preference removed from UI but kept in data structure
              includeFerryTransport: itineraryData.includeFerryTransport,
            }}
            initialStartDate={itineraryData.departureDates.startDate}
            initialEndDate={itineraryData.departureDates.endDate}
          />
        );
      case 2:
        return (
          <TravelersDetailsForm
            handleNext={handleNext}
            handleBack={handleBack}
            saveTravelersDetails={saveTravelersDetails}
            travelersDetails={itineraryData.travelersDetails}
          />
        );
      case 3:
        return (
          <PreferencesForm
            handleNext={handleNext}
            handleBack={handleBack}
            selectedInterests={itineraryData.preferences.selectedInterests}
            setSelectedInterests={(interests) =>
              savePreferences(interests, itineraryData.preferences.budget)
            }
            budget={itineraryData.preferences.budget}
            setBudget={(budget) =>
              savePreferences(itineraryData.preferences.selectedInterests, budget)
            }
          />
        );
      case 4:
        return <ReviewForm itineraryData={itineraryData} />;
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <Box 
        className="inquiry-container" 
        sx={{ 
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          pt: '64px', // Restored navbar space
        }}
      >
      {/* Stepper with Fixed First Step Animation */}
<Box className="stepper-container" sx={{ 
  position: 'relative', 
  width: '100%',
  padding: '32px 0',
  backgroundColor: theme.palette.background.default
}}>
  <Box sx={{ 
    maxWidth: '1200px', 
    margin: '0 auto',
    px: { xs: 2, sm: 4, md: 6 },
    position: 'relative'
  }}>
    {/* Steps container */}
    <Box sx={{ 
      display: 'flex',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      {/* Background line with exact width between first and last icons */}
      <Box sx={{
        position: 'absolute',
        left: '27px', // Half icon width
        right: '27px', // Half icon width
        top: { xs: '24px', md: '27px' }, // Center of icon
        height: '3px',
        backgroundColor: 'rgba(9, 57, 35, 0.2)',
        zIndex: 1
      }} />
      
      {/* Active/completed line with exact positioning */}
      <Box 
        className={activeStep === 0 ? '' : 'progress-line-active'}
        sx={{
          position: 'absolute',
          left: '27px', // Half icon width
          width: activeStep === 0 ? '0%' : 
                 activeStep === 1 ? '25%' : 
                 activeStep === 2 ? '50%' : 
                 activeStep === 3 ? '75%' : 
                 activeStep === 4 ? 'calc(100% - 54px)' : '0%',
          top: { xs: '24px', md: '27px' }, // Center of icon
          height: '3px',
          backgroundColor: '#093923',
          zIndex: 2,
          transition: 'width 0.6s ease-in-out',
          // Initialize with width 0 for the first step animation
          ...(activeStep === 1 && {
            animation: 'fillFirstStep 0.6s ease-in-out forwards'
          })
        }} 
      />
      
      {/* Step icons and labels */}
      {steps.map((label, index) => (
        <Box 
          key={`step-${index}`}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 3 // Ensure above the lines
          }}
        >
          {/* Step icon */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 48, md: 54 },
            height: { xs: 48, md: 54 },
            borderRadius: '50%',
            backgroundColor: activeStep >= index 
              ? '#093923' 
              : theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(239, 239, 239, 1)',
            color: activeStep >= index 
              ? '#fff' 
              : theme.palette.text.secondary,
            transition: 'background-color 0.3s ease' // Only color transition
          }}>
            {icons[index]}
          </Box>
          
          {/* Step label */}
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 1,
              textAlign: 'center',
              fontWeight: activeStep === index ? 600 : 400,
              color: activeStep === index ? '#093923' : theme.palette.text.secondary,
              maxWidth: { xs: '70px', sm: '100px' },
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
</Box>

        {/* Main content area */}
        <Box 
          className="content-area"
          sx={{ 
            position: 'relative',
            // Removed fixed height and overflow
            pt: 2,
            pb: 10,
            px: { xs: 2, sm: 3, md: 4 } 
          }}
        >
          <Grid container justifyContent="center">
            <Grid item xs={12} md={10} lg={8}>
              <div className={`step-content step-${activeStep}`} style={{
                width: '100%',
                animation: 'fadeIn 0.5s ease',
                opacity: 1,
                transform: 'translateX(0)'
              }}>
                {renderActiveStep()}
              </div>
            </Grid>
          </Grid>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ position: 'relative' }}>
          {/* Left (Back) Button */}
          {activeStep > 0 && (
            <Button
              variant="text"
              onClick={handleBack}
              className="nav-button-back"
              disableRipple
            >
              <div className="button-content">
                <div className="nav-icon">
                  <ArrowBack />
                </div>
                <div className="nav-button-text">
                  <span>Back</span>
                  <Typography 
                    variant="caption" 
                    className="nav-caption"
                  >
                    {steps[activeStep - 1]}
                  </Typography>
                </div>
              </div>
            </Button>
          )}

          {/* Right (Next/Submit) Button */}
          <Button
            variant="text"
            onClick={
              activeStep === 3
                ? handleReview
                : activeStep === 4
                ? handleGetCost
                : handleNext
            }
            className="nav-button-next"
            disableRipple
          >
            <div className="button-content">
              <div className="nav-button-text">
                <span>{activeStep === 4 ? "Get Cost" : "Next"}</span>
                <Typography 
                  variant="caption" 
                  className="nav-caption"
                >
                  {activeStep === 4 ? "Submit" : steps[activeStep + 1]}
                </Typography>
              </div>
              <div className="nav-icon">
                <ArrowForward />
              </div>
            </div>
          </Button>
        </Box>

        {/* Auth Modal */}
        <Modal
          open={isSignUpPopupOpen}
          onClose={() => setIsSignUpPopupOpen(false)}
          aria-labelledby="authentication-modal"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <Box sx={{
            width: "95%",
            maxWidth: showSignUp ? "800px" : "400px",
            backgroundColor: theme.palette.background.paper,
            borderRadius: "12px",
            boxShadow: 24,
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            "&:focus": { outline: "none" },
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: "4px",
            },
          }}>
            <Box sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: "center", color: theme.palette.text.primary }}>
                Your adventure starts here!
              </Typography>

              <Typography variant="body1" gutterBottom sx={{ textAlign: "center", mb: 2, color: theme.palette.text.secondary }}>
                Sign up or sign in to start crafting your perfect travel itinerary.
              </Typography>

              <Box sx={{
                display: "flex",
                gap: 2,
                mb: 3,
                justifyContent: "center",
                width: "100%",
              }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowSignUp(true)}
                  sx={{ 
                    minWidth: "120px",
                    borderRadius: "30px",
                    backgroundColor: showSignUp ? theme.palette.primary.main : 'transparent',
                    color: showSignUp ? '#fff' : theme.palette.text.primary,
                    border: showSignUp ? 'none' : `1px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      backgroundColor: showSignUp ? theme.palette.primary.dark : 'rgba(42, 157, 143, 0.1)'
                    }
                  }}
                >
                  Sign Up
                </Button>
                <Button
                  variant={showSignUp ? "outlined" : "contained"}
                  onClick={() => setShowSignUp(false)}
                  sx={{ 
                    minWidth: "120px",
                    borderRadius: "30px",
                    backgroundColor: !showSignUp ? theme.palette.primary.main : 'transparent',
                    color: !showSignUp ? '#fff' : theme.palette.text.primary,
                    border: !showSignUp ? 'none' : `1px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      backgroundColor: !showSignUp ? theme.palette.primary.dark : 'rgba(42, 157, 143, 0.1)'
                    }
                  }}
                >
                  Sign In
                </Button>
              </Box>

              <Box sx={{ width: "100%" }}>
                {showSignUp ? (
                  <SignUp
                    handleClose={() => setIsSignUpPopupOpen(false)}
                    onSignUpSuccess={handleSignUpSuccess}
                  />
                ) : (
                  <SignIn
                    handleClose={() => setIsSignUpPopupOpen(false)}
                    onLoginSuccess={handleSignInSuccess}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Modal>
      </Box>
    </LocalizationProvider>
  );
};

export default ItineraryInquiryPage;