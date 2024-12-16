import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Activity,
  Car,
  ChevronDown,
  Hotel,
  MapPin,
  Plane,
  Receipt,
  Train
} from "lucide-react";
import React, { useState } from "react";

const BookingSummary = ({ itinerary }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState("activities");
  const [visibleActivities, setVisibleActivities] = useState(2);
  const [visibleFlights, setVisibleFlights] = useState(2);
  const [visibleTransfers, setVisibleTransfers] = useState(2);
  const [visibleHotels, setVisibleHotels] = useState(2);

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const styles = {
    sectionTitle: {
      color: theme.palette.primary.main,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      mb: 3
    },
    accordionStyles: {
      mb: 3,
      "&.MuiAccordion-root": {
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.4)'
          : 'rgba(66, 66, 66, 0.4)',
        "&:before": {
          display: "none",
        },
      },
      "&.Mui-expanded": {
        margin: "0 0 24px 0",
      },
      "& .MuiAccordionSummary-root": {
        borderRadius: 2,
        "&:hover": {
          backgroundColor: theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.6)'
            : 'rgba(66, 66, 66, 0.6)',
        },
      },
      "& .MuiAccordionDetails-root": {
        borderRadius: "0 0 16px 16px",
      },
    },
    paperStyles: {
      p: 2,
      display: "flex",
      alignItems: "center",
      gap: 2,
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(255, 255, 255, 0.4)'
        : 'rgba(66, 66, 66, 0.4)',
       
      borderRadius: 2,
      "&:hover": {
        backgroundColor: theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.6)'
          : 'rgba(66, 66, 66, 0.6)',
      },
    },
    buttonStyles: {
      color: theme.palette.primary.main,
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },
    },
    priceSummary: {
      p: 2,
      backgroundColor: theme.palette.mode === 'light'
        ? 'rgba(255, 255, 255, 0.4)'
        : 'rgba(66, 66, 66, 0.4)',
       
      borderRadius: 2,
    },
  };

  const renderActivitiesSummary = () => {
    const allActivities = itinerary.cities.flatMap((city) =>
      city.days.flatMap((day) =>
        (day.activities || [])
          .filter((a) => a.activityType === "online")
          .map((activity) => ({ ...activity, date: day.date }))
      )
    );

    const displayActivities = allActivities.slice(0, visibleActivities);
    const hasMoreActivities = allActivities.length > visibleActivities;

    return (
      <Accordion
        expanded={expanded === "activities"}
        onChange={handleChange("activities")}
        sx={styles.accordionStyles}
      >
        <AccordionSummary
          expandIcon={<ChevronDown color={theme.palette.text.primary} />}
        >
          <Activity
            size={24}
            style={{ marginRight: 10, color: theme.palette.text.primary }}
          />
          <Typography variant="subtitle1" fontWeight="medium">
            Activities ({allActivities.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {displayActivities.map((activity, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={styles.paperStyles}>
                  <MapPin size={24} color={theme.palette.text.secondary} />
                  <Box flexGrow={1}>
                    <Typography variant="subtitle2">
                      {activity.activityName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.date}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" color="primary">
                    ₹{activity.packageDetails.amount.toLocaleString("en-IN")}
                  </Typography>
                </Paper>
              </Grid>
            ))}
            {hasMoreActivities && (
              <Grid item xs={12}>
                <Button
                  variant="text"
                  fullWidth
                  sx={styles.buttonStyles}
                  onClick={() => setVisibleActivities(allActivities.length)}
                  endIcon={<ChevronDown />}
                >
                  View All {allActivities.length} Activities
                </Button>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderFlightsSummary = () => {
    const allFlights = itinerary.cities.flatMap((city) =>
      city.days.flatMap((day) => day.flights || [])
    );

    const displayFlights = allFlights.slice(0, visibleFlights);
    const hasMoreFlights = allFlights.length > visibleFlights;

    return (
      <Accordion
        expanded={expanded === "flights"}
        onChange={handleChange("flights")}
        sx={styles.accordionStyles}
      >
        <AccordionSummary
          expandIcon={<ChevronDown color={theme.palette.text.primary} />}
        >
          <Plane
            size={24}
            style={{ marginRight: 10, color: theme.palette.text.primary }}
          />
          <Typography variant="subtitle1" fontWeight="medium">
            Flights ({allFlights.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {displayFlights.map((flight, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={styles.paperStyles}>
                  <Plane size={24} color={theme.palette.text.secondary} />
                  <Box flexGrow={1}>
                    <Typography variant="subtitle2">
                      {flight.flightData.airline} -{" "}
                      {flight.flightData.flightCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flight.flightData.origin} to{" "}
                      {flight.flightData.destination}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" color="primary">
                    ₹{flight.flightData.price.toLocaleString("en-IN")}
                  </Typography>
                </Paper>
              </Grid>
            ))}
            {hasMoreFlights && (
              <Grid item xs={12}>
                <Button
                  variant="text"
                  fullWidth
                  sx={styles.buttonStyles}
                  onClick={() => setVisibleFlights(allFlights.length)}
                  endIcon={<ChevronDown />}
                >
                  View All {allFlights.length} Flights
                </Button>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderTransfersSummary = () => {
    const allTransfers = itinerary.cities.flatMap((city) =>
      city.days.flatMap((day) => day.transfers || [])
    );

    const displayTransfers = allTransfers.slice(0, visibleTransfers);
    const hasMoreTransfers = allTransfers.length > visibleTransfers;

    return (
      <Accordion
        expanded={expanded === "transfers"}
        onChange={handleChange("transfers")}
        sx={styles.accordionStyles}
      >
        <AccordionSummary
          expandIcon={<ChevronDown color={theme.palette.text.primary} />}
        >
          <Car
            size={24}
            style={{ marginRight: 10, color: theme.palette.text.primary }}
          />
          <Typography variant="subtitle1" fontWeight="medium">
            Transfers ({allTransfers.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {displayTransfers.map((transfer, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={styles.paperStyles}>
                  <Train size={24} color={theme.palette.text.secondary} />
                  <Box flexGrow={1}>
                    <Typography variant="subtitle2">
                      {transfer.type.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {transfer.details.origin.display_address} to{" "}
                      {transfer.details.destination.display_address}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" color="primary">
                    ₹
                    {transfer.details.selectedQuote.fare.toLocaleString(
                      "en-IN"
                    )}
                  </Typography>
                </Paper>
              </Grid>
            ))}
            {hasMoreTransfers && (
              <Grid item xs={12}>
                <Button
                  variant="text"
                  fullWidth
                  sx={styles.buttonStyles}
                  onClick={() => setVisibleTransfers(allTransfers.length)}
                  endIcon={<ChevronDown />}
                >
                  View All {allTransfers.length} Transfers
                </Button>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderHotelsSummary = () => {
    const allHotels = itinerary.cities.flatMap((city) =>
      city.days.flatMap((day) => day.hotels || [])
    );

    const displayHotels = allHotels.slice(0, visibleHotels);
    const hasMoreHotels = allHotels.length > visibleHotels;

    return (
      <Accordion
        expanded={expanded === "hotels"}
        onChange={handleChange("hotels")}
        sx={styles.accordionStyles}
      >
        <AccordionSummary
          expandIcon={<ChevronDown color={theme.palette.text.primary} />}
        >
          <Hotel
            size={24}
            style={{ marginRight: 10, color: theme.palette.text.primary }}
          />
          <Typography variant="subtitle1" fontWeight="medium">
            Hotels ({allHotels.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {displayHotels.map((hotel, index) => (
              <Grid item xs={12} key={index}>
                <Paper sx={styles.paperStyles}>
                  <Hotel size={24} color={theme.palette.text.secondary} />
                  <Box flexGrow={1}>
                    <Typography variant="subtitle2">{hotel.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {hotel.address}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" color="primary">
                    ₹{hotel.rate.price.toLocaleString("en-IN")}
                  </Typography>
                </Paper>
              </Grid>
            ))}
            {hasMoreHotels && (
              <Grid item xs={12}>
                <Button
                  variant="text"
                  fullWidth
                  sx={styles.buttonStyles}
                  onClick={() => setVisibleHotels(allHotels.length)}
                  endIcon={<ChevronDown />}
                >
                  View All {allHotels.length} Hotels
                </Button>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.mode === 'light' 
        ? 'rgba(255,255,255,0.4)' 
        : 'rgba(66,66,66,0.4)',
      backdropFilter: 'blur(10px)',
      borderRadius: 2, 
      p: { xs: 2, sm: 3 },
      boxShadow: theme.shadows[2]
    }}>
      <Typography variant="h4" sx={styles.sectionTitle}>
        <Receipt size={32} />
        Booking Summary
      </Typography>

      {renderActivitiesSummary()}
      {renderFlightsSummary()}
      {renderTransfersSummary()}
      {renderHotelsSummary()}

      {/* Price Summary */}
      <Box sx={styles.priceSummary}>
        <Typography variant="h6" gutterBottom>
          Price Summary
        </Typography>

        {/* Individual totals */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" my={1}>
            <Typography variant="body2" color="text.secondary">
              Activities Total
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{itinerary.priceTotals?.activities?.toLocaleString("en-IN") || 0}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" my={1}>
            <Typography variant="body2" color="text.secondary">
              Hotels Total
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{itinerary.priceTotals?.hotels?.toLocaleString("en-IN") || 0}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" my={1}>
            <Typography variant="body2" color="text.secondary">
              Flights Total
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ₹{itinerary.priceTotals?.flights?.toLocaleString("en-IN") || 0}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" my={1}>
            <Typography variant="body2" color="text.secondary">
              Transfers Total
            </Typography>
            <Typography variant="body2" color="text.secondary">
            ₹{itinerary.priceTotals?.transfers?.toLocaleString("en-IN") || 0}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" my={1}>
          <Typography variant="body1">Subtotal</Typography>
          <Typography variant="body1">
            ₹{itinerary.priceTotals?.subtotal?.toLocaleString("en-IN") || 0}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" my={1}>
          <Typography variant="body2" color="text.secondary">
            TCS ({itinerary.priceTotals?.tcsRate || 0}%)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ₹{itinerary.priceTotals?.tcsAmount?.toLocaleString("en-IN") || 0}
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">Total</Typography>
          <Typography variant="h6" color="primary">
            ₹{itinerary.priceTotals?.grandTotal?.toLocaleString("en-IN") || 0}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default BookingSummary;