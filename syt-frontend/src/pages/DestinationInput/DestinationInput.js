import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import './DestinationInput.css'; // Custom CSS for additional styles

const DestinationInput = () => {
  const [formData, setFormData] = useState({
    destination_id: '',
    name: '',
    city: '',
    description: '',
    lat: '',
    long: '',
    country: '',
    continent: '',
    ranking: '',
    rating: '',
    imageUrl: '',
    isActive: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/destinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        alert('Destination added successfully!');
        setFormData({
          destination_id: '',
          name: '',
          city: '',
          description: '',
          lat: '',
          long: '',
          country: '',
          continent: '',
          ranking: '',
          rating: '',
          imageUrl: '',
          isActive: true,
        });
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('An error occurred: ' + error.message);
    }
  };

  return (
    <Paper className="destination-input-container" elevation={3}>
      <Typography variant="h5" align="center" gutterBottom>
        Add New Destination
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="destination_id"
              label="Destination Code"
              value={formData.destination_id}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="lat"
              label="Latitude"
              value={formData.lat}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="long"
              label="Longitude"
              value={formData.long}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="country"
              label="Country"
              value={formData.country}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="continent"
              label="Continent"
              value={formData.continent}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="ranking"
              label="Ranking"
              type="number"
              value={formData.ranking}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="rating"
              label="Rating"
              type="number"
              value={formData.rating}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="imageUrl"
              label="Image URL"
              value={formData.imageUrl}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
              }
              label="Is Active"
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Submit
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default DestinationInput;
