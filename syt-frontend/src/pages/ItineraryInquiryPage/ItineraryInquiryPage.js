import {
  AttachMoney,
  DirectionsWalk,
  Event,
  Favorite,
  FlightTakeoff,
  Group,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  Modal,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import DepartureCityForm from "../../components/ItineraryInquiryForm/DepartureCityForm/DepartureCityForm";
import DepartureDateForm from "../../components/ItineraryInquiryForm/DepartureDateForm/DepartureDateForm";
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
    includeGroundTransfer: false,
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
  const steps = [
    "Select City",
    "Departure City",
    "Departure Date",
    "Travelers Details",
    "Preferences",
    "Review",
  ];

  const icons = [
    <DirectionsWalk />,
    <FlightTakeoff />,
    <Event />,
    <Group />,
    <Favorite />,
    <AttachMoney />,
  ];

  // Check validity of location state
  const isValid = useMemo(() => {
    return !!(destination && destinationType);
  }, [destination, destinationType]);

  // Navigation handlers
  const handleNext = useCallback(() => setActiveStep((prev) => prev + 1), []);
  const handleBack = useCallback(() => setActiveStep((prev) => prev - 1), []);

  // Form handlers
  const saveSelectedCities = useCallback((selectedCities) => {
    setItineraryData((prev) => ({ ...prev, selectedCities }));
  }, []);

  const saveDepartureCityData = useCallback((departureCityData) => {
    setItineraryData((prev) => ({
      ...prev,
      departureCity: departureCityData.selectedCity,
      includeInternational: departureCityData.includeInternational,
      includeGroundTransfer: departureCityData.includeGroundTransfer,
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

  // Render active step content
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
        return (
          <DepartureCityForm
            handleNext={handleNext}
            handleBack={handleBack}
            saveDepartureCityData={saveDepartureCityData}
            selectedDepartureCity={itineraryData.departureCity}
            selectedPreferences={{
              includeInternational: itineraryData.includeInternational,
              includeGroundTransfer: itineraryData.includeGroundTransfer,
              includeFerryTransport: itineraryData.includeFerryTransport,
            }}
          />
        );
      case 2:
        return (
          <DepartureDateForm
            handleNext={handleNext}
            handleBack={handleBack}
            saveDateData={saveDepartureDates}
            initialStartDate={itineraryData.departureDates.startDate}
            initialEndDate={itineraryData.departureDates.endDate}
          />
        );
      case 3:
        return (
          <TravelersDetailsForm
            handleNext={handleNext}
            handleBack={handleBack}
            saveTravelersDetails={saveTravelersDetails}
            travelersDetails={itineraryData.travelersDetails}
          />
        );
      case 4:
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
      case 5:
        return <ReviewForm itineraryData={itineraryData} />;
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <div className="inquiry-container">
        <Grid container justifyContent="center" sx={{ width: '100%', m: 0, p: 0 }}>
          <Grid item xs={12} md={7} lg={6} sx={{ width: '100%', p: { xs: 1, sm: 2 }, height: '100%' }}>
            <Box className="inquiry-box" sx={{
              backgroundColor: theme.palette.mode === "dark" ? "rgba(51, 51, 51, 0.9)" : "rgba(255, 209, 174, 0.9)",
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: { xs: '16px', sm: '24px' },
              width: '100%',
              maxWidth: '900px',
              mx: 'auto',
              boxSizing: 'border-box',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  pb: { xs: 1, sm: 2 },
                  width: '100%',
                  overflowX: 'hidden',
                  '& .MuiStepConnector-line': {
                    minWidth: { xs: '20px', sm: '40px' }
                  }
                }}
              >
                {steps.map((label, index) => (
                  <Step 
                    key={label}
                    sx={{
                      flex: 1,
                      maxWidth: { xs: '20%', sm: 'none' },
                    }}
                  >
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            color: activeStep === index
                              ? theme.palette.primary.main
                              : theme.palette.grey[500],
                            '& > svg': {
                              fontSize: { xs: '20px', sm: '24px' }
                            }
                          }}
                        >
                          {icons[index]}
                        </Box>
                      )}
                      sx={{
                        '& .MuiStepLabel-labelContainer': {
                          display: 'none' // Hide the text labels
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box mt={2} sx={{
                "& .MuiGrid-container": {
                  margin: 0,
                  width: "100%",
                },
              }}>
                {renderActiveStep()}
              </Box>

              <Box mt={2} display="flex" justifyContent={activeStep === 0 ? "center" : "space-between"} sx={{
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
                "& .MuiButton-root": {
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "120px" },
                },
              }}>
                {activeStep > 0 && (
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    sx={{
                      borderRadius: "30px",
                      order: { xs: 2, sm: 1 },
                    }}
                  >
                    Back
                  </Button>
                )}

                <Button
                  variant="contained"
                  onClick={
                    activeStep === 4
                      ? handleReview
                      : activeStep === 5
                      ? handleGetCost
                      : handleNext
                  }
                  sx={{
                    borderRadius: "30px",
                    order: { xs: 1, sm: 2 },
                  }}
                >
                  {activeStep === 5 ? "Get Cost" : "Next"}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

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
            backgroundColor: theme.palette.mode === "dark" ? "rgba(46, 46, 46)" : "rgba(255, 239, 226)",
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
              <Typography variant="h6" gutterBottom sx={{ textAlign: "center" }}>
                Your adventure starts here!
              </Typography>

              <Typography variant="body1" gutterBottom sx={{ textAlign: "center", mb: 2 }}>
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
                  sx={{ minWidth: "120px" }}
                >
                  Sign Up
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowSignUp(false)}
                  sx={{ minWidth: "120px" }}
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
      </div>
    </LocalizationProvider>
  );
};

export default ItineraryInquiryPage;