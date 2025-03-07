import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Fade,
  Grid,
  Grow,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme
} from "@mui/material";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Cake,
  Check,
  ChevronLeft,
  Hotel,
  Mail,
  MessageSquare,
  Phone,
  Plane,
  RefreshCw,
  User,
  UserCheck,
  X
} from "lucide-react";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  searchReplacementFlight,
  updateItineraryFlight,
} from "../../redux/slices/flightReplacementSlice";
import {
  allocateFlightPassengers,
  allocateHotelRooms,
} from "../../redux/slices/guestAllocationSlice";
import {
  searchReplacementHotel,
  updateItineraryHotel,
} from "../../redux/slices/hotelReplacementSlice";

// Helper function to get remaining error message
const getRemainingErrorMessage = (failedAllocations) => {
  const failedFlights = failedAllocations.filter((f) => f.type === "flight");
  const failedHotels = failedAllocations.filter((f) => f.type === "hotel");

  if (failedFlights.length > 0 && failedHotels.length > 0) {
    return "Please replace remaining flights and hotels before proceeding";
  } else if (failedFlights.length > 0) {
    return "Please replace remaining flights before proceeding";
  } else if (failedHotels.length > 0) {
    return "Please replace remaining hotels before proceeding";
  }
  return null;
};

// Allocation Progress Component
const AllocationProgress = ({ progress, currentItem }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        borderRadius: "12px",
        background: alpha(theme.palette.primary.main, 0.05),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <CircularProgress 
          size={24} 
          thickness={4}
          sx={{ color: theme.palette.primary.main }} 
        />
        <Typography variant="h6" sx={{ fontFamily: "Montserrat", fontWeight: 500 }}>
          Allocating Rooms and Flights
        </Typography>
      </Box>
      
      {progress.total > 0 && (
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2, 
            mb: 2,
            p: 2,
            borderRadius: "8px",
            background: theme.palette.background.paper,
          }}
        >
          <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
            <CircularProgress 
              variant="determinate" 
              value={(progress.current / progress.total) * 100}
              size={40}
              thickness={4}
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                position: "absolute", 
                left: "50%", 
                top: "50%", 
                transform: "translate(-50%, -50%)",
                fontWeight: 600
              }}
            >
              {Math.round((progress.current / progress.total) * 100)}%
            </Typography>
          </Box>
          <Typography>
            <strong>{progress.current}</strong> of <strong>{progress.total}</strong> items processed
          </Typography>
        </Box>
      )}

      {currentItem && (
        <Grow in={!!currentItem}>
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1.5,
              p: 2,
              borderRadius: "8px",
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              background: theme.palette.background.paper,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
              transition: "all 0.2s ease"
            }}
          >
            {currentItem.type === "flight" ? (
              <Plane 
                size={20} 
                style={{ 
                  color: theme.palette.primary.main,
                  animation: "pulse 2s infinite ease-in-out",
                  "@keyframes pulse": {
                    "0%": { opacity: 0.6 },
                    "50%": { opacity: 1 },
                    "100%": { opacity: 0.6 }
                  }
                }} 
              />
            ) : (
              <Hotel 
                size={20} 
                style={{ 
                  color: theme.palette.primary.main,
                  animation: "pulse 2s infinite ease-in-out" 
                }} 
              />
            )}
            <Typography variant="body1" fontWeight={500}>
              {currentItem.status ||
                (currentItem.type === "flight"
                  ? `Allocating flight: ${currentItem.origin} → ${currentItem.destination}`
                  : `Allocating hotel: ${currentItem.name}`)}
            </Typography>
          </Box>
        </Grow>
      )}
    </Paper>
  );
};

// Hotel Replacement Handler Component
const HotelReplacementHandler = ({
  failedHotel,
  handleHotelReplacement,
  isAllocating,
}) => {
  const [isReplacingThis, setIsReplacingThis] = useState(false);
  const theme = useTheme();

  const handleReplace = async () => {
    setIsReplacingThis(true);
    await handleHotelReplacement(failedHotel);
    setIsReplacingThis(false);
  };

  return (
    <Box 
      sx={{
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start",
        p: 2,
        borderRadius: "10px",
        background: alpha(theme.palette.warning.light, 0.1),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.05)}`,
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Hotel size={20} style={{ color: theme.palette.warning.main, marginTop: "4px" }} />
        <div>
          <Typography variant="body1" fontWeight={500}>
            {failedHotel.details?.hotelDetails?.name ||
              failedHotel.details?.name ||
              failedHotel.name ||
              "Unknown Hotel"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {failedHotel.error?.message || "No specific error message"}
          </Typography>
        </div>
      </Box>
      <Button
        size="small"
        variant="outlined"
        onClick={handleReplace}
        startIcon={
          isReplacingThis ? (
            <CircularProgress size={16} />
          ) : (
            <RefreshCw size={16} />
          )
        }
        disabled={isAllocating || isReplacingThis}
        sx={{ 
          ml: 2,
          borderRadius: "8px",
          borderColor: theme.palette.warning.main,
          color: theme.palette.warning.main,
          "&:hover": {
            borderColor: theme.palette.warning.dark,
            backgroundColor: alpha(theme.palette.warning.main, 0.05),
          }
        }}
      >
        {isReplacingThis ? "Replacing..." : "Replace Hotel"}
      </Button>
    </Box>
  );
};

// Failed Allocations Component
const FailedAllocationsSection = ({
  failedAllocations,
  handleFlightReplacement,
  handleHotelReplacement,
  itinerary,
  tokens,
  isAllocating,
}) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        borderRadius: "12px",
        background: alpha(theme.palette.warning.light, 0.1),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <AlertTriangle size={24} style={{ color: theme.palette.warning.main }} />
        <Typography variant="h6" sx={{ fontFamily: "Montserrat", fontWeight: 500, color: theme.palette.warning.dark }}>
          {getRemainingErrorMessage(failedAllocations)}
        </Typography>
      </Box>
      
      <Stack spacing={2}>
        {failedAllocations.map((fail, idx) => (
          <Fade in key={idx} timeout={300} style={{ transitionDelay: `${idx * 100}ms` }}>
            <Box>
              {fail.type === "flight" && (
                <Box
                  sx={{
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    p: 2,
                    borderRadius: "10px",
                    background: alpha(theme.palette.warning.light, 0.1),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Plane size={20} style={{ color: theme.palette.warning.main, marginTop: "4px" }} />
                    <div>
                      <Typography variant="body1" fontWeight={500}>
                        {fail.details.origin} → {fail.details.destination}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {fail.error.message}
                      </Typography>
                    </div>
                  </Box>
                  {(fail.error.errorCode === "6" || fail.error) && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleFlightReplacement(fail)}
                      startIcon={
                        isAllocating ? (
                          <CircularProgress size={16} />
                        ) : (
                          <RefreshCw size={16} />
                        )
                      }
                      disabled={isAllocating}
                      sx={{ 
                        ml: 2,
                        borderRadius: "8px",
                        borderColor: theme.palette.warning.main,
                        color: theme.palette.warning.main,
                        "&:hover": {
                          borderColor: theme.palette.warning.dark,
                          backgroundColor: alpha(theme.palette.warning.main, 0.05),
                        }
                      }}
                    >
                      {isAllocating ? "Replacing..." : "Replace Flight"}
                    </Button>
                  )}
                </Box>
              )}
              {fail.type === "hotel" && (
                <HotelReplacementHandler
                  failedHotel={fail}
                  handleHotelReplacement={handleHotelReplacement}
                  isAllocating={isAllocating}
                />
              )}
            </Box>
          </Fade>
        ))}
      </Stack>
    </Paper>
  );
};

// Room Information Component
const RoomInfo = ({ room }) => {
  const theme = useTheme();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ marginBottom: "24px" }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "12px",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.04)}`,
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }
        }}
      >
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 1.5, 
          mb: 2,
          pb: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}>
          <Box 
            sx={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Hotel size={20} style={{ color: theme.palette.primary.main }} />
          </Box>
          <Typography variant="h6" sx={{ fontFamily: "Montserrat", fontWeight: 600 }}>
            Room {room.roomNumber}
          </Typography>
        </Box>
        
        <Stack spacing={2}>
          {room.travelers.map((traveler, idx) => (
            <TravelerInfo key={idx} traveler={traveler} index={idx} />
          ))}
        </Stack>
      </Paper>
    </motion.div>
  );
};

// Traveler Information Component
const TravelerInfo = ({ traveler, index }) => {
  const theme = useTheme();
  
  return (
    <Fade in timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "10px",
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
          borderLeft: `4px solid ${
            traveler.type === "adult" 
              ? alpha(theme.palette.primary.main, 0.8) 
              : alpha(theme.palette.secondary.main, 0.8)
          }`,
          transition: "all 0.2s ease",
        }}
      >
        <Box sx={{ mb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box 
              sx={{ 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: traveler.type === "adult" 
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.secondary.main, 0.1),
              }}
            >
              <User 
                size={16} 
                style={{ 
                  color: traveler.type === "adult" 
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main
                }} 
              />
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                color: traveler.type === "adult" 
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
              }}
            >
              {traveler.type === "adult" ? "Adult" : "Child"} {index + 1}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              px: 1.5,
              py: 0.5,
              borderRadius: "20px",
              backgroundColor: traveler.type === "adult" 
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.secondary.main, 0.1),
              color: traveler.type === "adult" 
                ? theme.palette.primary.main
                : theme.palette.secondary.main,
              fontWeight: 500,
            }}
          >
            {traveler.gender.charAt(0).toUpperCase() + traveler.gender.slice(1)}
          </Typography>
        </Box>
        
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={6}>
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <User size={16} style={{ color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">Full Name</Typography>
              </Box>
              <Typography variant="body1" sx={{ pl: 3.5, fontWeight: 500 }}>
                {traveler.title} {traveler.firstName} {traveler.lastName}
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Cake size={16} style={{ color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
              </Box>
              <Typography variant="body1" sx={{ pl: 3.5, fontWeight: 500 }}>
                {new Date(traveler.dateOfBirth).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={6}>
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Mail size={16} style={{ color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">Email</Typography>
              </Box>
              <Typography variant="body1" sx={{ pl: 3.5, fontWeight: 500 }}>
                {traveler.email}
              </Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Phone size={16} style={{ color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">Phone</Typography>
              </Box>
              <Typography variant="body1" sx={{ pl: 3.5, fontWeight: 500 }}>
                +{traveler.cellCountryCode} {traveler.phone}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Fade>
  );
};

// Main ReviewBookingModal Component
const ReviewBookingModal = ({
  open,
  onClose,
  formData,
  itinerary,
  tokens,
  onAllocationComplete,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationProgress, setAllocationProgress] = useState({
    current: 0,
    total: 0,
  });
  const [currentAllocation, setCurrentAllocation] = useState(null);
  const [error, setError] = useState(null);
  const [failedAllocations, setFailedAllocations] = useState([]);
  const [allocationComplete, setAllocationComplete] = useState(false);
  const [successfulAllocations, setSuccessfulAllocations] = useState({
    flights: [],
    hotels: [],
  });

  const handleFlightReplacement = async (failedFlight) => {
    try {
      setError(null);
      setIsAllocating(true);
      setAllocationProgress({
        current: 0,
        total: 0,
      });

      setCurrentAllocation({
        type: "flight",
        origin: failedFlight.details.origin,
        destination: failedFlight.details.destination,
        status: "Searching for replacement flight...",
      });

      const searchResult = await dispatch(
        searchReplacementFlight({
          expiredFlight: failedFlight.details,
          itinerary,
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      if (!Array.isArray(searchResult) || searchResult.length === 0) {
        throw new Error("No replacement flights found");
      }

      setCurrentAllocation((prev) => ({
        ...prev,
        status: "Updating itinerary with new flight...",
      }));

      const cityName =
        failedFlight.details.type === "return_flight"
          ? failedFlight.details.origin
          : failedFlight.details.destination;

      const result = await dispatch(
        updateItineraryFlight({
          itineraryToken: tokens.itinerary,
          cityName,
          date: failedFlight.details.departureDate,
          newFlightDetails: searchResult[0],
          type: failedFlight.details.type || "departure_flight",
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      if (result.success) {
        const updatedFailedAllocations = failedAllocations.filter(
          (f) =>
            f.type !== "flight" ||
            f.details.flightCode !== failedFlight.details.flightCode
        );

        setFailedAllocations(updatedFailedAllocations);

        const remainingFailedFlights = updatedFailedAllocations.filter(
          (f) => f.type === "flight"
        );

        if (remainingFailedFlights.length === 0) {
          setError(
            "Please go back to itinerary to view updated flights and select seats if needed"
          );
          setAllocationComplete(false);
        }
      } else {
        throw new Error("Failed to update itinerary with new flight");
      }
    } catch (error) {
      console.error("Error replacing flight:", error);
      setError(error.message || "Failed to replace flight. Please try again.");
    } finally {
      setIsAllocating(false);
      setCurrentAllocation(null);
    }
  };

  const handleHotelReplacement = async (failedHotel) => {
    try {
      setError(null);

      // Store the ID of the hotel we're replacing
      const hotelToReplaceId =
        failedHotel.details?.data?.staticContent?.[0]?.id;

      setCurrentAllocation({
        type: "hotel",
        name: failedHotel.details?.hotelDetails?.name || "Unknown Hotel",
        status: "Searching for replacement hotel...",
      });

      const hotelData = failedHotel.details?.data || failedHotel.details;

      const searchResult = await dispatch(
        searchReplacementHotel({
          failedHotel,
          itinerary,
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      setCurrentAllocation((prev) => ({
        ...prev,
        status: "Updating itinerary with new hotel...",
      }));

      const result = await dispatch(
        updateItineraryHotel({
          itineraryToken: tokens.itinerary,
          date: hotelData.checkIn || hotelData.searchRequestLog.checkIn,
          newHotelDetails: searchResult.data,
          checkIn: hotelData.checkIn || hotelData.searchRequestLog.checkIn,
          checkout: hotelData.checkOut || hotelData.searchRequestLog.checkOut,
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      if (result.success) {
        // Only remove the specific hotel we just replaced
        const updatedFailedAllocations = failedAllocations.filter((f) => {
          if (f.type !== "hotel") return true;

          const currentHotelId = f.details?.data?.staticContent?.[0]?.id;
          return currentHotelId !== hotelToReplaceId;
        });

        setFailedAllocations(updatedFailedAllocations);

        const remainingFailedHotels = updatedFailedAllocations.filter(
          (f) => f.type === "hotel"
        );

        if (remainingFailedHotels.length === 0) {
          setError(
            "Please go back to itinerary to view updated hotels and select rooms if needed"
          );
          setAllocationComplete(false);
        }
      }
    } catch (error) {
      console.error("Error replacing hotel:", error);
      setError(error.message || "Failed to replace hotel. Please try again.");
    } finally {
      setCurrentAllocation(null);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsAllocating(true);
      setError(null);
      setFailedAllocations([]);
      setSuccessfulAllocations({ flights: [], hotels: [] });

      const totalAllocations = itinerary.cities.reduce((total, city) => {
        return city.days.reduce((dayTotal, day) => {
          return (
            dayTotal + (day.flights?.length || 0) + (day.hotels?.length || 0)
          );
        }, total);
      }, 0);

      setAllocationProgress({ current: 0, total: totalAllocations });

      for (const city of itinerary.cities) {
        for (const day of city.days) {
          // Handle flights
          if (day.flights?.length) {
            for (const flight of day.flights) {
              try {
                setCurrentAllocation({
                  type: "flight",
                  origin: flight.flightData.origin,
                  destination: flight.flightData.destination,
                });

                const result = await dispatch(
                  allocateFlightPassengers({
                    bookingId: formData.bookingId,
                    itineraryToken: tokens.itinerary,
                    inquiryToken: tokens.inquiry,
                    itinerary,
                    flight,
                    formData,
                  })
                ).unwrap();

                setSuccessfulAllocations((prev) => ({
                  ...prev,
                  flights: [...prev.flights, { flight, result }],
                }));

                setAllocationProgress((prev) => ({
                  ...prev,
                  current: prev.current + 1,
                }));
              } catch (error) {
                setFailedAllocations((prev) => [
                  ...prev,
                  {
                    type: "flight",
                    details: flight.flightData,
                    error: error.response?.data || error,
                  },
                ]);
              }
            }
          }

          // Handle hotels
          if (day.hotels?.length) {
            for (const hotel of day.hotels) {
              try {
                setCurrentAllocation({
                  type: "hotel",
                  name: hotel.data.staticContent[0].name,
                });

                const result = await dispatch(
                  allocateHotelRooms({
                    bookingId: formData.bookingId,
                    itineraryToken: tokens.itinerary,
                    inquiryToken: tokens.inquiry,
                    itinerary,
                    hotel,
                    formData,
                  })
                ).unwrap();

                setSuccessfulAllocations((prev) => ({
                  ...prev,
                  hotels: [...prev.hotels, { hotel, result }],
                }));

                setAllocationProgress((prev) => ({
                  ...prev,
                  current: prev.current + 1,
                }));
              } catch (error) {
                setFailedAllocations((prev) => [
                  ...prev,
                  {
                    type: "hotel",
                    details: {
                      data: hotel.data, // Store with matching structure
                    },
                    error: error.response?.data || error,
                  },
                ]);
              }
            }
          }
        }
      }

      if (failedAllocations.length === 0) {
        setAllocationComplete(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsAllocating(false);
      setCurrentAllocation(null);
    }
  };

  const handleProceed = () => {
    const allFlights = itinerary.cities.flatMap((city) =>
      city.days.flatMap((day) => day.flights || [])
    );
    const allHotels = itinerary.cities.flatMap((city) =>
      city.days.flatMap((day) => day.hotels || [])
    );

    const allFlightsAllocated =
      allFlights.length === successfulAllocations.flights.length;
    const allHotelsAllocated =
      allHotels.length === successfulAllocations.hotels.length;

    if (
      allFlightsAllocated &&
      allHotelsAllocated &&
      failedAllocations.length === 0
    ) {
      onAllocationComplete();
    } else {
      setError(getRemainingErrorMessage(failedAllocations));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isAllocating ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          px: 3,
          py: 2,
          backgroundColor: theme.palette.mode === "dark" 
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.light, 0.05),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 42,
              height: 42,
              borderRadius: "12px",
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <UserCheck size={22} style={{ color: theme.palette.primary.main }} />
          </Box>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: "Montserrat", 
                fontWeight: 600, 
                color: theme.palette.text.primary,
              }}
            >
              Review Your Booking
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: alpha(theme.palette.text.primary, 0.7),
                mt: 0.5,
              }}
            >
              Please confirm traveler details before proceeding
            </Typography>
          </Box>
        </Box>
        
        {!isAllocating && (
          <IconButton 
            onClick={onClose} 
            sx={{
              color: theme.palette.text.secondary,
              width: 36,
              height: 36,
              backgroundColor: alpha(theme.palette.divider, 0.1),
              "&:hover": {
                backgroundColor: alpha(theme.palette.divider, 0.2),
              },
              transition: "all 0.2s ease",
            }}
          >
            <X size={18} />
          </IconButton>
        )}
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {isAllocating && (
          <AllocationProgress
            progress={allocationProgress}
            currentItem={currentAllocation}
          />
        )}

        {error && !error.includes("go back to itinerary") && (
          <Paper 
            elevation={0}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: "12px",
              background: alpha(theme.palette.error.light, 0.05),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                }}
              >
                <AlertTriangle size={20} style={{ color: theme.palette.error.main }} />
              </Box>
              <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                Error During Allocation
              </Typography>
            </Box>
            <Typography sx={{ ml: 6 }}>{error}</Typography>
          </Paper>
        )}

        {failedAllocations.length > 0 && (
          <FailedAllocationsSection
            failedAllocations={failedAllocations}
            handleFlightReplacement={handleFlightReplacement}
            handleHotelReplacement={handleHotelReplacement}
            itinerary={itinerary}
            tokens={tokens}
            isAllocating={isAllocating}
          />
        )}

        {allocationComplete &&
          failedAllocations.length === 0 &&
          !error?.includes("go back to itinerary") && (
            <Paper 
              elevation={0}
              sx={{
                mb: 3,
                p: 3,
                borderRadius: "12px",
                background: alpha(theme.palette.success.light, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  <Check size={20} style={{ color: theme.palette.success.main }} />
                </Box>
                <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  Allocation Complete
                </Typography>
              </Box>
              <Typography sx={{ ml: 6 }}>
                All rooms and flights have been successfully allocated.
              </Typography>
            </Paper>
          )}

        {/* Room & Traveler Details */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <UserCheck size={18} style={{ color: theme.palette.primary.main }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: "Montserrat", 
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Traveler Details
            </Typography>
          </Box>
          
          {formData.rooms.map((room, index) => (
            <RoomInfo key={index} room={room} />
          ))}
        </Box>

        {/* Special Requirements */}
        {formData.specialRequirements && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <MessageSquare size={18} style={{ color: theme.palette.primary.main }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: "Montserrat", 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Special Requirements
              </Typography>
            </Box>
            
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "10px",
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              }}
            >
              <Typography>{formData.specialRequirements}</Typography>
            </Paper>
          </Box>
        )}

        <Divider sx={{ my: 3, opacity: 0.6 }} />
        
        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isAllocating}
            startIcon={<X size={18} />}
            sx={{
              borderColor: alpha(theme.palette.error.main, 0.5),
              color: theme.palette.error.main,
              borderRadius: "10px",
              py: 1.2,
              px: 3,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: theme.palette.error.main,
                backgroundColor: alpha(theme.palette.error.main, 0.05),
                transform: "translateY(-2px)",
              },
            }}
          >
            Cancel
          </Button>

          <Box sx={{ display: "flex", gap: 2 }}>
            {failedAllocations.length === 0 &&
              error?.includes("go back to itinerary") && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    alignItems: "center",
                    maxWidth: "500px",
                  }}
                >
                  <Paper 
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      background: alpha(theme.palette.success.light, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5
                    }}
                  >
                    <Check size={20} style={{ color: theme.palette.success.main }} />
                    <Typography>
                      All replacements complete! Return to view updated details.
                    </Typography>
                  </Paper>
                  
                  <Button
                    variant="contained"
                    onClick={() => {
                      navigate("/itinerary", {
                        state: {
                          itineraryToken: tokens.itinerary,
                          itineraryInquiryToken: tokens.inquiry,
                        },
                      });
                    }}
                    startIcon={<ChevronLeft size={18} />}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: "#fff",
                      borderRadius: "10px",
                      py: 1.2,
                      px: 3,
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                      boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.dark,
                        transform: "translateY(-2px)",
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      }
                    }}
                  >
                    Go Back to Itinerary
                  </Button>
                </Box>
              )}

            {!error?.includes("go back to itinerary") &&
              (!allocationComplete ? (
                <Button
                  variant="contained"
                  onClick={handleConfirm}
                  disabled={isAllocating}
                  startIcon={
                    isAllocating ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Check size={18} />
                    )
                  }
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: "#fff",
                    borderRadius: "10px",
                    py: 1.2,
                    px: 3,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.dark,
                      transform: "translateY(-2px)",
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    }
                  }}
                >
                  {isAllocating ? "Allocating..." : "Start Allocation"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleProceed}
                  disabled={failedAllocations.length > 0}
                  endIcon={<ArrowRight size={18} />}
                  sx={{
                    backgroundColor: theme.palette.success.main,
                    color: "#fff",
                    borderRadius: "10px",
                    py: 1.2,
                    px: 3,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.3)}`,
                    "&:hover": {
                      backgroundColor: theme.palette.success.dark,
                      transform: "translateY(-2px)",
                      boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`,
                    }
                  }}
                >
                  Proceed to Price Check
                </Button>
              ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewBookingModal;