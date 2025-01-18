import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Grid,
    Typography
} from '@mui/material';
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

const budgetOptions = ["Pocket Friendly", "Somewhere In-Between", "Luxury"];

const ModifyPreferences = ({ preferences, onUpdate }) => {
  const [selectedInterests, setSelectedInterests] = useState(preferences?.selectedInterests || []);
  const [budget, setBudget] = useState(preferences?.budget || '');

  useEffect(() => {
    if (preferences) {
      setSelectedInterests(preferences.selectedInterests || []);
      setBudget(preferences.budget || '');
    }
  }, [preferences]);

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev => {
      const newInterests = prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest];
      
      onUpdate({
        selectedInterests: newInterests,
        budget
      });
      
      return newInterests;
    });
  };

  const handleBudgetSelect = (selectedBudget) => {
    setBudget(selectedBudget);
    onUpdate({
      selectedInterests,
      budget: selectedBudget
    });
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Interests
        </Typography>
        <Grid container spacing={1}>
          {interestOptions.map((interest) => (
            <Grid item xs={6} md={4} key={interest}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedInterests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                  />
                }
                label={interest}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Budget Preference
        </Typography>
        <Grid container spacing={2}>
          {budgetOptions.map((option) => (
            <Grid item xs={12} md={4} key={option}>
              <Button
                fullWidth
                variant={budget === option ? 'contained' : 'outlined'}
                onClick={() => handleBudgetSelect(option)}
                sx={{ 
                  height: 80, 
                  whiteSpace: 'normal',
                  textTransform: 'none' 
                }}
              >
                {option}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Additional Options
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences?.includeInternational || false}
                onChange={(e) => {
                  onUpdate({
                    ...preferences,
                    includeInternational: e.target.checked
                  });
                }}
              />
            }
            label="Include International Flights"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences?.includeGroundTransfer || false}
                onChange={(e) => {
                  onUpdate({
                    ...preferences,
                    includeGroundTransfer: e.target.checked
                  });
                }}
              />
            }
            label="Include Ground Transfers"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences?.includeFerryTransport || false}
                onChange={(e) => {
                  onUpdate({
                    ...preferences,
                    includeFerryTransport: e.target.checked
                  });
                }}
              />
            }
            label="Include Ferry Transport"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ModifyPreferences;