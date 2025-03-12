import { Close as CloseIcon, Settings as SettingsIcon } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  IconButton,
  Modal,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { motion } from "framer-motion";
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import LoadingSpinner from '../common/LoadingSpinner';
import ModifyCities from './ModificationTabs/ModifyCities';
import ModifyDates from './ModificationTabs/ModifyDates';
import ModifyPreferences from './ModificationTabs/ModifyPreferences';
import ModifyTravelers from './ModificationTabs/ModifyTravelers';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`modification-tabpanel-${index}`}
      aria-labelledby={`modification-tab-${index}`}
    >
      {value === index && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ p: 3 }}>{children}</Box>
        </motion.div>
      )}
    </div>
  );
}

const ModificationModal = ({ 
  open, 
  onClose, 
  itineraryInquiryToken,
  onModify,
  isModifying 
}) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [modifiedData, setModifiedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItineraryData = async () => {
      if (itineraryInquiryToken && open) {
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetch(
            `http://localhost:5000/api/itineraryInquiry/${itineraryInquiryToken}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (!response.ok) throw new Error('Failed to fetch itinerary data');
          
          const data = await response.json();
          
          setModifiedData({
            selectedCities: data.selectedCities || [],
            departureCity: data.departureCity || null,
            departureDates: data.departureDates || { 
              startDate: "", 
              endDate: "" 
            },
            travelersDetails: data.travelersDetails || {
              type: "",
              rooms: [],
            },
            preferences: data.preferences || {
              selectedInterests: [],
              budget: "",
            },
            includeInternational: data.includeInternational || false,
            includeGroundTransfer: data.includeGroundTransfer || false,
            includeFerryTransport: data.includeFerryTransport || false,
            userInfo: data.userInfo || {}
          });
        } catch (error) {
          setError('Failed to load itinerary data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchItineraryData();
  }, [itineraryInquiryToken, open]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const updateModifiedData = (field, value) => {
    setModifiedData(prev => {
      if (!prev) return prev;

      const newState = { ...prev };

      switch(field) {
        case 'selectedCities':
          if (Array.isArray(value)) {
            newState.selectedCities = value;
          }
          break;

        case 'travelersDetails':
          newState.travelersDetails = {
            ...prev.travelersDetails,
            ...value
          };
          break;

        case 'departureDates':
          newState.departureDates = {
            ...prev.departureDates,
            ...value
          };
          break;

        case 'preferences':
          newState.preferences = {
            ...prev.preferences,
            ...value
          };
          break;

        case 'departureCity':
          newState.departureCity = value;
          break;

        default:
          newState[field] = value;
      }

      return newState;
    });
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <Modal 
        open={open}
        onClose={!isModifying ? onClose : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 1, sm: 2, md: 3 },
          backdropFilter: "blur(5px)"
        }}
      >
        <Box 
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.4 }}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: "16px",
            width: '90%',
            maxWidth: 900,
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: theme.palette.mode === "dark" 
              ? "0 10px 40px rgba(0,0,0,0.4)" 
              : "0 10px 40px rgba(0,0,0,0.1)",
            position: 'relative',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          {/* Header */}
          <Box 
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              px: 3,
              py: 2,
              backgroundColor: theme.palette.mode === "dark" 
                ? alpha(theme.palette.primary.main, 0.1)
                : "rgba(251, 203, 173, 0.2)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <SettingsIcon sx={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: "Montserrat", 
                    fontWeight: 600, 
                    color: theme.palette.text.primary,
                  }}
                >
                  Modify Itinerary
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: alpha(theme.palette.text.primary, 0.7),
                    mt: 0.5,
                  }}
                >
                  Customize your travel plans
                </Typography>
              </Box>
            </Box>
            
            <IconButton 
              onClick={!isModifying ? onClose : undefined}
              disabled={isModifying}
              sx={{
                color: theme.palette.text.secondary,
                width: 36,
                height: 36,
                backgroundColor: alpha(theme.palette.divider, 0.1),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.divider, 0.2),
                },
                transition: "all 0.2s ease",
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {error && (
            <Box sx={{ p: 3 }}>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </Box>
          )}

          {isLoading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: 400,
              width: '100%' 
            }}>
              <LoadingSpinner message="Loading itinerary details..." />
            </Box>
          ) : modifiedData ? (
            <>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant={matches ? "fullWidth" : "scrollable"}
                scrollButtons={!matches}
                allowScrollButtonsMobile
                sx={{ 
                  borderBottom: 1, 
                  borderColor: alpha(theme.palette.divider, 0.1),
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                  },
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minHeight: { xs: 48, sm: 56 },
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '&.Mui-selected': {
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                <Tab label="Cities" />
                <Tab label="Dates" />
                <Tab label="Travelers" />
                <Tab label="Preferences" />
              </Tabs>

              <Box sx={{ overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
                <TabPanel value={activeTab} index={0}>
                  <ModifyCities
                    selectedCities={modifiedData.selectedCities}
                    departureCity={modifiedData.departureCity}
                    onUpdate={(cities, depCity) => {
                      updateModifiedData('selectedCities', cities);
                      updateModifiedData('departureCity', depCity);
                    }}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  <ModifyDates
                    departureDates={modifiedData.departureDates}
                    onUpdate={(dates) => updateModifiedData('departureDates', dates)}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  <ModifyTravelers
                    travelersDetails={modifiedData.travelersDetails}
                    onUpdate={(details) => updateModifiedData('travelersDetails', details)}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  <ModifyPreferences
                    preferences={modifiedData.preferences}
                    includeInternational={modifiedData.includeInternational}
                    includeGroundTransfer={modifiedData.includeGroundTransfer}
                    includeFerryTransport={modifiedData.includeFerryTransport}
                    onUpdate={(prefs) => updateModifiedData('preferences', prefs)}
                  />
                </TabPanel>
              </Box>

              <Box sx={{ 
                py: 2.5, 
                px: 3, 
                borderTop: 1, 
                borderColor: alpha(theme.palette.divider, 0.1),
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                backgroundColor: theme.palette.mode === "dark" 
                  ? alpha(theme.palette.background.paper, 0.5)
                  : alpha(theme.palette.background.default, 0.7),
                position: 'sticky',
                bottom: 0,
                zIndex: 5
              }}>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  disabled={isModifying}
                  sx={{ 
                    minWidth: 140,
                    height: 48,
                    borderRadius: '10px',
                    borderColor: alpha(theme.palette.error.main, 0.3),
                    color: theme.palette.error.main,
                    '&:hover': {
                      borderColor: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.05),
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => onModify(modifiedData)}
                  disabled={isModifying}
                  sx={{ 
                    minWidth: 140,
                    height: 48,
                    borderRadius: '10px',
                    backgroundColor: theme.palette.primary.main,
                    color: "#fff",
                    fontWeight: 600,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isModifying ? "Saving Changes..." : "Save Changes"}
                </Button>
              </Box>
            </>
          ) : null}
        </Box>
      </Modal>
    </LocalizationProvider>
  );
};

export default ModificationModal;