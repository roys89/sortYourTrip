import { Info } from "@mui/icons-material";
import {
  Box,
  FormControlLabel,
  Grid,
  Radio,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";

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
  "Festival",
];

const budgetOptions = ["Pocket Friendly", "Somewhere In-Between", "Luxury"];

const PreferencesForm = ({
  selectedInterests,
  setSelectedInterests,
  budget,
  setBudget,
}) => {
  const theme = useTheme();

  // Ensure selectedInterests is always an array
  const safeSelectedInterests = Array.isArray(selectedInterests)
    ? selectedInterests
    : [];

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
    <Box
      sx={{
        padding: 1.25,
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
          mt: 2,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : `rgba(${theme.palette.primary.main}, 0.05)`,
          p: 2,
          borderRadius: "10px",
        }}
      >
        <Info sx={{ color: theme.palette.primary.main, mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Select the types of experiences that excite you most. You can choose
          multiple interests.
        </Typography>
      </Box>

      <Typography
        variant="h6"
        sx={{ mb: 3, mt: 3, fontWeight: 600, textAlign: "center" }}
      >
        Interest Preferences
      </Typography>
      <Grid container spacing={2}>
        {interestOptions.map((interest) => (
          <Grid item xs={6} md={4} key={interest}>
            <Box
              sx={{
                textAlign: "center",
                cursor: "pointer",
                transition:
                  "border-color 0.3s ease, background-color 0.3s ease",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                fontSize: "1rem",
                fontWeight: 500,
                padding: 2.5,
                boxSizing: "border-box",
                borderRadius: "30px",
                border: safeSelectedInterests.includes(interest)
                  ? "4px solid"
                  : "4px solid transparent",
                backgroundColor: safeSelectedInterests.includes(interest)
                  ? theme.palette.mode === "dark"
                    ? `rgba(${theme.palette.primary.main}, 0.2)`
                    : "#fbcbad"
                  : theme.palette.mode === "dark"
                  ? "rgba(100, 100, 100, 0.2)"
                  : "rgba(251, 203, 173, 0.2)", // #fbcbad with 0.2 opacity
                borderColor: safeSelectedInterests.includes(interest)
                  ? theme.palette.primary.main
                  : "transparent",
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? `rgba(${theme.palette.primary.main}, 0.3)`
                      : "rgba(251, 203, 173, 0.5)", // #fbcbad with 0.5 opacity for hover
                  borderColor: theme.palette.primary.main,
                },
              }}
              onClick={() => handleInterestChange(interest)}
            >
              {interest}
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
          mt: 6,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : `rgba(${theme.palette.primary.main}, 0.05)`,
          p: 2,
          borderRadius: "10px",
        }}
      >
        <Info sx={{ color: theme.palette.primary.main, mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Choose a budget range that best matches your travel style and
          financial comfort.
        </Typography>
      </Box>
      <Typography
        variant="h6"
        sx={{ mb: 3, mt: 3, fontWeight: 600, textAlign: "center" }}
      >
        Budget Preference
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          marginTop: 2.5,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {budgetOptions.map((option) => (
          <Box
            key={option}
            sx={{
              flex: { sm: "0 1 calc(33.33% - 16px)" },
              padding: 2,
              textAlign: "center",
              cursor: "pointer",
              transition: "background-color 0.3s ease, border-color 0.3s ease",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
              borderRadius: "30px",
              border: budget === option 
                ? "2px solid"
                : "2px solid transparent",
              backgroundColor:
                budget === option
                  ? theme.palette.mode === "dark"
                    ? `rgba(${theme.palette.primary.main}, 0.2)`
                    : "#fbcbad"
                  : theme.palette.mode === "dark"
                  ? "rgba(100, 100, 100, 0.2)"
                  : "rgba(251, 203, 173, 0.2)", // #fbcbad with 0.2 opacity
              borderColor:
                budget === option
                  ? theme.palette.primary.main
                  : "transparent",
              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? `rgba(${theme.palette.primary.main}, 0.3)`
                    : "rgba(251, 203, 173, 0.5)", // #fbcbad with 0.5 opacity for hover
                borderColor: theme.palette.primary.main,
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
                "& .MuiRadio-root": {
                  padding: 0,
                  marginRight: 1,
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PreferencesForm;