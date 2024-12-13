import {
  Box,
  FormControlLabel,
  Grid,
  Radio,
  Typography,
  useTheme
} from "@mui/material";
import React from "react";
import './PreferencesForm.css';

const interestOptions = [
  "Adventure",
  "Art & Culture",
  "History",
  "Leisure",
  "Shopping",
  "Beaches",
  "Visit Like Locals",
  "Hill stations",
  "Must see",
  "Nature",
  "Hidden gems",
  "Wildlife",
  "Food & Nightlife",
  "Festival"
];

const budgetOptions = ["Pocket Friendly", "Somewhere in Between", "Luxury"];

const PreferencesForm = ({ selectedInterests, setSelectedInterests, budget, setBudget }) => {
  const theme = useTheme();

  // Ensure selectedInterests is always an array
  const safeSelectedInterests = Array.isArray(selectedInterests) ? selectedInterests : [];

  const handleInterestChange = (interest) => {
    const updatedInterests = safeSelectedInterests.includes(interest)
      ? safeSelectedInterests.filter((item) => item !== interest)
      : [...safeSelectedInterests, interest];
    setSelectedInterests(updatedInterests);
  };

  const handleBudgetChange = (option) => {
    setBudget(option);
  };

  return (
    <Box className="preferences-form">
      <Typography variant="h6" mb={3}>Interest Preferences</Typography>
      <Grid container spacing={2}>
        {interestOptions.map((interest) => (
          <Grid item xs={6} md={4} key={interest}>
            <Box
              className="preference-card"
              sx={{
                border: "4px solid",
                backgroundColor: safeSelectedInterests.includes(interest)
                  ? theme.palette.action.selected
                  : "transparent",
                borderColor: safeSelectedInterests.includes(interest)
                  ? "#FF9800"
                  : "rgba(255, 180, 123, 0.6)",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: "#FF9800",
                },
              }}
              onClick={() => handleInterestChange(interest)}
            >
              {interest}
            </Box>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" mt={3}>
        Budget Preference
      </Typography>
      <Box className="budget-container" mb={6}>
        {budgetOptions.map((option) => (
          <Box
            key={option}
            className="budget-option"
            sx={{
              border: "2px solid",
              backgroundColor: budget === option
                ? theme.palette.action.selected
                : "transparent",
              borderColor: budget === option
                ? "#FF9800"
                : "rgba(255, 180, 123, 0.6)",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                borderColor: "#FF9800",
              },
            }}
            onClick={() => handleBudgetChange(option)}
          >
            <FormControlLabel
              value={option}
              control={<Radio checked={budget === option} />}
              label={option}
              sx={{
                margin: 0,
                color: theme.palette.text.primary,
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PreferencesForm;