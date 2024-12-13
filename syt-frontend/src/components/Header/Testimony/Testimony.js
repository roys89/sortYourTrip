import { Avatar, Box, Card, CardContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import './Testimony.css'; // Import the CSS file

const testimonials = [
  {
    name: 'John Doe',
    image: '/path-to-image/john.jpg', // Replace with actual image path
    testimony: 'This tour was absolutely amazing! The guides were so knowledgeable and friendly.',
  },
  {
    name: 'Jane Smith',
    image: '/path-to-image/jane.jpg', // Replace with actual image path
    testimony: 'I had the trip of a lifetime thanks to SortYourTrip! Everything was perfectly organized.',
  },
  {
    name: 'Sam Wilson',
    image: '/path-to-image/sam.jpg', // Replace with actual image path
    testimony: 'I will definitely book with SortYourTrip again! It was such an effortless experience.',
  },
];

const Testimony = () => {
  const theme = useTheme();

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2, // Show 2 cards at a time
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 960,
        settings: {
          slidesToShow: 1, // Show 1 card on smaller screens
        },
      },
    ],
  };

  return (
    <Box
      className="testimony-container"
      sx={{
        bgcolor: theme.palette.background.default, // Same background as the page
      }}
    >
      <Typography
        variant="h1"
        className="testimony-title"
        color="text.primary"
        sx={{
          fontWeight: "bold",
          mb: 4,
          fontSize: {
            xs: "1.8rem", 
            sm: "2.5rem", 
            md: "3rem", 
            lg: "3.5rem", 
          },
        }}
        gutterBottom
      >
        What Our Customers Say
      </Typography>
      <Slider {...settings} className="testimony-slider">
        {testimonials.map((testimonial, index) => (
          <Box key={index} sx={{ padding: '0 10px' }}>
            <Card
              className={`testimony-card ${theme.palette.mode === 'dark' ? 'dark' : ''}`}
              sx={{
                backgroundColor: theme.palette.newsletterCard.main, // Use custom color here
              }}
            >
              <Avatar
                alt={testimonial.name}
                src={testimonial.image}
                className="testimony-avatar"
              />
              <CardContent className="testimony-text">
                <Typography variant="h6" color="text.primary" gutterBottom>
                  {testimonial.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {testimonial.testimony}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default Testimony;
