import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import FeatureCards from './FeatureCards/FeatureCards';
import ImageCarousel from './ImageCarousel/ImageCarousel';
import JourneyStories from './JourneyStories/JourneyStories';
import ProcessSteps from './ProcessSteps/ProcessSteps';
import SocialMediaSection from './SocialMedia/SocialMedia';
import Testimony from './Testimony/Testimony';

const Header = () => {
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sectionSpacing = {
    xs: 6,    // 48px on mobile
    sm: 8,    // 64px on tablet
    md: 10    // 80px on desktop
  };

  const sectionPadding = {
    xs: 2,    // 16px on mobile
    sm: 3,    // 24px on tablet
    md: 5     // 40px on desktop
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      sx={{
        textAlign: 'center',
        padding: {
          xs: '2rem 0 2rem',  // Reduced from 4rem to 2rem
          sm: '3rem 0 3rem',  // Reduced from 5rem to 3rem
          md: '4rem 0 4rem',  // Reduced from 6rem to 4rem
        },
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        position: 'relative',
        zIndex: 10,
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
      <Box 
        sx={{ 
          width: '100%',
          maxWidth: {
            xs: '100%',
            sm: '100%',
            md: '100%',
            lg: '1920px'  // Max width for very large screens
          },
          margin: '0 auto'
        }}
      >
        {/* Feature Cards Section */}
        <Box 
          sx={{ 
            px: sectionPadding,
            '& > *': { width: '100%' }
          }}
        >
          <FeatureCards />
        </Box>
        
        {/* Image Carousel Section - Full width */}
        <Box 
          sx={{ 
            mb: sectionSpacing,
            width: '100vw',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
            overflow: 'hidden'
          }}
        >
          <ImageCarousel />
        </Box>

        {/* Process Steps Section */}
        <Box 
          sx={{ 
            mb: sectionSpacing,
            px: sectionPadding,
            '& > *': { width: '100%' }
          }}
        >
          <ProcessSteps />
        </Box>

        {/* Testimony Section */}
        <Box>
          <Testimony />
        </Box>

        {/* Journey Stories Section */}
        <Box>
          <JourneyStories />
        </Box>

        {/* Social Media Section */}
        <Box 
          sx={{ 
            px: sectionPadding,
            '& > *': { width: '100%' }
          }}
        >
          <SocialMediaSection />
        </Box>
      </Box>
    </Box>
  );
};

export default Header;