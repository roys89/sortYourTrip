import CloseIcon from '@mui/icons-material/Close';
import {
    Autocomplete,
    Box,
    Card,
    IconButton,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';
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
    console.log('ModifyCities received props:', { selectedCities, departureCity });

    const [searchQuery, setSearchQuery] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentCities, setCurrentCities] = useState(selectedCities || []);
    const [currentDepartureCity, setCurrentDepartureCity] = useState(departureCity);
    const [departureCities, setDepartureCities] = useState([]);

    // Update currentCities when selectedCities prop changes
    useEffect(() => {
        if (selectedCities) {
            setCurrentCities(selectedCities);
        }
    }, [selectedCities]);

    // Update currentDepartureCity when departureCity prop changes
    useEffect(() => {
        if (departureCity) {
            setCurrentDepartureCity(departureCity);
        }
    }, [departureCity]);

    // Fetch departure cities
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

    // Search destinations with debounce
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
            console.log('Available cities fetched:', response.data);
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

    return (
        <Box sx={{ width: '100%' }}>
            {/* Departure City Selector */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Departure City
                </Typography>
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
                        />
                    )}
                />
            </Box>

            {/* Selected Cities - Horizontal Scroll */}
            {currentCities.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Selected Cities
                    </Typography>
                    <Box 
                        sx={{
                            display: 'flex',
                            gap: 2,
                            overflowX: 'auto',
                            pb: 2, // Space for scrollbar
                            '::-webkit-scrollbar': {
                                height: '8px',
                            },
                            '::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                                borderRadius: '4px',
                            },
                            '::-webkit-scrollbar-thumb': {
                                background: '#888',
                                borderRadius: '4px',
                                '&:hover': {
                                    background: '#555'
                                }
                            }
                        }}
                    >
                        {currentCities.map((city, index) => (
                            <Card
                                key={city.destination_id || index}
                                sx={{
                                    minWidth: 280,
                                    height: 200,
                                    position: 'relative',
                                    flexShrink: 0,
                                    backgroundImage: `url(${city.imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
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
                                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                                                }}
                                            >
                                                {city.city}
                                            </Typography>
                                            <Typography 
                                                sx={{ 
                                                    color: 'white',
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                                }}
                                            >
                                                {city.country}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            onClick={() => handleRemoveCity(index)}
                                            sx={{
                                                color: 'white',
                                                backgroundColor: 'rgba(0,0,0,0.3)',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0,0,0,0.5)'
                                                }
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Destination Search */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Search Destination
                </Typography>
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
                        />
                    )}
                />
            </Box>

            {/* Available Cities Selection */}
            {availableCities.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Select Cities
                    </Typography>
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
                            />
                        )}
                        onChange={handleAddCity}
                    />
                </Box>
            )}
        </Box>
    );
};

export default ModifyCities;