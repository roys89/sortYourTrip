import {
    Attractions as AttractionsIcon,
    CalendarMonth as CalendarIcon,
    DirectionsCar as CarIcon,
    KeyboardArrowDown as ChevronDownIcon,
    KeyboardArrowUp as ChevronUpIcon,
    Flight as FlightIcon,
    Restaurant as FoodIcon,
    Hotel as HotelIcon,
    LocationOn as MapPinIcon,
    Add as PlusIcon
} from "@mui/icons-material";
import { Button, Collapse, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { DateTime } from "luxon";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ActivityCard from "../Cards/ActivityCard";
import FlightCard from "../Cards/FlightCard";
import HotelCard from "../Cards/HotelCard";
import TransferCard from "../Cards/TransferCard";
import "./ItineraryDay.css";

// Helper function to render appropriate activity icons based on type
const getActivityIcon = (activityType, size = 24) => {
  switch (activityType?.toLowerCase()) {
    case "flight":
      return <FlightIcon sx={{ fontSize: size, color: "#FFFFFF" }} />;
    case "transfer":
    case "transport":
      return <CarIcon sx={{ fontSize: size, color: "#FFFFFF" }} />;
    case "hotel":
    case "accommodation":
      return <HotelIcon sx={{ fontSize: size, color: "#FFFFFF" }} />;
    case "food":
    case "restaurant":
    case "dining":
      return <FoodIcon sx={{ fontSize: size, color: "#FFFFFF" }} />;
    case "activity":
    case "attraction":
    case "sightseeing":
      return <AttractionsIcon sx={{ fontSize: size, color: "#FFFFFF" }} />;
    default:
      return <MapPinIcon sx={{ fontSize: size, color: "#FFFFFF" }} />;
  }
};

const ItineraryDay = ({
  day,
  city,
  inquiryToken,
  itineraryToken,
  travelersDetails,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const containerRef = useRef(null);
  const [expanded, setExpanded] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(0);

  // Extract city name and country name from the city prop
  const cityName = city?.city || 'Unknown City';
  const countryName = city?.country || 'Unknown Country'; // Get country name

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Update timeline height when content changes or when expanded state changes
  useEffect(() => {
    if (expanded && containerRef.current) {
      // Use a longer timeout to allow DOM to fully update after Collapse animation completes
      const timer = setTimeout(() => {
        setTimelineHeight(containerRef.current.clientHeight - 85);
      }, 300); // Match this to the Collapse transition time
      return () => clearTimeout(timer);
    }
  }, [expanded, day, day.flights, day.transfers, day.hotels, day.activities]);

  const formatDate = (dateString) => {
    return DateTime.fromISO(dateString)
      .toLocal()
      .toLocaleString(DateTime.DATE_FULL);
  };

  const handleAddActivity = () => {
    // Prepare state for the activities page (add flow)
    const navigationState = {
      city: cityName,
      country: countryName, // Pass country name
      date: day.date,
      inquiryToken,
      travelersDetails,
      isNewActivity: true, // Indicate this is for adding
      itineraryToken // Pass itineraryToken for potential back navigation or context
    };

    // Dispatch is likely not needed here if state is passed via navigation
    // dispatch(
    //   setChangeActivity({
    //     city: cityName,
    //     country: countryName,
    //     date: day.date,
    //     inquiryToken,
    //     travelersDetails,
    //     isNewActivity: true,
    //   })
    // );

    console.log("Navigating to /activities for ADD with state:", navigationState);
    navigate("/activities", { state: navigationState });
  };

  // Count items to show in the summary
  const itemCount =
    (day.flights?.length || 0) +
    (day.transfers?.length || 0) +
    (day.hotels?.length || 0) +
    (day.activities?.length || 0);

  return (
    <div className="itinerary-day" ref={containerRef}>
      {/* Main continuous timeline - positioned after calendar icon in the DOM but visually runs through it */}
      <div
        className="timeline-main"
        style={{
          backgroundColor:
            theme.palette.mode === "light"
              ? "rgba(0, 0, 0, 0.1)"
              : "rgba(255, 255, 255, 0.1)",
          // Calculate specific height instead of using bottom positioning
          top: "25px",
          height: expanded ? `${timelineHeight}px` : "0", // Dynamic height based on content
          bottom: "auto", // Remove bottom property
          opacity: timelineHeight > 0 ? 1 : 0, // Hide until properly sized
          transition: "height 0.3s ease, opacity 0.2s ease",
        }}
      ></div>

      {/* Day Header with Calendar Icon - Always visible */}
      <motion.div
        className="day-header"
        onClick={toggleExpanded}
        whileHover={{ backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.01)" }}
        style={{
          cursor: "pointer",
          backgroundColor: "transparent",
          borderRadius: "12px",
          padding: expanded ? "0 0 0 100px" : "12px 0 12px 100px",
          marginBottom: expanded ? "2rem" : "0",
          transition: "all 0.3s ease",
        }}
      >
        <div
          className="date-calendar-icon"
          style={{ backgroundColor: theme.palette.primary.main }}
        >
          <CalendarIcon sx={{ fontSize: 24, color: "white" }} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingRight: "1rem",
          }}
        >
          <Typography
            variant="h6"
            className="date-text"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {formatDate(day.date)}
          </Typography>

          <div style={{ display: "flex", alignItems: "center" }}>
            {!expanded && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  marginRight: "1rem",
                  fontWeight: 500,
                }}
              >
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Typography>
            )}

            {expanded ? (
              <ChevronUpIcon 
                sx={{ 
                  fontSize: 24, 
                  color: theme.palette.text.secondary,
                  transition: "transform 0.3s ease"
                }} 
              />
            ) : (
              <ChevronDownIcon 
                sx={{ 
                  fontSize: 24, 
                  color: theme.palette.text.secondary,
                  transition: "transform 0.3s ease"
                }} 
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Collapsible Content */}
      <Collapse in={expanded} timeout={300} onEntered={() => {
        if (containerRef.current) {
          setTimelineHeight(containerRef.current.clientHeight - 85);
        }
      }}>
        <div className="day-segments">
          {/* FLIGHTS */}
          {day.flights?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="day-segment"
            >
              {day.flights.map((flight, index) => (
                <div key={`flight-${index}`} className="timeline-container">
                  {index === 0 && (
                    <>
                      <div
                        className="timeline-icon"
                        style={{ backgroundColor: theme.palette.navbar.light }}
                      >
                        <FlightIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
                      </div>
                    </>
                  )}
                  <FlightCard
                    flight={flight}
                    inquiryToken={inquiryToken}
                    itineraryToken={itineraryToken}
                    travelersDetails={travelersDetails}
                    showChange={true}
                    showTimelineIcon={false}
                    showRemove={true}
                    city={cityName}
                    date={day.date}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* TRANSFERS */}
          {day.transfers?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="day-segment"
            >
              {day.transfers.map((transfer, index) => (
                <div key={`transfer-${index}`} className="timeline-container">
                  {/* Always show the timeline icon for each transfer */}
                  <div
                    className="timeline-icon"
                    style={{ backgroundColor: theme.palette.navbar.light }}
                  >
                    <CarIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
                  </div>
                  <TransferCard 
                    transfer={transfer} 
                    showTimelineIcon={false} 
                    showRemove={true}
                    itineraryToken={itineraryToken}
                    inquiryToken={inquiryToken}
                    city={cityName}
                    date={day.date}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* HOTELS */}
          {day.hotels?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="day-segment"
            >
              {day.hotels.map((hotel, index) => (
                <div key={`hotel-${index}`} className="timeline-container">
                  {/* Always show the timeline icon for each hotel */}
                  <div
                    className="timeline-icon"
                    style={{ backgroundColor: theme.palette.navbar.light }}
                  >
                    <HotelIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
                  </div>
                  <HotelCard
                    hotel={hotel}
                    city={cityName}
                    date={day.date}
                    inquiryToken={inquiryToken}
                    itineraryToken={itineraryToken}
                    travelersDetails={travelersDetails}
                    showChange={true}
                    showTimelineIcon={false}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* ACTIVITIES */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="day-segment"
          >
            {day.activities?.length > 0 ? (
              <div className="multiple-activities">
                {day.activities.map((activity, index) => (
                  <div key={`activity-${index}`} className="timeline-container">
                    {/* Show activity-specific icon based on type */}
                    <div
                      className="timeline-icon"
                      style={{ backgroundColor: theme.palette.navbar.light }}
                    >
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <ActivityCard
                      activity={activity}
                      city={cityName}
                      country={countryName}
                      date={day.date}
                      inquiryToken={inquiryToken}
                      itineraryToken={itineraryToken}
                      travelersDetails={travelersDetails}
                      showRemove={true}
                      showTimelineIcon={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="timeline-container">
                <div
                  className="timeline-icon"
                  style={{ backgroundColor: theme.palette.navbar.light }}
                >
                  <AttractionsIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
                </div>

                <div
                  className="no-activities"
                  style={{
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "rgba(9, 57, 35, 0.05)"
                        : "rgba(42, 157, 143, 0.05)",
                  }}
                >
                  <Typography
                    variant="body1"
                    className="no-items-text"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    No activities planned for this day.
                  </Typography>
                </div>
              </div>
            )}

            {(!day.activities || day.activities.length < 3) && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="add-activity-container"
              >
                <Button
                  variant="outlined"
                  startIcon={
                    <PlusIcon
                      sx={{ 
                        fontSize: 18,
                        color: theme.palette.primary.main,
                        transition: "transform 0.2s ease"
                      }}
                    />
                  }
                  onClick={handleAddActivity}
                  className="add-activity-button"
                  sx={{
                    color: theme.palette.text.primary,
                    borderColor: `${theme.palette.primary.main}60`,
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: `${theme.palette.primary.main}10`,
                      "& .MuiSvgIcon-root": { transform: "rotate(90deg)" }
                    },
                  }}
                >
                  Add Experience ({3 - (day.activities?.length || 0)} remaining)
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Timeline end indicator */}
          <div
            className="timeline-end"
            style={{ backgroundColor: theme.palette.primary.main }}
          ></div>
        </div>
      </Collapse>
    </div>
  );
};

export default ItineraryDay;