import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Box, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DestinationForm.css';

const DestinationForm = () => {
  const theme = useTheme();
  const [promotedCountries, setPromotedCountries] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const removeDuplicates = (array) => {
    const uniqueItems = new Set();
    return array.filter(item => {
      if (!uniqueItems.has(item.name)) {
        uniqueItems.add(item.name);
        return true;
      }
      return false;
    });
  };

  useEffect(() => {
    const fetchPromotedCountries = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/destinations/promoted-countries');
        const formattedCountries = removeDuplicates(response.data.countries.map(country => ({ name: country, type: 'country' })));
        setPromotedCountries(formattedCountries);
      } catch (error) {
        console.error('Error fetching promoted countries:', error);
      }
    };
    fetchPromotedCountries();
  }, []);

  const handleSearch = async (event) => {
    const input = event.target.value;
    setQuery(input);

    if (input.length > 2) {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/destinations/search', { params: { query: input } });
        const deduplicatedResults = removeDuplicates(response.data);
        setSearchResults(deduplicatedResults);
      } catch (error) {
        console.error('Error searching destinations:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelect = (event, value) => {
    if (value) {
      const { name, type, destination_id, country, continent, ranking, imageUrl } = value;
  
      if (type === 'city') {

        // Log the city selection data
      console.log('Navigating with city:', {
        destination: name,
        destinationType: type,
        destination_id,
        country,
        continent,
        ranking,
        imageUrl,
      });
        // Pass city details
        navigate('/itinerary-inquiry', {
          state: {
            destination: name,
            destinationType: type,
            destination_id,
            country,
            continent,
            ranking,
            imageUrl
          },
        });
      } else {
          // Log the country or continent selection data
      console.log(`Navigating with ${type}:`, {
        destination: name,
        destinationType: type,
      });
      
        // Pass country or continent details
        navigate('/itinerary-inquiry', {
          state: {
            destination: name,
            destinationType: type,
          },
        });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Box
        className="destination-form"
        sx={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          width: '100%',
          maxWidth: '600px',
        }}
      >
        <Autocomplete
          options={searchResults.length > 0 ? searchResults : promotedCountries}
          getOptionLabel={(option) => option.name}
          fullWidth
          freeSolo
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="City, Country, or Continent"
              variant="filled"
              fullWidth
              className="destination-input"
              value={query}
              onChange={handleSearch}
              sx={{
                borderRadius: '10px',
                '& .MuiInputLabel-root': { color: theme.palette.text.primary },
                '& .MuiFilledInput-root': {
                  backgroundColor:
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
                  },
                },
                '& .MuiInputBase-input': { padding: '10px 16px' },
                '& .MuiInputAdornment-root': {
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                },
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton sx={{ padding: '8px' }}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
          onChange={handleSelect}
          renderOption={(props, option) => {
            const { key, ...restProps } = props;
            return <li key={key} {...restProps}>{option.name}</li>;
          }}
        />
      </Box>
    </Box>
  );
};

export default DestinationForm;
