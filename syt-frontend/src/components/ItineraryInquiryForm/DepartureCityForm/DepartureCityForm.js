import { Autocomplete, Box, Checkbox, FormControlLabel, TextField, useTheme } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import "./DepartureCityForm.css";

const DepartureCityForm = ({
  saveDepartureCityData,
  selectedDepartureCity,
  selectedPreferences,
}) => {
  const [departureCities, setDepartureCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(selectedDepartureCity || null);
  const [includeInternational, setIncludeInternational] = useState(
    selectedPreferences?.includeInternational || false
  );
  const [includeGroundTransfer, setIncludeGroundTransfer] = useState(
    selectedPreferences?.includeGroundTransfer || false
  );
  const [includeFerryTransport, setIncludeFerryTransport] = useState(
    selectedPreferences?.includeFerryTransport || false
  );

  const theme = useTheme();

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

  // Save departure city data when selections change
  useEffect(() => {
    saveDepartureCityData({
      selectedCity,
      includeInternational,
      includeGroundTransfer,
      includeFerryTransport,
    });
  }, [selectedCity, includeInternational, includeGroundTransfer, includeFerryTransport, saveDepartureCityData]);

  return (
    <Box
    className="form-container"
    sx={{
      mt: 3,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center", // Add this
      gap: 2,
      flex: 1, // Add this
      minHeight: '50vh', // Add this to ensure minimum height
    }}
  >
      {/* Checkbox for International Flights */}
      <Box
        onClick={() => setIncludeInternational(!includeInternational)}
        className={`checkbox-rect ${includeInternational ? "selected" : ""}`}
        sx={{
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(51, 51, 51, 0.5)" : "rgba(255, 180, 123, 0.6)",
          color: theme.palette.mode === "light" ? "#000" : "#fff",
          width: "100%",
          maxWidth: "600px",
          padding: "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "30px",
          border: `4px solid ${includeInternational ? "#FF9800" : "rgba(255, 180, 123, 0.6)"}`,
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <FormControlLabel
          control={<Checkbox checked={includeInternational} sx={{ display: "none" }} />}
          label="Include International Flights"
          sx={{ pointerEvents: "none" }} // Prevent interfering with parent box click
        />
      </Box>

      {/* Dropdown for Departure City, only shown if International Flights is selected */}
      {includeInternational && (
        <Autocomplete
          options={departureCities}
          getOptionLabel={(option) => `${option.city} - ${option.name} (${option.code})`}
          value={selectedCity}
          onChange={(event, value) => setSelectedCity(value)}
          renderInput={(params) => <TextField {...params} label="Select Departure City" variant="outlined" />}
          fullWidth
          className="autocomplete"
        />
      )}

      {/* Ground Transfer and Ferry Transport options */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          width: "100%",
          maxWidth: "600px",
          justifyContent: "space-between",
        }}
      >
        {/* Checkbox for Ground Transfers */}
        <Box
          onClick={() => setIncludeGroundTransfer(!includeGroundTransfer)}
          className={`checkbox-rect ${includeGroundTransfer ? "selected" : ""}`}
          sx={{
            backgroundColor:
              theme.palette.mode === "dark" ? "rgba(51, 51, 51, 0.5)" : "rgba(255, 180, 123, 0.6)",
            color: theme.palette.mode === "light" ? "#000" : "#fff",
            padding: "16px",
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "30px",
            border: `4px solid ${includeGroundTransfer ? "#FF9800" : "rgba(255, 180, 123, 0.6)"}`,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <FormControlLabel
            control={<Checkbox checked={includeGroundTransfer} sx={{ display: "none" }} />}
            label="Include Ground Transfers"
            sx={{ pointerEvents: "none" }} // Prevent interfering with parent box click
          />
        </Box>

        {/* Checkbox for Ferry Transport */}
        <Box
          onClick={() => setIncludeFerryTransport(!includeFerryTransport)}
          className={`checkbox-rect ${includeFerryTransport ? "selected" : ""}`}
          sx={{
            backgroundColor:
              theme.palette.mode === "dark" ? "rgba(51, 51, 51, 0.5)" : "rgba(255, 180, 123, 0.6)",
            color: theme.palette.mode === "light" ? "#000" : "#fff",
            padding: "16px",
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "30px",
            border: `4px solid ${includeFerryTransport ? "#FF9800" : "rgba(255, 180, 123, 0.6)"}`,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <FormControlLabel
            control={<Checkbox checked={includeFerryTransport} sx={{ display: "none" }} />}
            label="Include Ferry Transport"
            sx={{ pointerEvents: "none" }} // Prevent interfering with parent box click
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DepartureCityForm;
