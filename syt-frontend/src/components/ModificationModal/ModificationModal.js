import { Close as CloseIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    IconButton,
    Modal,
    Tab,
    Tabs,
    Typography,
    useTheme
} from '@mui/material';
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import axios from 'axios';
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
  const [activeTab, setActiveTab] = useState(0);
  const [itineraryData, setItineraryData] = useState(null);
  const [modifiedData, setModifiedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItineraryData = async () => {
      if (itineraryInquiryToken && open) {
        try {
          setIsLoading(true);
          setError(null);
          const response = await axios.get(
            `http://localhost:5000/api/itineraryInquiry/${itineraryInquiryToken}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          const data = response.data;
          console.log('Fetched itinerary inquiry data:', data);
          setItineraryData(data);
          
          // Initialize modifiedData with fetched data
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
          console.error('Error fetching itinerary data:', error);
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
    console.log('Updating field:', field, 'with value:', value);
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

      console.log('Updated state:', newState);
      return newState;
    });
  };

  const handleModification = async () => {
    if (!modifiedData || !itineraryData) {
      console.error('No data available for modification');
      return;
    }

    try {
      // Create complete payload with all required data
      const updatePayload = {
        ...modifiedData,
        itineraryInquiryToken,
        userInfo: itineraryData.userInfo
      };

      console.log('Submitting modification payload:', updatePayload);

      // 1. Update ItineraryInquiry
      await axios.put(
        `http://localhost:5000/api/itineraryInquiry/${itineraryInquiryToken}`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // 2. Delete existing Itinerary
      await axios.delete(
        `http://localhost:5000/api/itinerary/${itineraryInquiryToken}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Close modal and trigger parent component's handler
      onClose();
      onModify(updatePayload);

    } catch (error) {
      console.error('Error in modification:', error);
      setError(error.response?.data?.message || 'Error modifying itinerary. Please try again.');
      throw error;
    }
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
    <Modal 
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2
      }}
    >
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        maxWidth: 900,
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 1
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Modify Itinerary
          </Typography>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <LoadingSpinner message="Loading itinerary details..." />
            </Box>
          ) : modifiedData ? (
            <>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Cities" />
                <Tab label="Dates" />
                <Tab label="Travelers" />
                <Tab label="Preferences" />
              </Tabs>

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

              <Box sx={{ 
                mt: 3, 
                pt: 2, 
                borderTop: 1, 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2
              }}>
                <Button
                  onClick={onClose}
                  disabled={isModifying}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleModification}
                  disabled={isModifying}
                >
                  {isModifying ? "Saving Changes..." : "Save Changes"}
                </Button>
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
    </Modal>
    </LocalizationProvider>
  );
  
};

export default ModificationModal;