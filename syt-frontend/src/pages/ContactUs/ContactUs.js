// File: ContactUs.jsx

import { Box, Button, Container, Grid, Link, Typography } from "@mui/material";
import React from "react";
import Footer from "../../components/Footer/Footer";

const ContactUs = () => {
  return (
    <Container maxWidth="lg" sx={{marginTop:{xs:"100px", md: "100px"}, padding: { xs: "1rem", md: "2rem" } }}>
      {/* Introduction */}
      <Box sx={{ textAlign: "center", marginBottom: { xs: "1.5rem", md: "2rem" } }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "1.8rem", md: "2.5rem" } }}>
          Contact Us
        </Typography>
        <Typography variant="body1" sx={{ marginTop: "1rem", color: "#555", fontSize: { xs: "0.9rem", md: "1rem" } }}>
          We’re here to help you every step of the way on your journey. Whether you have a question, need assistance with a booking, or want to share your travel experiences, we’d love to hear from you. At SortYourTrip, your satisfaction is our priority, and we’re committed to providing you with the support you need, whenever you need it.
        </Typography>
      </Box>

      {/* Contact Information */}
      <Grid container spacing={4} sx={{ marginBottom: "2rem" }}>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
              Get in Touch
            </Typography>
            <Typography variant="body1" sx={{ marginTop: "1rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
              <strong>Customer Support:</strong> Our dedicated customer support team is available 24/7 to assist you with any inquiries or concerns.
            </Typography>
            <Typography variant="body1" sx={{ marginTop: "0.5rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
              <strong>Email:</strong> info@sortyourtrip.com
            </Typography>
            <Typography variant="body1" sx={{ marginTop: "0.5rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
              <strong>Office Hours:</strong> Monday - Saturday: 11:00 AM - 8:00 PM (IST)
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
              Head Office Address
            </Typography>
            <Typography variant="body1" sx={{ marginTop: "1rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
              SortYourTrip Travel Solutions LLP
            </Typography>
            <Typography variant="body1" sx={{ marginTop: "0.5rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
              A/202, Kalpatru Habitat, Dr S.S. Road, Parel, Mumbai 400012
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Social Media */}
      <Box sx={{ textAlign: "center", marginBottom: { xs: "1.5rem", md: "2rem" } }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
          Connect with Us
        </Typography>
        <Box sx={{ marginTop: "1rem", display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "center", gap: { xs: "0.5rem", sm: "1rem" } }}>
          <Link href="https://www.facebook.com/sortyourtrip" target="_blank" rel="noopener noreferrer">
            <Button variant="contained" color="primary" fullWidth>
              Facebook
            </Button>
          </Link>
          <Link href="https://www.instagram.com/sortyourtrip" target="_blank" rel="noopener noreferrer">
            <Button variant="contained" color="secondary" fullWidth>
              Instagram
            </Button>
          </Link>
          <Link href="https://www.twitter.com/sortyourtrip" target="_blank" rel="noopener noreferrer">
            <Button variant="contained" sx={{ backgroundColor: "#1DA1F2" }} fullWidth>
              X (Twitter)
            </Button>
          </Link>
          <Link href="https://www.linkedin.com/sortyourtrip" target="_blank" rel="noopener noreferrer">
            <Button variant="contained" sx={{ backgroundColor: "#0077b5" }} fullWidth>
              LinkedIn
            </Button>
          </Link>
        </Box>
      </Box>

      {/* Partnership Inquiries */}
      <Box sx={{ marginBottom: { xs: "1.5rem", md: "2rem" } }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
          Partnership Inquiries
        </Typography>
        <Typography variant="body1" sx={{ marginTop: "1rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
          Interested in partnering with SortYourTrip? We’re always looking to collaborate with like-minded companies to create extraordinary travel experiences for our customers.
        </Typography>
        <Typography variant="body1" sx={{ marginTop: "0.5rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
          <strong>Email:</strong> info@sortyourtrip.com
        </Typography>
      </Box>

      {/* Feedback */}
      <Box sx={{ marginBottom: { xs: "1.5rem", md: "2rem" } }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
          Feedback
        </Typography>
        <Typography variant="body1" sx={{ marginTop: "1rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
          We value your feedback as it helps us improve our services and offerings. If you have suggestions or comments about your experience with SortYourTrip, please let us know.
        </Typography>
        <Typography variant="body1" sx={{ marginTop: "0.5rem", fontSize: { xs: "0.9rem", md: "1rem" } }}>
          <strong>Email:</strong> info@sortyourtrip.com
        </Typography>
      </Box>

      {/* Footer */}
      <Footer />
    </Container>
  );
};

export default ContactUs;
