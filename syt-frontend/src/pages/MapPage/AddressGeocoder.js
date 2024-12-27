// src/components/AddressGeocoder/AddressGeocoder.js
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import React, { useState } from 'react';

// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm95c3l0IiwiYSI6ImNtM3ljc2Z2bzFmNXUyanM1M2owbDVuaTYifQ.Tnqj3lh2w7reW4mc9xE3rQ';

const AddressGeocoder = () => {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGeocode = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${mapboxgl.accessToken}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Geocoding failed');
      }

      if (data.features && data.features.length > 0) {
        const location = data.features[0];
        setResult({
          coordinates: location.center,
          placeName: location.place_name,
          type: location.place_type[0]
        });
      } else {
        setError('No results found for this address');
      }
    } catch (err) {
      setError(err.message || 'Failed to get coordinates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleGeocode();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleGeocode}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Get Coordinates'}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {result && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          <Typography>
            <strong>Place:</strong> {result.placeName}
          </Typography>
          <Typography>
            <strong>Type:</strong> {result.type}
          </Typography>
          <Typography>
            <strong>Coordinates:</strong> [{result.coordinates[0].toFixed(6)}, {result.coordinates[1].toFixed(6)}]
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1, fontSize: '0.875rem' }}>
            Longitude: {result.coordinates[0].toFixed(6)}
            <br />
            Latitude: {result.coordinates[1].toFixed(6)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AddressGeocoder;