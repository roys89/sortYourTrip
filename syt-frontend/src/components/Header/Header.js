import { Box, Grid, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Clock, Cloud, Plane, Sliders } from 'lucide-react';
import React from 'react';
import './Header.css';
import ImageCarousel from './ImageCarousel/ImageCarousel';
import JourneyStories from './JourneyStories/JourneyStories';
import PremadeItinerary from './PremadeItinerary/PremadeItinerary';
import SocialMediaSection from './SocialMedia/SocialMedia';
import Testimony from './Testimony/Testimony';

const Header = () => {
  const theme = useTheme();

  const features = [
    { icon: <Plane size={32} />, title: 'Book Instantly' },
    { icon: <Sliders size={32} />, title: 'Instant Custom' },
    { icon: <Cloud size={32} />, title: 'All-in-One' },
    { icon: <Clock size={32} />, title: 'Save Time' }
  ];

  const steps = [
    {
      number: '01',
      title: 'Personalize your itinerary',
      description: 'Answer a few simple questions about your interests and get a personalized itinerary catered to your unique preferences and travel goals.'
    },
    {
      number: '02',
      title: 'Customize your trip',
      description: 'Go one step further with the help of our user-friendly trip organizer that allows you to customize activities and hotels seamlessly.'
    },
    {
      number: '03',
      title: 'Sort Your Trip',
      description: 'Get your trip sorted with SortYourTrip by booking all your experiences in one place and avoiding countless hours browsing and booking from multiple sites.'
    }
  ];

  return (
    <>
      <ImageCarousel />
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        sx={{
          textAlign: 'center',
          padding: {
            xs: '5rem 1rem 3rem',
            sm: '3rem 2rem',
            md: '2rem 5rem',
          },
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          position: 'relative',
          zIndex: 10,
          backgroundImage: 'url("/assets/h1-bckg-05.png")',
          backgroundSize: 'fit',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            
            zIndex: -1
          }
        }}
      >
        <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              fontSize: {
                xs: '1.8rem',
                sm: '2.5rem',
                md: '3rem',
                lg: '3.5rem',
              },
              color: theme.palette.primary.main
            }}
          >
            What Makes SortYourTrip Different?
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mb: 10,
              fontSize: {
                xs: '1rem',
                sm: '1.1rem',
                md: '1.2rem',
              },
              color: theme.palette.primary.light
            }}
          >
            Personalized and Customized Travel Experience - Your Travel Personal Assistant
          </Typography>

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              fontSize: {
                xs: '1.8rem',
                sm: '2.5rem',
                md: '3rem',
                lg: '3.5rem',
              },
              color: theme.palette.primary.main
            }}
          >
            Vacation Planning Made Quick & Easy
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mb: 8,
              fontSize: {
                xs: '1rem',
                sm: '1.1rem',
                md: '1.2rem',
              },
              color: theme.palette.primary.light
            }}
          >
            Craft your personalized adventure, tailored just for you. Travel hassle-free with ease.
          </Typography>

          <Grid
            container
            spacing={4}
            sx={{
              justifyContent: 'center',
              alignItems: 'stretch',
              mb: 8
            }}
          >
            {features.map((feature, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Box 
                    className="feature-item"
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      '&:hover::before': {
                        background: theme.palette.button.hoverGradient,
                        animation: theme.palette.button.hoverAnimation,
                      }
                    }}
                  >
                    <div className="feature-icon">
                      {React.cloneElement(feature.icon, { 
                        className: 'icon',
                        style: { color: theme.palette.primary.main }
                      })}
                    </div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mt: 2,
                        color: theme.palette.text.primary
                      }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <PremadeItinerary />
          
          <Grid
            container
            spacing={4}
            sx={{
              justifyContent: 'center',
              alignItems: 'stretch',
              textAlign: 'center',
            }}
          >
            {steps.map((step, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Box 
                    className="step-content"
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      '.step-number': {
                        background: theme.palette.button.hoverGradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: theme.palette.button.hoverAnimation,
                      }
                    }}
                  >
                    <Typography variant="h3" className="step-number">
                      {step.number}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.5rem',
                        color: theme.palette.text.primary
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontSize: '1.2rem', 
                        mb: 2,
                        color: theme.palette.text.primary
                      }}
                    >
                      {step.description}
                    </Typography>
                    <img
                      src={`${process.env.PUBLIC_URL}/assets/images/step${index + 1}.png`}
                      alt={`Step ${index + 1}`}
                      className="step-image"
                    />
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
        <Testimony />
        <JourneyStories />
        <SocialMediaSection />
      </Box>
    </>
  );
};

export default Header;