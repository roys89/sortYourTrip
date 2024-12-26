import { Box, Button, Typography, useTheme } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

const testimonials = [
  {
    name: 'Clara Benson',
    avatar: '/assets/testimony/avatar/1f.jpg',
    images: [
      '/assets/testimony/images/001.jpg',
      '/assets/testimony/images/002.jpg',
      '/assets/testimony/images/003.jpg',
      '/assets/testimony/images/004.jpg'
    ],
    rating: 5,
    quote: "Lorem Ipsum Dolor sit amet, consectur at cupidator",
    testimony: 'Lorem ipsum dolor sit amet, consectetur at cupidatat non proident,sunt in culpa qui officia deserunt mollit anim id est laborum.'
  },
  {
    name: 'John Smith',
    avatar: '/assets/testimony/avatar/1m.jpg',
    images: [
      '/assets/testimony/images/005.jpg',
      '/assets/testimony/images/006.jpg',
      '/assets/testimony/images/007.jpg',
      '/assets/testimony/images/008.jpg'
    ],
    rating: 5,
    quote: "Another amazing experience",
    testimony: 'Another wonderful testimonial about the amazing travel experience.'
  },
  {
    name: 'Sarah Parker',
    avatar: '/assets/testimony/avatar/2f.jpg',
    images: [
      '/assets/testimony/images/009.jpg',
      '/assets/testimony/images/010.jpg',
      '/assets/testimony/images/011.jpg',
      '/assets/testimony/images/012.jpg'
    ],
    rating: 5,
    quote: "The best travel experience ever",
    testimony: 'A glowing review of the incredible journey and experiences.'
  },
  {
    name: 'Mike Johnson',
    avatar: '/assets/testimony/avatar/2m.jpg',
    images: [
      '/assets/testimony/images/013.jpg',
      '/assets/testimony/images/014.jpg',
      '/assets/testimony/images/015.jpg',
      '/assets/testimony/images/016.jpg'
    ],
    rating: 5,
    quote: "Unforgettable memories made",
    testimony: 'Sharing memories of an unforgettable travel experience.'
  },
  {
    name: 'Emily Davis',
    avatar: '/assets/testimony/avatar/3f.jpg',
    images: [
      '/assets/testimony/images/017.jpg',
      '/assets/testimony/images/018.jpg',
      '/assets/testimony/images/019.jpg',
      '/assets/testimony/images/020.jpg'
    ],
    rating: 5,
    quote: "Perfect vacation planning",
    testimony: 'Describing the perfectly planned vacation experience.'
  }
];

const Testimony = () => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(2);
  const [direction, setDirection] = useState(0);
  const avatarSize = 100;

  const moveSlider = (newDirection) => {
    setDirection(newDirection === 'next' ? 1 : -1);
    setActiveIndex(prev => {
      if (newDirection === 'next') {
        return prev === testimonials.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  };

  const getVisibleAvatars = () => {
    let visibleOnes = [];
    const totalItems = testimonials.length;

    for (let i = -2; i <= 2; i++) {
      let index = (activeIndex + i + totalItems) % totalItems;
      visibleOnes.push({
        data: testimonials[index],
        offset: i,
        index
      });
    }
    return visibleOnes;
  };

  return (
    <Box 
      sx={{ 
        maxWidth: '1200px', 
        mx: 'auto', 
        py: 8,
        px: { xs: 2, md: 4 }
      }}
    >
      <Typography 
        variant="h2" 
        sx={{ 
          textAlign: 'center',
          fontWeight: 'bold',
          color: theme.palette.text.special,
          mb: 1,
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
        }}
      >
        Stories From Our Journey-Takers
      </Typography>
      
      <Typography 
        sx={{ 
          textAlign: 'center',
          color: theme.palette.text.secondary,
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
          mb: 6
        }}
      >
        Real travelers, real stories. See what they have to say about their journeys!
      </Typography>

      {/* Avatar Carousel */}
      <Box sx={{ 
        position: 'relative', 
        height: '256px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 4
      }}>
        <Button
          onClick={() => moveSlider('prev')}
          sx={{
            position: 'absolute',
            left: { xs: 0, md: '128px' },
            minWidth: 'auto',
            p: 1,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.common.white,
            borderRadius: '50%',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              background: theme.palette.button.hoverGradient,
              animation: theme.palette.button.hoverAnimation
            },
            zIndex: 10
          }}
        >
          <ChevronLeft size={24} />
        </Button>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
          width: 'calc(100% - 256px)'
        }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div 
              key={activeIndex}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '64px',
                position: 'absolute'
              }}
              custom={direction}
              initial={{ x: direction > 0 ? 500 : -500 }}
              animate={{ x: 0 }}
              exit={{ x: direction > 0 ? -500 : 500 }}
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 }
              }}
            >
              {getVisibleAvatars().map(({ data, offset, index }) => (
                <motion.div
                  key={index}
                  animate={{
                    scale: offset === 0 ? 1.5 : 1,
                    opacity: offset === 0 ? 1 : 0.5,
                    filter: offset === 0 ? 'grayscale(0%)' : 'grayscale(40%)'
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    flexShrink: 0
                  }}
                >
                  <img
                    src={data.avatar}
                    alt={data.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </Box>

        <Button
          onClick={() => moveSlider('next')}
          sx={{
            position: 'absolute',
            right: { xs: 0, md: '128px' },
            minWidth: 'auto',
            p: 1,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.common.white,
            borderRadius: '50%',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              background: theme.palette.button.hoverGradient,
              animation: theme.palette.button.hoverAnimation
            },
            zIndex: 10
          }}
        >
          <ChevronRight size={24} />
        </Button>
      </Box>

      {/* Testimonial Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              sx={{ 
                fontSize: '2rem',
                color: theme.palette.primary.main,
                mb: 1
              }}
            >
              {'★'.repeat(testimonials[activeIndex].rating)}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              {testimonials[activeIndex].name}
            </Typography>
          </Box>

          <Box sx={{ 
            bgcolor: theme.palette.background.paper,
            borderRadius: '16px',
            p: 4,
            boxShadow: 3
          }}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4
            }}>
              {/* Left Side */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  mb: 3
                }}>
                  <img
                    src={testimonials[activeIndex].avatar}
                    alt={testimonials[activeIndex].name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
                <Typography sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '1.125rem',
                  lineHeight: 1.7,
                  maxWidth: '32rem'
                }}>
                  {testimonials[activeIndex].testimony}
                </Typography>
              </Box>

              {/* Right Side - Images */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2
              }}>
                {testimonials[activeIndex].images.map((image, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={image}
                    alt={`Travel moment ${idx + 1}`}
                    sx={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      borderRadius: 2,
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default Testimony;