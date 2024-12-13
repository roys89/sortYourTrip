// components/MarkupManagement.js
import { Calculate, Refresh, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMarkupSettings,
  saveMarkupSettings,
  updateMarkup,
  updateTcsRate
} from '../../redux/slices/markupSlice';
import { calculatePrices } from '../../redux/slices/priceSlice';

const MarkupManagement = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { markups, tcsRates, loading } = useSelector(state => state.markup);
  const { data: itinerary } = useSelector(state => state.itinerary);
  const { calculatedPrices, lastCalculated } = useSelector(state => state.price);
  
  // Local state
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadMarkupSettings = useCallback(async () => {
    try {
      await dispatch(fetchMarkupSettings()).unwrap();
      if (itinerary) {
        dispatch(calculatePrices(itinerary));
      }
    } catch (err) {
      handleError('Failed to load markup settings');
    }
  }, [dispatch, itinerary]);

  useEffect(() => {
    loadMarkupSettings();
  }, [loadMarkupSettings]);

  const handleMarkupChange = (category, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      dispatch(updateMarkup({ category, value: numValue }));
      setHasChanges(true);
      if (itinerary) {
        dispatch(calculatePrices(itinerary));
      }
    }
  };

  const handleTcsChange = (type, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      dispatch(updateTcsRate({ type, value: numValue }));
      setHasChanges(true);
      if (itinerary) {
        dispatch(calculatePrices(itinerary));
      }
    }
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const handleSave = async () => {
    try {
      await dispatch(saveMarkupSettings({ markups, tcsRates })).unwrap();
      setShowSuccess(true);
      setHasChanges(false);
      setLastSaved(new Date().toLocaleString());
    } catch (err) {
      handleError('Failed to save settings');
    }
  };

  const handleRefresh = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to refresh?')) {
        loadMarkupSettings();
        setHasChanges(false);
      }
    } else {
      loadMarkupSettings();
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    if (!showPreview && itinerary) {
      dispatch(calculatePrices(itinerary));
    }
  };

  if (loading && !hasChanges) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg"
    sx={{ 
      marginTop: '100px',  // Added top margin of 100px
      minHeight: 'calc(100vh - 100px)' // Optional: ensures full page height accounting for margin
    }}>
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Markup Management
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Calculate />}
              onClick={togglePreview}
              sx={{ mr: 2 }}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!hasChanges || loading}
            >
              Save Changes
            </Button>
          </Box>
        </Box>

        {lastSaved && (
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Last saved: {lastSaved}
          </Typography>
        )}

        <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Segment Markups
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(markups).map(([category, value]) => (
              <Grid item xs={12} sm={6} md={3} key={category}>
                <TextField
                  fullWidth
                  label={`${category.charAt(0).toUpperCase() + category.slice(1)} Markup`}
                  type="number"
                  value={value}
                  onChange={(e) => handleMarkupChange(category, e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    step: 0.1
                  }}
                  disabled={loading}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            TCS Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Default TCS Rate"
                type="number"
                value={tcsRates.default}
                onChange={(e) => handleTcsChange('default', e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 0.1
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="High Value TCS Rate"
                type="number"
                value={tcsRates.highValue}
                onChange={(e) => handleTcsChange('highValue', e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 0.1
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="High Value Threshold"
                type="number"
                value={tcsRates.threshold}
                onChange={(e) => handleTcsChange('threshold', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 1000
                }}
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Paper>

        {showPreview && calculatedPrices && (
          <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Price Preview
            </Typography>
            <Box mt={2}>
              {Object.entries(calculatedPrices.segmentTotals).map(([segment, amount]) => (
                <Box key={segment} display="flex" justifyContent="space-between" mb={1}>
                  <Typography>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </Typography>
                  <Typography>
                    ₹{amount.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Subtotal</Typography>
                <Typography>₹{calculatedPrices.subtotal.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>TCS ({calculatedPrices.tcsRate}%)</Typography>
                <Typography>₹{calculatedPrices.tcsAmount.toLocaleString('en-IN')}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">₹{calculatedPrices.grandTotal.toLocaleString('en-IN')}</Typography>
              </Box>
              {lastCalculated && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                  Last calculated: {new Date(lastCalculated).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Paper>
        )}
      </Box>

      <Snackbar 
        open={showSuccess} 
        autoHideDuration={3000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Settings saved successfully
        </Alert>
      </Snackbar>

      <Snackbar 
        open={showError} 
        autoHideDuration={3000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MarkupManagement;