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
    const [searchQuery, setSearchQuery] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentCities, setCurrentCities] = useState(selectedCities || []);
    const [currentDepartureCity, setCurrentDepartureCity] = useState(departureCity);
    const [departureCities, setDepartureCities] = useState([]);

    useEffect(() => {
        if (selectedCities) {
            setCurrentCities(selectedCities);
        }
    }, [selectedCities]);

    useEffect(() => {
        if (departureCity) {
            setCurrentDepartureCity(departureCity);
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

    return (
        <Box sx={{ width: '100%' }}>
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
                            size="medium"
                        />
                    )}
                />
            </Box>

            {currentCities.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Selected Cities
                    </Typography>
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
                                key={city.destination_id || index}
                                sx={{
                                    height: '200px',
                                    position: 'relative',
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
                                                },
                                                p: { xs: 0.5, sm: 1 }
                                            }}
                                            size="small"
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                    </Box>
                </Box>
            )}

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
                            size="medium"
                        />
                    )}
                />
            </Box>

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
                                size="medium"
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