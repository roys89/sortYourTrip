import { DateRange, DirectionsBoat, FlightTakeoff, Info } from "@mui/icons-material";
import {
    Autocomplete,
    Box,
    Collapse,
    Grid,
    TextField,
    Typography,
    useTheme
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";

const DepartureDetailsForm = ({
  saveDepartureCityData,
  saveDateData,
  selectedDepartureCity,
  selectedPreferences,
  initialStartDate,
  initialEndDate
}) => {
  const theme = useTheme();
  const [departureCities, setDepartureCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(selectedDepartureCity || null);
  const [includeInternational, setIncludeInternational] = useState(
    selectedPreferences?.includeInternational || false
  );
  const [includeFerryTransport, setIncludeFerryTransport] = useState(
    selectedPreferences?.includeFerryTransport || false
  );
  const [startDate, setStartDate] = useState(initialStartDate || null);
  const [endDate, setEndDate] = useState(initialEndDate || null);

  // Format date helper
  const formatDate = (date) => (date ? DateTime.fromJSDate(date.toJSDate()).toISODate() : null);

  // Fetch cities with airports for departure options
  const fetchDepartureCities = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/cities-with-airports");
      setDepartureCities(response.data);
    } catch (error) {
      console.error("Error fetching cities", error);
    }
  };

  useEffect(() => {
    fetchDepartureCities();
  }, []);

  // Save city data - Always send true for includeGroundTransfer
  useEffect(() => {
    saveDepartureCityData({
      selectedCity,
      includeInternational,
      includeGroundTransfer: true, // Always set to true
      includeFerryTransport,
    });
  }, [selectedCity, includeInternational, includeFerryTransport, saveDepartureCityData]);

  // Save date data
  useEffect(() => {
    if (startDate && endDate) {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      saveDateData({ startDate: formattedStartDate, endDate: formattedEndDate });
    }
  }, [startDate, endDate, saveDateData]);

  // Transport Options Component
  const TransportOption = ({ selected, onChange, icon, label, description }) => (
    <Box
      onClick={() => onChange(!selected)}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '30px',
        cursor: 'pointer',
        height: '100%',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        transform: selected ? 'translateY(-4px)' : 'translateY(0)',
        bgcolor: selected ? 
          theme.palette.mode === "dark" ? `rgba(${theme.palette.primary.main}, 0.2)` : "#fbcbad" : 
          theme.palette.mode === "dark" ? "rgba(100, 100, 100, 0.2)" : "rgba(251, 203, 173, 0.2)",
        border: selected 
          ? `4px solid ${theme.palette.primary.main}`
          : '4px solid transparent',
        '&:hover': {
          transform: 'translateY(-4px)',
          bgcolor: theme.palette.mode === "dark" ? `rgba(${theme.palette.primary.main}, 0.3)` : "rgba(251, 203, 173, 0.5)",
          borderColor: theme.palette.primary.main
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: selected ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.25)',
          color: selected ? 'white' : theme.palette.text.primary,
          mb: 1.5,
          transition: 'all 0.3s ease'
        }}
      >
        {icon}
      </Box>
      <Typography 
        variant="body1" 
        align="center" 
        sx={{ 
          fontWeight: selected ? 600 : 400,
          color: theme.palette.mode === "light" ? "#000" : "#fff"
        }}
      >
        {label}
      </Typography>
      {description && (
        <Typography 
          variant="caption" 
          align="center" 
          sx={{ 
            mt: 1,
            color: theme.palette.mode === "light" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)",
            fontSize: "0.75rem"
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: "100%", mt: 4, mb: 4 }}>
      {/* Rest of the code remains the same */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mb: 3,
          backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : `rgba(${theme.palette.primary.main}, 0.05)`,
          p: 2,
          borderRadius: "10px"
        }}
      >
        <Info sx={{ color: theme.palette.primary.main, mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Select your transportation preferences and travel dates.
        </Typography>
      </Box>

      {/* Main container with sections */}
      <Grid container spacing={4}>
        {/* Transportation Section - Removed Ground Transfer option */}
        <Grid item xs={12}>
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: "center" }}>
              Transportation Options
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TransportOption
                  selected={includeInternational}
                  onChange={setIncludeInternational}
                  icon={<FlightTakeoff fontSize="large" />}
                  label="Include International Flights"
                  description="Select this to add international flights to your itinerary"
                />
              </Grid>
              {/* Removed the Ground Transfer option */}
              <Grid item xs={12} md={6}>
                <TransportOption
                  selected={includeFerryTransport}
                  onChange={setIncludeFerryTransport}
                  icon={<DirectionsBoat fontSize="large" />}
                  label="Include Ferry Transport"
                  description="Add boat or ferry services where available"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Departure City Section - Only shown if international flights selected */}
        <Grid item xs={12}>
          <Collapse in={includeInternational} timeout={500}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: "center" }}>
                Departure City
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, textAlign: "center", color: "text.secondary" }}>
                Select the city you'll be departing from for your international flights
              </Typography>
              <Box sx={{ maxWidth: "100%", margin: "0 auto" }}>
                <Autocomplete
                  options={departureCities}
                  getOptionLabel={(option) => `${option.city} - ${option.name} (${option.code})`}
                  value={selectedCity}
                  onChange={(event, value) => setSelectedCity(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select your departure city"
                      variant="outlined"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '30px',
                        },
                      }}
                    />
                  )}
                  fullWidth
                />
              </Box>
            </Box>
          </Collapse>
        </Grid>

        {/* Travel Dates Section */}
        <Grid item xs={12}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
              <DateRange sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Travel Dates
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 3, textAlign: "center", color: "text.secondary" }}>
              Select when you want to begin and end your trip
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Departure Date"
                  value={startDate}
                  onChange={(newDate) => setStartDate(newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '30px',
                        },
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Return Date"
                  value={endDate}
                  onChange={(newDate) => setEndDate(newDate)}
                  minDate={startDate || DateTime.now()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '30px',
                        },
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
        </Grid>
    </Box>
  );
};

export default DepartureDetailsForm;