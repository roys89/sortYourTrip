import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DateTime } from "luxon";
import React from "react";
import "./ReviewForm.css"; // Import the CSS for custom styling

const ReviewForm = ({ itineraryData }) => {
  const theme = useTheme();
  const {
    selectedCities,
    departureCity,
    departureDates,
    travelersDetails,
    preferences,
    includeInternational,
    includeGroundTransfer,
    includeFerryTransport,
  } = itineraryData;

  // Function to format dates using Luxon
  const formatDate = (date) => {
    return DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED);
  };

  const renderTravelerDetails = () => {
    return (
      <>
        <Typography variant="body1">
          <strong>Type:</strong> {travelersDetails.type}
        </Typography>
        {travelersDetails.type === "solo" && (
          <Typography variant="body1">
            Age: {travelersDetails.soloAge}
          </Typography>
        )}
        {travelersDetails.type === "couple" && (
          <>
            <Typography variant="body1">
              Adult 1 Age: {travelersDetails.coupleAdult1Age}
            </Typography>
            <Typography variant="body1">
              Adult 2 Age: {travelersDetails.coupleAdult2Age}
            </Typography>
          </>
        )}
        {(travelersDetails.type === "family" ||
          travelersDetails.type === "friends") && (
          <Box className="room-scroll-container">
            {travelersDetails.rooms.map((room, index) => (
              <Card
                className="room-card"
                key={index}
                 style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(141, 141, 141, 0.5)"
                      : "rgba(255, 165, 96, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
              >
                <CardContent>
                  <Typography variant="body1" className="room-title">
                    Room {index + 1}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Adults:</strong> {room.adults.join(", ")}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Children:</strong> {room.children.join(", ")}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </>
    );
  };

  const truncateCountry = (country) => {
    if (!country) return "";
    return country.split(" ")[0] + (country.split(" ").length > 1 ? "..." : "");
  };

  return (
    <Box className="review-form-container">
      <Typography variant="h6" gutterBottom className="form-header">
        Review Your Itinerary
      </Typography>

      <Grid container spacing={2} className="review-grid">
        <Grid item xs={12}>
          <Card
            className="section-card"
            style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#000",
                  borderColor: "#FF9800",
                }}
          >
            <CardContent>
              <Typography variant="body1">
                <strong>Selected Cities:</strong>{" "}
              </Typography>
              <Box className="city-scroll-container">
                {selectedCities.length > 0 ? (
                  selectedCities.map((city, index) => (
                    <div className="city-card" key={index}>
                      <div className="city-image-container">
                        <img
                          src={city.imageUrl || "/default-city-image.jpg"}
                          alt={city.name}
                          className="city-image"
                        />
                        <div className="city-info">
                          <Typography variant="body2" className="city-name">
                            {city.name}
                          </Typography>
                          {city.country && (
                            <Typography
                              variant="body2"
                              className="city-country"
                            >
                              {truncateCountry(city.country)}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Typography variant="body2">No cities selected.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Departure City, Departure Date, and Return Date in a row */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card
                className="section-card"
                 style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
              >
                <CardContent>
                  <Typography variant="body1">
                    <strong>Departure City:</strong>{" "}
                    {departureCity
                      ? `${departureCity.city} - ${departureCity.name} (${departureCity.iata})`
                      : "Not specified"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card
                className="section-card"
                 style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
              >
                <CardContent>
                  <Typography variant="body1">
                    <strong>Departure Date:</strong>{" "}
                    {departureDates.startDate
                      ? formatDate(departureDates.startDate)
                      : "Not selected."}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card
                className="section-card"
                style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
              >
                <CardContent>
                  <Typography variant="body1">
                    <strong>Return Date:</strong>{" "}
                    {departureDates.endDate
                      ? formatDate(departureDates.endDate)
                      : "Not selected."}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Card
            className="section-card"
            style={{
              backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                color: theme.palette.mode === "light" ? "#000" : "#fff",
                borderColor: "#FF9800",
              }}
          >
            <CardContent>{renderTravelerDetails()}</CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            className="section-card"
            style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
          >
            <CardContent>
              <Typography variant="body1">
                <strong>Preferences:</strong>{" "}
                {preferences.selectedInterests.length > 0
                  ? preferences.selectedInterests.join(", ")
                  : "None"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            className="section-card"
            style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
          >
            <CardContent>
              <Typography variant="body1">
                <strong>Budget:</strong> {preferences.budget || "Not specified"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card
                className="section-card transport-option-card"
                 style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
              >
                <CardContent>
                  <Typography variant="body2">
                    <strong>Include International Flights:</strong>{" "}
                    {includeInternational ? "Yes" : "No"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card
                className="section-card transport-option-card"
                 style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
              >
                <CardContent>
                  <Typography variant="body2">
                    <strong>Include Ground Transfers:</strong>{" "}
                    {includeGroundTransfer ? "Yes" : "No"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card
                className="section-card transport-option-card"
                 style={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(51, 51, 51, 0.5)"
                      : "rgba(255, 180, 123, 0.6)",
                  color: theme.palette.mode === "light" ? "#000" : "#fff",
                  borderColor: "#FF9800",
                  borderRadius: "30px",
                }}
              >
                <CardContent>
                  <Typography variant="body2">
                    <strong>Include Ferry Transport:</strong>{" "}
                    {includeFerryTransport ? "Yes" : "No"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewForm;
