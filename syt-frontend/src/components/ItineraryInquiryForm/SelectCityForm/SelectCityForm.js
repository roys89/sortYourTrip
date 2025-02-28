import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
          iata: city.iata || '',
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
          mb: 1,
          textAlign: 'center'
        }}
      >
        Select Cities
      </Typography>
      
      <Typography 
        variant="subtitle1" 
        sx={{ 
          mb: 2,
          textAlign: 'center',
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          fontStyle: 'italic'
        }}
      >
        Please select cities in the order you wish to travel
      </Typography>

      {/* Increased gap between cards */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: { xs: 3, sm: 4 },
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
              elevation={isSelected ? 12 : 3}
              sx={{
                position: 'relative',
                height: { xs: '180px', sm: '240px' },
                width: '100%',
                borderRadius: '24px',
                cursor: 'pointer',
                overflow: 'hidden',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isSelected ? 
                  `0 0 0 4px ${theme.palette.primary.main}, 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)` : 
                  '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
                }
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 2,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  <CheckCircleIcon fontSize="small" />
                </Box>
              )}
              
              {/* Image with gradient overlay */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '60%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                    borderBottomLeftRadius: '24px',
                    borderBottomRightRadius: '24px',
                    zIndex: 1
                  }
                }}
              >
                <Box
                  component="img"
                  src={city.imageUrl || "default-city-image.jpg"}
                  alt={city.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    filter: isSelected ? 'brightness(1.1) contrast(1.1)' : 'none',
                    transition: 'filter 0.3s ease'
                  }}
                />
              </Box>

              {/* Content Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: { xs: 1.5, sm: 2 },
                  zIndex: 2,
                  transition: 'transform 0.3s ease'
                }}
              >
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 600,
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    mb: 0.5
                  }}
                >
                  {city.name}
                </Typography>
                <Box 
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Box 
                      key={star}
                      component="span" 
                      sx={{
                        color: star <= Math.round(city.rating || 0) ? '#FFD700' : 'rgba(255,255,255,0.3)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      ★
                    </Box>
                  ))}
                  <Typography 
                    variant="body2"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      color: 'rgba(255,255,255,0.9)',
                      ml: 0.5
                    }}
                  >
                    {city.rating || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default SelectCityForm;