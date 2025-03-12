import {
  DirectionsBoat as BoatIcon,
  Favorite as HeartIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Chip,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Typography,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

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

const budgetOptions = [
{ value: "Pocket Friendly", label: "Budget-Friendly", icon: "₹" },
{ value: "Somewhere In-Between", label: "Standard", icon: "₹₹" },
{ value: "Luxury", label: "Premium", icon: "₹₹₹" }
];

const ModifyPreferences = ({ preferences, onUpdate }) => {
const theme = useTheme();
const [selectedInterests, setSelectedInterests] = useState(preferences?.selectedInterests || []);
const [budget, setBudget] = useState(preferences?.budget || '');
const [includeInternational, setIncludeInternational] = useState(preferences?.includeInternational || false);
const [includeGroundTransfer, setIncludeGroundTransfer] = useState(preferences?.includeGroundTransfer || false);
const [includeFerryTransport, setIncludeFerryTransport] = useState(preferences?.includeFerryTransport || false);

useEffect(() => {
  if (preferences) {
    setSelectedInterests(preferences.selectedInterests || []);
    setBudget(preferences.budget || '');
    setIncludeInternational(preferences.includeInternational || false);
    setIncludeGroundTransfer(preferences.includeGroundTransfer || false);
    setIncludeFerryTransport(preferences.includeFerryTransport || false);
  }
}, [preferences]);

const handleInterestToggle = (interest) => {
  setSelectedInterests(prev => {
    const newInterests = prev.includes(interest)
      ? prev.filter(i => i !== interest)
      : [...prev, interest];
    
    onUpdate({
      ...preferences,
      selectedInterests: newInterests,
    });
    
    return newInterests;
  });
};

const handleBudgetSelect = (selectedBudget) => {
  setBudget(selectedBudget);
  onUpdate({
    ...preferences,
    budget: selectedBudget
  });
};

const handleToggleChange = (setting, value) => {
  switch(setting) {
    case 'international':
      setIncludeInternational(value);
      onUpdate({
        ...preferences,
        includeInternational: value
      });
      break;
    case 'ground':
      setIncludeGroundTransfer(value);
      onUpdate({
        ...preferences,
        includeGroundTransfer: value
      });
      break;
    case 'ferry':
      setIncludeFerryTransport(value);
      onUpdate({
        ...preferences,
        includeFerryTransport: value
      });
      break;
    default:
      break;
  }
};

return (
  <Box sx={{ width: '100%' }}>
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "12px",
        backgroundColor: theme.palette.mode === "dark" 
          ? alpha(theme.palette.primary.main, 0.05)
          : "rgba(251, 203, 173, 0.15)",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        transition: "all 0.2s ease",
        mb: 4
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <HeartIcon sx={{ color: theme.palette.primary.main }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
            Travel Interests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select activities and experiences you're most interested in
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={1.5} sx={{ mt: 1 }}>
        {interestOptions.map((interest, index) => (
          <Grid item key={interest}>
            <Chip
              component={motion.div}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              label={interest}
              onClick={() => handleInterestToggle(interest)}
              variant={selectedInterests.includes(interest) ? "filled" : "outlined"}
              sx={{
                borderRadius: '30px',
                px: 1,
                fontWeight: selectedInterests.includes(interest) ? 600 : 400,
                color: selectedInterests.includes(interest) 
                  ? "#fff" 
                  : theme.palette.text.primary,
                backgroundColor: selectedInterests.includes(interest) 
                  ? theme.palette.primary.main 
                  : 'transparent',
                borderColor: selectedInterests.includes(interest) 
                  ? theme.palette.primary.main 
                  : alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  backgroundColor: selectedInterests.includes(interest) 
                    ? theme.palette.primary.dark 
                    : alpha(theme.palette.primary.main, 0.1),
                },
                transition: 'all 0.2s ease',
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>

    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "12px",
        backgroundColor: theme.palette.mode === "dark" 
          ? alpha(theme.palette.primary.main, 0.05)
          : "rgba(251, 203, 173, 0.15)",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        transition: "all 0.2s ease",
        mb: 4
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <MoneyIcon sx={{ color: theme.palette.primary.main }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
            Budget Preference
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose what kind of accommodations and experiences you prefer
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {budgetOptions.map((option) => (
          <Grid item xs={12} sm={4} key={option.value}>
            <Box
              component={motion.div}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              sx={{
                p: 2.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '16px',
                backgroundColor: budget === option.value 
                  ? alpha(theme.palette.primary.main, 0.15) 
                  : alpha(theme.palette.background.paper, 0.5),
                border: `2px solid ${budget === option.value 
                  ? theme.palette.primary.main 
                  : alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: budget === option.value 
                    ? alpha(theme.palette.primary.main, 0.2) 
                    : alpha(theme.palette.background.paper, 0.8),
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                }
              }}
              onClick={() => handleBudgetSelect(option.value)}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  mb: 1, 
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}
              >
                {option.icon}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: budget === option.value 
                    ? theme.palette.primary.main
                    : theme.palette.text.primary
                }}
              >
                {option.label}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  mt: 0.5,
                  textAlign: 'center'
                }}
              >
                {option.value === "Pocket Friendly" && "Affordable options with essential amenities"}
                {option.value === "Somewhere In-Between" && "Mid-range comfort with good value"}
                {option.value === "Luxury" && "Premium experiences with top amenities"}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>

    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "12px",
        backgroundColor: theme.palette.mode === "dark" 
          ? alpha(theme.palette.background.paper, 0.5)
          : alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: "all 0.2s ease",
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <InfoIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="body2" color="text.secondary">
          Additional transportation options
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <BoatIcon sx={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Ferry Transport
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Include boat and ferry services where available
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={includeFerryTransport}
                  onChange={(e) => handleToggleChange('ferry', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label=""
            />
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  </Box>
);
};

export default ModifyPreferences;