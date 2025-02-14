import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

const TestimonialCarousel = () => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      title: 'I Booked A Day Trip To Giethoorn From',
      content: 'I booked a day trip to Giethoorn from Amsterdam through and TripHobo even extended me a discount. The tour company we went with was marvelous and everything went very well. I highly recommend the...',
      author: 'Barbara Neu'
    },
    {
      title: 'Multnomah Falls/ Columbia River Geo...',
      content: 'This was a wonderful tour. An easy and comfortable drive out from Portland with an extremely knowledgeable tour guide - Evan, who was very passionate about his home town and surrounding...',
      author: 'Tam'
    },
    {
      title: 'Trip Hobo Makes Trip Planning Fun!',
      content: 'I just found this site when planning my wedding anniversary trip next year. So far, I really like it! It\'s user-friendly and takes you step-by-step through the trip planning process. I use other trip planning...',
      author: 'Melissa Blackson'
    },
    {
      title: 'Amazing Experience in the Swiss Alps',
      content: 'The Swiss Alps tour was breathtaking. The guide was very informative and the scenery was out of this world. I would definitely book with TripHobo again for my next adventure.',
      author: 'John Doe'
    },
    {
      title: 'Great Time in Paris',
      content: 'Paris was everything I dreamed of and more. The Eiffel Tower tour was spectacular, and the food was delicious. Thanks to TripHobo for making it all so easy and enjoyable.',
      author: 'Jane Smith'
    },
    {
      title: 'Unforgettable Safari in Kenya',
      content: 'The safari in Kenya was an unforgettable experience. We saw so many animals up close and the guides were very knowledgeable. TripHobo made the booking process seamless.',
      author: 'Michael Brown'
    },
    {
      title: 'Beautiful Beaches in Thailand',
      content: 'Thailand\'s beaches are paradise. The tour was well-organized, and we had plenty of time to relax and explore. I highly recommend TripHobo for anyone planning a trip to Thailand.',
      author: 'Sarah Johnson'
    },
    {
      title: 'Cultural Tour in Japan',
      content: 'The cultural tour in Japan was fascinating. We visited temples, tried traditional food, and learned so much about Japanese history. TripHobo provided excellent service throughout the trip.',
      author: 'David Wilson'
    },
    {
      title: 'Adventure in New Zealand',
      content: 'New Zealand is a must-visit for adventure lovers. The activities were thrilling, and the landscapes were stunning. Thanks to TripHobo for a well-planned and exciting trip.',
      author: 'Emily Davis'
    },
    {
      title: 'Relaxing Cruise in the Caribbean',
      content: 'The Caribbean cruise was the perfect getaway. The ship was luxurious, and the destinations were beautiful. TripHobo made sure everything was taken care of, so we could just relax and enjoy.',
      author: 'Daniel Martinez'
    }
  ];

  const totalSlides = Math.ceil(testimonials.length / 2);
  
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalSlides - 1 : prevIndex - 1
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: theme.palette.mode === 'light' ? theme.palette.background.default : theme.palette.background.paper,
        position: 'relative'
      }}
    >
      <Box
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
          px: { xs: 2, md: 4 },
          position: 'relative'
        }}
      >
        {/* Navigation Buttons */}
        <IconButton
          onClick={prevSlide}
          sx={{
            position: 'absolute',
            left: { xs: 0, md: -20 },
            top: '50%',
            transform: 'translateY(-50%)',
            '&:hover': {
              bgcolor: 'transparent',
            }
          }}
        >
          <ChevronLeft color={theme.palette.text.primary} />
        </IconButton>
        
        <IconButton
          onClick={nextSlide}
          sx={{
            position: 'absolute',
            right: { xs: 0, md: -20 },
            top: '50%',
            transform: 'translateY(-50%)',
            '&:hover': {
              bgcolor: 'transparent',
            }
          }}
        >
          <ChevronRight color={theme.palette.text.primary} />
        </IconButton>

        {/* Testimonials */}
        <Box sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              transition: 'transform 500ms ease-in-out',
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {Array.from({ length: totalSlides }, (_, slideIndex) => (
              <Box
                key={slideIndex}
                sx={{
                  width: '100%',
                  flexShrink: 0,
                  display: 'flex',
                  gap: 4,
                  px: { xs: 2, md: 4 },
                }}
              >
                {testimonials.slice(slideIndex * 2, slideIndex * 2 + 2).map((testimonial, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      p: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '1rem',
                        mb: 1,
                      }}
                    >
                      {testimonial.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.palette.text.primary,
                        flex: 1,
                        fontSize: '0.9rem',
                        mt: 1,
                      }}
                    >
                      {testimonial.content}
                    </Typography>
                    <Typography
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        mt: 'auto',
                      }}
                    >
                      {testimonial.author}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Dots Indicator */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 3,
          }}
        >
          {Array.from({ length: totalSlides }, (_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? theme.palette.primary.main : theme.palette.grey[300],
                cursor: 'pointer',
                transition: 'background-color 200ms',
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TestimonialCarousel;