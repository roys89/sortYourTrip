import { Box, Grid, Typography, useTheme } from "@mui/material";
import React from "react";
import "./Header.css";
import Newsletter from "./Newsletter/Newsletter";
import Testimony from "./Testimony/Testimony";

const Header = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        textAlign: "center",
        padding: {
          xs: "3rem 1rem",
          sm: "3rem 2rem",
          md: "2rem 5rem",
        },
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Typography
          variant="h2"
          component="h1"
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
        >
          Vacation planning made quick & easy in 3 simple steps
        </Typography>

        <Grid
          container
          spacing={4} // Keep spacing slightly reduced
          sx={{
            justifyContent: "center",
            alignItems: "stretch",
            textAlign: "center",
          }}
        >
          {/* Step 1 */}
          <Grid item xs={12} sm={6} md={4}>
            <Box className="step-content">
              <Typography variant="h3" className="step-number">
                01
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", fontSize: "1.5rem" }}
              >
                Personalize your itinerary
              </Typography>
              <Typography sx={{ fontSize: "1.2rem", mb: 2 }}>
                Answer a few simple questions about your interests and get a
                personalized itinerary catered to your unique preferences and
                travel goals.
              </Typography>
              <img
                src={`${process.env.PUBLIC_URL}/assets/images/step1.png`}
                alt="Step 1"
                className="step-image"
              />
            </Box>
          </Grid>

          {/* Step 2 */}
          <Grid item xs={12} sm={6} md={4}>
            <Box className="step-content">
              <Typography variant="h3" className="step-number">
                02
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", fontSize: "1.5rem" }}
              >
                Customize your trip
              </Typography>
              <Typography sx={{ fontSize: "1.2rem", mb: 2 }}>
                Go one step further with the help of our user-friendly trip
                organizer that allows you to customize activities and hotels
                seamlessly.
              </Typography>
              <img
                src={`${process.env.PUBLIC_URL}/assets/images/step2.png`}
                alt="Step 2"
                className="step-image"
              />
            </Box>
          </Grid>

          {/* Step 3 */}
          <Grid item xs={12} sm={6} md={4}>
            <Box className="step-content">
              <Typography variant="h3" className="step-number">
                03
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", fontSize: "1.5rem" }}
              >
                Sort Your Trip
              </Typography>
              <Typography sx={{ fontSize: "1.2rem", mb: 2 }}>
                Get your trip sorted with SortYourTrip by booking all your
                experiences in one place and avoiding countless hours browsing
                and booking from multiple sites.
              </Typography>
              <img
                src={`${process.env.PUBLIC_URL}/assets/images/step3.png`}
                alt="Step 3"
                className="step-image"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Testimony />
      <Newsletter />
    </Box>
  );
};

export default Header;
