import { Box, Card, CardContent, CardMedia, Container, Typography } from '@mui/material';
import React from 'react';
import Slider from 'react-slick';
import Footer from '../../components/Footer/Footer';
import './AboutUs.css';

const AboutUs = () => {
  // Slick Carousel settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
  };

  const offerCards = [
    {
      title: "Flight and Hotel Bookings",
      description: "Seamlessly book your flights and accommodations with our user-friendly platform, where you'll find competitive prices and exclusive deals.",
      image: "/assets/images/hotel.png"
    },
    {
      title: "Customized Itineraries",
      description: "Our team of experts is here to help you design personalized itineraries that match your interests and preferences.",
      image: "/assets/images/explore.png"
    },
    {
      title: "Local Experiences",
      description: "Discover hidden gems and authentic experiences curated by local experts who know the destination inside and out.",
      image: "/assets/images/local-experiences.jpg"
    },
    {
      title: "Beach Adventures",
      description: "Enjoy exotic beach getaways and discover beautiful coastlines.",
      image: "/assets/images/beach-adventures.jpg"
    },
    {
      title: "Taste Local Cuisines",
      description: "Experience the authentic flavors of each destination.",
      image: "/assets/images/local-cuisines.jpg"
    }
  ];

  return (
    <>
      <Container className="aboutus-container">
        {/* Welcome Section */}
        <Typography variant="h3" align="center" className="aboutus-heading" gutterBottom>
          Welcome to SortYourTrip
        </Typography>
        <Typography variant="body1" align="center" className="aboutus-intro">
          Your trusted partner in seamless travel planning and unforgettable experiences. Founded on a passion for exploration and a commitment to customer satisfaction, we strive to make every journey as smooth and enjoyable as possible.
        </Typography>

        {/* Our Story Section */}
        {/* ... (keep this section as is) ... */}

        {/* What We Offer Section */}
        <Box className="aboutus-section">
          <Typography variant="h4" className="aboutus-section-heading">
            What We Offer
          </Typography>
          <Slider {...settings} className="aboutus-carousel">
            {offerCards.map((card, index) => (
              <Card key={index} className="aboutus-card" sx={{ display: 'flex', flexDirection: 'row', height: 200, marginBottom: 3 }}>
                <CardMedia
                  component="img"
                  sx={{ width: '40%', objectFit: 'cover' }}
                  image={card.image}
                  alt={card.title}
                />
                <CardContent sx={{ width: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="h6" className="aboutus-feature-title">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" className="aboutus-feature-description">
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Slider>
        </Box>

        {/* Mission Section */}
        {/* ... (keep this section as is) ... */}

        {/* Vision Section */}
        {/* ... (keep this section as is) ... */}

        {/* Why Choose Us Section */}
        {/* ... (keep this section as is) ... */}
      </Container>

      <Footer />
    </>
  );
};

export default AboutUs;