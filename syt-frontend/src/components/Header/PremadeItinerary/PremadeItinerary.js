import { Box, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import './PremadeItinerary.css';

const destinations = [
  {
    title: 'THAILAND',
    subtitle: 'FALL IN LOVE WITH',
    price: 'INR 12,345 /-',
    image: '/assets/premade/thailand.jpg',
  },
  {
    title: 'DUBAI',
    subtitle: 'THE LAND OF LUXURY',
    price: 'INR 123,456 /-',
    image: '/assets/premade/dubai.jpg',
  },
  {
    title: 'VIETNAM',
    subtitle: 'THE ISLAND OF PEARLS',
    price: 'INR 12,345 /-',
    image: '/assets/premade/vietnam.jpg',
  },
  {
    title: 'PARIS',
    subtitle: 'LAND OF SOMTHING',
    price: 'INR 123,456 /-',
    image: '/assets/premade/paris.jpg',
  },
  {
    title: 'SINGAPORE',
    subtitle: 'LAND OF I DONT KNOW',
    price: 'INR 123,456 /-',
    image: '/assets/premade/singapore.jpg',
  },
  {
    title: 'UNITED KINGDOM',
    subtitle: 'LAND OF WHATEVER',
    price: 'INR 123,456 /-',
    image: '/assets/premade/london.jpg',
  },
  {
    title: 'JAPAN',
    subtitle: 'LAND OF anime',
    price: 'INR 150,236 /-',
    image: '/assets/premade/japan.jpg',
  }
];

const PremadeItinerary = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const cardsToShow = isMobile ? 1 : 4;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % destinations.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + destinations.length) % destinations.length);
  };

  const getVisibleDestinations = () => {
    const visibleItems = [];
    for (let i = 0; i < cardsToShow; i++) {
      const index = (currentIndex + i) % destinations.length;
      visibleItems.push(destinations[index]);
    }
    return visibleItems;
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 8
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%' }}
      >
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            color: theme.palette.text.special,
            fontWeight: 'bold',
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            mb: 2
          }}
        >
          Find Your Next Destination
        </Typography>
        
        <Typography
          sx={{
            textAlign: 'center',
            color: theme.palette.text.special,
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
            mb: 6
          }}
        >
          Explore the best destinations, personalized to suit your unique tastes and preferences.
        </Typography>

        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 0, sm: 2 },
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              position: 'relative',
              padding: { xs: '1rem 3rem', sm: '1rem 2.5rem' },
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto',
              justifyContent: 'center'
            }}
          >
            {getVisibleDestinations().map((destination, index) => (
              <motion.div
                key={`${destination.title}-${index}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  width: '100%',
                  minWidth: isMobile ? '260px' : '240px',
                  maxWidth: isMobile ? '280px' : '250px',
                  flex: '1 1 0',
                  margin: isMobile ? '0 auto' : undefined
                }}
              >
                <Box
                  className="destination-card"
                  sx={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    bgcolor: theme.palette.background.paper,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)'
                    },
                    mx: { xs: 'auto', sm: 0 }
                  }}
                >
                  <img
                    src={destination.image}
                    alt={destination.title}
                    style={{
                      width: '100%',
                      height: '350px',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    className="destination-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(to bottom, rgba(0,0,0,0.2), ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.7)'})`,
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      color: theme.palette.common.white
                    }}
                  >
                    <Typography sx={{ fontSize: '1rem' }}>
                      {destination.subtitle}
                    </Typography>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1.75rem' }}>
                        {destination.title}
                      </Typography>
                      <Typography>
                        Starts from
                        <br />
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {destination.price}
                        </span>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>

          <IconButton
            onClick={prevSlide}
            sx={{
              position: 'absolute',
              left: { xs: '10px', md: '20px' },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: theme.palette.primary.main,
              color: theme.palette.common.white,
              '&:hover': { 
                bgcolor: theme.palette.primary.dark,
                background: theme.palette.button.hoverGradient,
                animation: theme.palette.button.hoverAnimation
              },
              zIndex: 2
            }}
          >
            <ChevronLeft />
          </IconButton>
          
          <IconButton
            onClick={nextSlide}
            sx={{
              position: 'absolute',
              right: { xs: '10px', md: '20px' },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: theme.palette.primary.main,
              color: theme.palette.common.white,
              '&:hover': { 
                bgcolor: theme.palette.primary.dark,
                background: theme.palette.button.hoverGradient,
                animation: theme.palette.button.hoverAnimation
              },
              zIndex: 2
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </motion.div>
    </Box>
  );
};

export default PremadeItinerary;