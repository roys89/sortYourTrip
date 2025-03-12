import { Add as AddIcon, Close as CloseIcon, FlightTakeoff as FlightIcon, LocationOn as LocationIcon, Search as SearchIcon } from '@mui/icons-material';
import {
    alpha,
    Autocomplete,
    Box,
    Card,
    CircularProgress,
    FormControlLabel,
    IconButton,
    Paper,
    Switch,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
  
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
  
  const ModifyCities = ({ selectedCities, departureCity, onUpdate }) => {
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentCities, setCurrentCities] = useState(selectedCities || []);
    const [currentDepartureCity, setCurrentDepartureCity] = useState(departureCity);
    const [departureCities, setDepartureCities] = useState([]);
    const [includeInternational, setIncludeInternational] = useState(departureCity !== null);
  
    useEffect(() => {
      if (selectedCities) {
        setCurrentCities(selectedCities);
      }
    }, [selectedCities]);
  
    useEffect(() => {
      if (departureCity) {
        setCurrentDepartureCity(departureCity);
        setIncludeInternational(true);
      } else {
        setIncludeInternational(false);
      }
    }, [departureCity]);
  
    useEffect(() => {
      const fetchDepartureCities = async () => {
        try {
          const response = await axios.get("http://localhost:5000/api/cities-with-airports");
          setDepartureCities(response.data);
        } catch (error) {
          console.error("Error fetching departure cities:", error);
        }
      };
      fetchDepartureCities();
    }, []);
  
    useEffect(() => {
      const debounceSearch = setTimeout(() => {
        if (searchQuery) {
          const searchDestinations = async () => {
            setLoading(true);
            try {
              const response = await axios.get(`http://localhost:5000/api/destinations/search`, {
                params: { query: searchQuery }
              });
              const deduplicatedResults = removeDuplicates(response.data);
              setDestinations(deduplicatedResults);
            } catch (error) {
              console.error('Error searching destinations:', error);
            } finally {
              setLoading(false);
            }
          };
          searchDestinations();
        }
      }, 300);
  
      return () => clearTimeout(debounceSearch);
    }, [searchQuery]);
  
    const handleDestinationSelect = async (event, value) => {
      if (!value) return;
      
      try {
        const response = await axios.get(`http://localhost:5000/api/destinations/cities`, {
          params: { 
            destination: value.name.split(' - ')[0],
            destinationType: value.type 
          }
        });
        setAvailableCities(response.data);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setAvailableCities([]);
      }
    };
  
    const handleAddCity = (event, cities) => {
      if (!cities) return;
      
      const newCities = cities.filter(city => 
        !currentCities.some(c => c.destination_id === city.destination_id)
      );
  
      const updatedCities = [...currentCities, ...newCities];
      setCurrentCities(updatedCities);
      onUpdate(updatedCities, currentDepartureCity);
    };
  
    const handleRemoveCity = (indexToRemove) => {
      const updatedCities = currentCities.filter((_, index) => index !== indexToRemove);
      setCurrentCities(updatedCities);
      onUpdate(updatedCities, currentDepartureCity);
    };
  
    const handleDepartureCityChange = (event, city) => {
      setCurrentDepartureCity(city);
      onUpdate(currentCities, city);
    };
  
    const handleInternationalToggle = (event) => {
      const checked = event.target.checked;
      setIncludeInternational(checked);
      
      if (!checked) {
        // If toggled off, clear the departure city
        setCurrentDepartureCity(null);
        onUpdate(currentCities, null);
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
              ? alpha(theme.palette.background.paper, 0.5)
              : alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: "all 0.2s ease",
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                Transportation Options
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toggle transportation options to customize your itinerary
              </Typography>
            </Box>
          </Box>
  
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
              mb: 2
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
                <FlightIcon sx={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  International Flights
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Include flights between countries in your itinerary
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={includeInternational}
                  onChange={handleInternationalToggle}
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
        </Paper>
        
        {includeInternational && (
          <Box sx={{ mb: 4 }}>
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
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
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
                  <FlightIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Departure City
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select the city you'll be departing from
                  </Typography>
                </Box>
              </Box>
  
              <Autocomplete
                options={departureCities}
                getOptionLabel={(option) => `${option.city} - ${option.name} (${option.code})`}
                value={currentDepartureCity}
                onChange={handleDepartureCityChange}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select Departure City" 
                    variant="outlined"
                    fullWidth
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused': {
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                        }
                      }
                    }}
                  />
                )}
              />
            </Paper>
          </Box>
        )}
  
        {currentCities.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
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
                <LocationIcon sx={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Selected Cities
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cities will be visited in the order shown
                </Typography>
              </Box>
            </Box>
  
            <Box 
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                },
                gap: 2,
                maxHeight: {
                  xs: '400px',
                  sm: '500px'
                },
                overflowY: 'auto',
                overflowX: 'hidden',
                p: 1
              }}
            >
              {currentCities.map((city, index) => (
                <Card
                  component={motion.div}
                  key={city.destination_id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  sx={{
                    height: '180px',
                    position: 'relative',
                    backgroundImage: `url(${city.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.7) 100%)',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: 'white',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            fontFamily: 'Montserrat',
                            fontWeight: 600
                          }}
                        >
                          {city.city}
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            fontSize: '0.875rem'
                          }}
                        >
                          {city.country}
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative' }}>
                        <IconButton
                          onClick={() => handleRemoveCity(index)}
                          sx={{
                            color: 'white',
                            backgroundColor: alpha(theme.palette.error.main, 0.3),
                            backdropFilter: 'blur(4px)',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.5)
                            },
                            width: 32,
                            height: 32
                          }}
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      background: alpha(theme.palette.background.paper, 0.2),
                      backdropFilter: 'blur(4px)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 4,
                    }}>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        #{index + 1}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        )}
  
        <Box sx={{ mb: 4 }}>
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
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
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
                <SearchIcon sx={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Search Destinations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search for countries, regions, or cities
                </Typography>
              </Box>
            </Box>
  
            <Autocomplete
              options={destinations}
              getOptionLabel={(option) => option.name}
              inputValue={searchQuery}
              onInputChange={(event, value) => setSearchQuery(value)}
              onChange={handleDestinationSelect}
              loading={loading}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Search Destination" 
                  variant="outlined"
                  fullWidth
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Paper>
        </Box>
  
        {availableCities.length > 0 && (
          <Box sx={{ mb: 4 }}>
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
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
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
                  <AddIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Add to Your Itinerary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select cities to include in your trip
                  </Typography>
                </Box>
              </Box>
  
              <Autocomplete
                multiple
                options={availableCities}
                getOptionLabel={(option) => `${option.city} - ${option.country}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Choose Cities"
                    fullWidth
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused': {
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                        }
                      }
                    }}
                  />
                )}
                onChange={handleAddCity}
              />
            </Paper>
          </Box>
        )}
      </Box>
    );
  };
  
  export default ModifyCities;