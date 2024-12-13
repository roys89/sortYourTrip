import { Box, Card, CardContent, CardMedia, Container, Grid, Typography } from '@mui/material';
import React from 'react';
import Footer from '../../components/Footer/Footer';
import './AboutUs.css';

const AboutUs = () => {
  const offerItems = [
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
      image: "/assets/images/flight.png"
    },
    {
      title: "Beach Adventures",
      description: "Enjoy exotic beach getaways and discover beautiful coastlines.",
      image: "/assets/images/support.png"
    },
    {
      title: "Taste Local Cuisines",
      description: "Experience the authentic flavors of each destination.",
      image: "/assets/images/backpackers.png"
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
        <Box className="aboutus-section">
          <Typography variant="h4" className="aboutus-section-heading">
            Our Story
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            SortYourTrip was born from a simple idea: to take the hassle out of travel planning. Like many travelers, our founders experienced the challenges of navigating multiple booking sites, managing itineraries, and ensuring every detail of a trip was perfect. We knew there had to be a better way—an all-in-one solution that simplifies the process and elevates the travel experience.
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            With this vision in mind, we set out to create a platform that would empower travelers to plan, book, and enjoy their trips with ease.
          </Typography>
        </Box>

        {/* What We Offer Section */}
        <Box className="aboutus-section">
          <Typography variant="h4" className="aboutus-section-heading">
            What We Offer
          </Typography>
          <Grid container spacing={3}>
            {offerItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card className="aboutus-card">
                  <CardMedia
                    component="img"
                    className="aboutus-card-image"
                    image={item.image}
                    alt={item.title}
                  />
                  <CardContent className="aboutus-card-content">
                    <Typography variant="h6" className="aboutus-feature-title">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" className="aboutus-feature-description">
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Mission Section */}
        <Box className="aboutus-section">
          <Typography variant="h4" className="aboutus-section-heading">
            Our Mission
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            At SortYourTrip, our mission is simple: to make travel accessible, enjoyable, and stress-free for everyone. We are committed to providing top-notch service, unbeatable value, and a seamless experience from start to finish.
          </Typography>
        </Box>

        {/* Vision Section */}
        <Box className="aboutus-section">
          <Typography variant="h4" className="aboutus-section-heading">
            Our Vision
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            We envision a world where travel is a seamless experience, where the joys of exploration are never marred by logistical hassles. As we continue to grow, our goal is to expand our services, forging partnerships with tourism boards and other industry leaders to bring even more value and inspiration to our customers.
          </Typography>
        </Box>

        {/* Why Choose Us Section */}
        <Box className="aboutus-section">
          <Typography variant="h4" className="aboutus-section-heading">
            Why Choose Us?
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            Trusted Partnerships: Our relationships with industry-leading suppliers mean you get access to the best deals and most reliable services.
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            Expertise: With years of experience in the travel industry, our team knows what it takes to make your trip extraordinary.
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            Customer-Centric Approach: Your satisfaction is our priority. We tailor our services to meet your specific needs and ensure you have an unforgettable experience.
          </Typography>
          <Typography variant="body1" className="aboutus-text">
            Innovation: We're constantly evolving, leveraging the latest technology and insights to improve our platform and your travel experience.
          </Typography>
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default AboutUs;