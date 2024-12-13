import { Box, Card, Typography } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import axios from "axios";
import React, { useEffect, useState } from "react";

const SelectCityForm = ({ destinationType, destination, saveSelectedCities }) => {
  const theme = useTheme();
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch cities based on destination type
  const fetchCities = async (destination, destinationType) => {
    try {
      let response;
      if (destinationType === 'city') {
        const [cityOnly] = destination.includes(' - ') ? destination.split(' - ') : [destination];
        response = await axios.get(
          `http://localhost:5000/api/destinations/cities?destination=${cityOnly}&destinationType=city`
        );
      } else if (destinationType === 'country') {
        const countryOnly = destination.includes(' - ') ? destination.split(' - ')[0] : destination;
        response = await axios.get(
          `http://localhost:5000/api/destinations/cities?destination=${countryOnly}&destinationType=country`
        );
      } else if (destinationType === 'continent') {
        response = await axios.get(
          `http://localhost:5000/api/destinations/cities?destination=${destination}&destinationType=continent`
        );
      }

      const allCities = response.data;
      // Sort cities by rating and ranking
      allCities.sort((a, b) => b.rating - a.rating || a.ranking - b.ranking);
      setCities(allCities);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setLoading(false);
    }
  };

  // Effect to fetch cities whenever destination or destinationType changes
  useEffect(() => {
    setLoading(true);
    if (destinationType && destination) {
      fetchCities(destination, destinationType);
    }
  }, [destinationType, destination]);

  // Effect to update parent component when selectedCities changes
  useEffect(() => {
    saveSelectedCities(selectedCities);
  }, [selectedCities, saveSelectedCities]);

  // Handle city selection
  const handleCitySelect = (city, event) => {
    // Prevent any default touch/click behavior
    event.preventDefault();
    event.stopPropagation();

    setSelectedCities((prevSelected) => {
      const isCurrentlySelected = prevSelected.some(
        (selectedCity) => selectedCity.destination_id === city.destination_id
      );

      if (isCurrentlySelected) {
        // Remove the city if it's already selected
        return prevSelected.filter(
          (selectedCity) => selectedCity.destination_id !== city.destination_id
        );
      } else {
        // Add the city if it's not selected
        const cityInfo = {
          destination_id: city.destination_id,
          name: city.name,
          city: city.city,
          country: city.country || '',
          continent: city.continent || '',
          ranking: city.ranking || '',
          lat: city.lat || '',
          long: city.long || '',
          imageUrl: city.imageUrl || '',
        };
        return [...prevSelected, cityInfo];
      }
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Loading cities...</Typography>
      </Box>
    );
  }
  
    return (
      <Box sx={{ 
        width: '100%',
        px: { xs: 1, sm: 2 },
        py: 2
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            textAlign: 'center'
          }}
        >
          Select Cities
        </Typography>
  
        <Box 
          sx={{ 
            height: '400px', 
            overflowY: 'auto',
            width: '100%',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px'
            }
          }}
        >
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: { xs: 1, sm: 2 },
              width: '100%',
              m: 0
            }}
          >
            {cities.map((city) => {
              const isSelected = selectedCities.some(
                (selectedCity) => selectedCity.destination_id === city.destination_id
              );
  
              return (
                <Card
                  key={city.destination_id}
                  onClick={(e) => handleCitySelect(city, e)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                  }}
                  sx={{
                    position: 'relative',
                    height: { xs: '160px', sm: '200px' },
                    width: '100%',
                    border: isSelected
                      ? '5px solid #FF9800'
                      : '5px solid rgba(255, 180, 123, 0.6)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.3s',
                    overflow: 'hidden',
                    WebkitTapHighlightColor: 'transparent',
                    '@media (hover: hover)': {
                      '&:hover': {
                        borderColor: '#FF9800'
                      }
                    }
                  }}
                >
                  {/* Image */}
                  <Box
                    component="img"
                    src={city.imageUrl || "default-city-image.jpg"}
                    alt={city.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none'
                    }}
                  />
  
                  {/* Content Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(5px)',
                      padding: { xs: 1, sm: 1.5 },
                      borderBottomLeftRadius: '11px', // Account for the 5px border
                      borderBottomRightRadius: '11px',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        fontWeight: 600,
                        color: 'rgba(0, 0, 0, 0.87)',
                        mb: 0.5
                      }}
                    >
                      {city.name}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        color: 'rgba(0, 0, 0, 0.6)'
                      }}
                    >
                      Rating: {city.rating || "N/A"}
                    </Typography>
                  </Box>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  };
  
  export default SelectCityForm;