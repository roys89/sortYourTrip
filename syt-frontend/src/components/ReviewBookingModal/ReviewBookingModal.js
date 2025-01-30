import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import {
  AlertTriangle,
  Check,
  Hotel,
  Plane,
  RefreshCw,
  UserCheck,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { allocateFlightPassengers, allocateHotelRooms } from '../../redux/slices/guestAllocationSlice';

// Allocation Progress Component
const AllocationProgress = ({ progress, currentItem }) => (
  <Alert severity="info" sx={{ mb: 3 }}>
    <AlertTitle>Allocating Rooms and Flights</AlertTitle>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <CircularProgress size={20} />
      <Typography>
        Progress: {progress.current} of {progress.total} items
      </Typography>
    </Box>
    
    {currentItem && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {currentItem.type === 'flight' ? (
          <>
            <Plane size={16} />
            <Typography variant="body2">
              Allocating flight: {currentItem.origin} → {currentItem.destination}
            </Typography>
          </>
        ) : (
          <>
            <Hotel size={16} />
            <Typography variant="body2">
              Allocating hotel: {currentItem.name}
            </Typography>
          </>
        )}
      </Box>
    )}
  </Alert>
);

// Traveler Information Component
const TravelerInfo = ({ traveler }) => (
  <Box className="p-4 bg-gray-50 rounded mb-4">
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Personal Details</Typography>
        <Typography>Name: {traveler.title} {traveler.firstName} {traveler.lastName}</Typography>
        <Typography>Gender: {traveler.gender}</Typography>
        <Typography>Date of Birth: {traveler.dateOfBirth}</Typography>
        <Typography>Type: {traveler.type}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Contact Details</Typography>
        <Typography>Email: {traveler.email}</Typography>
        <Typography>Phone: +{traveler.cellCountryCode} {traveler.phone}</Typography>
      </Grid>
    </Grid>
  </Box>
);

// Room Information Component
const RoomInfo = ({ room }) => (
  <Box className="mb-6">
    <Box className="flex items-center gap-2 mb-3">
      <Hotel size={24} />
      <Typography variant="h6">Room {room.roomNumber}</Typography>
    </Box>
    {room.travelers.map((traveler, idx) => (
      <TravelerInfo key={idx} traveler={traveler} />
    ))}
  </Box>
);

const ReviewBookingModal = ({ 
  open, 
  onClose, 
  formData,
  itinerary,
  tokens,
  onAllocationComplete 
}) => {
  const dispatch = useDispatch();
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationProgress, setAllocationProgress] = useState({
    current: 0,
    total: 0
  });
  const [currentAllocation, setCurrentAllocation] = useState(null);
  const [error, setError] = useState(null);
  const [failedAllocations, setFailedAllocations] = useState([]);
  const [allocationComplete, setAllocationComplete] = useState(false);
  const [successfulAllocations, setSuccessfulAllocations] = useState({
    flights: [],
    hotels: []
  });

  // Function to handle retrying specific failed allocations
  const handleRetryFailed = async () => {
    try {
      setIsAllocating(true);
      setError(null);
      
      // Create a lookup for failed items
      const failedLookup = failedAllocations.reduce((acc, fail) => {
        const key = fail.type === 'flight' 
          ? `flight-${fail.details.flightCode}` 
          : `hotel-${fail.details.id}`;
        acc[key] = true;
        return acc;
      }, {});

      // Find matching items in itinerary for failed allocations
      for (const city of itinerary.cities) {
        for (const day of city.days) {
          // Retry failed flights
          if (day.flights?.length) {
            for (const flight of day.flights) {
              const flightKey = `flight-${flight.flightData.flightCode}`;
              if (failedLookup[flightKey]) {
                setCurrentAllocation({
                  type: 'flight',
                  origin: flight.flightData.origin,
                  destination: flight.flightData.destination
                });

                try {
                  const result = await dispatch(allocateFlightPassengers({
                    bookingId: formData.bookingId,
                    itineraryToken: tokens.itinerary,
                    inquiryToken: tokens.inquiry,
                    itinerary,
                    flight,
                    formData
                  })).unwrap();

                  setSuccessfulAllocations(prev => ({
                    ...prev,
                    flights: [...prev.flights, { flight, result }]
                  }));

                  // Remove from failed allocations
                  setFailedAllocations(prev => 
                    prev.filter(f => f.type !== 'flight' || f.details.flightCode !== flight.flightData.flightCode)
                  );
                } catch (error) {
                  console.error('Failed to retry flight allocation:', error);
                }
              }
            }
          }

          // Retry failed hotels
          if (day.hotels?.length) {
            for (const hotel of day.hotels) {
              const hotelKey = `hotel-${hotel.data.staticContent[0].id}`;
              if (failedLookup[hotelKey]) {
                setCurrentAllocation({
                  type: 'hotel',
                  name: hotel.data.staticContent[0].name
                });

                try {
                  const result = await dispatch(allocateHotelRooms({
                    bookingId: formData.bookingId,
                    itineraryToken: tokens.itinerary,
                    inquiryToken: tokens.inquiry,
                    itinerary,
                    hotel,
                    formData
                  })).unwrap();

                  setSuccessfulAllocations(prev => ({
                    ...prev,
                    hotels: [...prev.hotels, { hotel, result }]
                  }));

                  // Remove from failed allocations
                  setFailedAllocations(prev => 
                    prev.filter(f => f.type !== 'hotel' || f.details.id !== hotel.data.staticContent[0].id)
                  );
                } catch (error) {
                  console.error('Failed to retry hotel allocation:', error);
                }
              }
            }
          }
        }
      }

      // Check if all retries were successful
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

  // Function to retry all allocations
  const handleRetryAll = () => {
    setFailedAllocations([]);
    setAllocationComplete(false);
    setSuccessfulAllocations({ flights: [], hotels: [] });
    handleConfirm();
  };

  const handleConfirm = async () => {
    try {
      setIsAllocating(true);
      setError(null);
      setFailedAllocations([]);
      setSuccessfulAllocations({ flights: [], hotels: [] });

      // Calculate total allocations
      const totalAllocations = itinerary.cities.reduce((total, city) => {
        return city.days.reduce((dayTotal, day) => {
          return dayTotal + (day.flights?.length || 0) + (day.hotels?.length || 0);
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
                  type: 'flight',
                  origin: flight.flightData.origin,
                  destination: flight.flightData.destination
                });

                const result = await dispatch(allocateFlightPassengers({
                  bookingId: formData.bookingId,
                  itineraryToken: tokens.itinerary,
                  inquiryToken: tokens.inquiry,
                  itinerary,
                  flight,
                  formData
                })).unwrap();

                setSuccessfulAllocations(prev => ({
                  ...prev,
                  flights: [...prev.flights, { flight, result }]
                }));

                setAllocationProgress(prev => ({
                  ...prev,
                  current: prev.current + 1
                }));
              } catch (error) {
                setFailedAllocations(prev => [...prev, {
                  type: 'flight',
                  details: flight.flightData,
                  error: error.message
                }]);
              }
            }
          }

          // Handle hotels
          if (day.hotels?.length) {
            for (const hotel of day.hotels) {
              try {
                setCurrentAllocation({
                  type: 'hotel',
                  name: hotel.data.staticContent[0].name
                });

                const result = await dispatch(allocateHotelRooms({
                  bookingId: formData.bookingId,
                  itineraryToken: tokens.itinerary,
                  inquiryToken: tokens.inquiry,
                  itinerary,
                  hotel,
                  formData
                })).unwrap();

                setSuccessfulAllocations(prev => ({
                  ...prev,
                  hotels: [...prev.hotels, { hotel, result }]
                }));

                setAllocationProgress(prev => ({
                  ...prev,
                  current: prev.current + 1
                }));
              } catch (error) {
                setFailedAllocations(prev => [...prev, {
                  type: 'hotel',
                  details: hotel.data.staticContent[0],
                  error: error.message
                }]);
              }
            }
          }
        }
      }

      // Set allocation complete even if there are failures
      setAllocationComplete(true);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsAllocating(false);
      setCurrentAllocation(null);
    }
  };

  const handleProceed = () => {
    // Check if all required allocations are successful
    const allFlights = itinerary.cities.flatMap(city => 
      city.days.flatMap(day => day.flights || [])
    );
    const allHotels = itinerary.cities.flatMap(city => 
      city.days.flatMap(day => day.hotels || [])
    );

    const allFlightsAllocated = allFlights.length === successfulAllocations.flights.length;
    const allHotelsAllocated = allHotels.length === successfulAllocations.hotels.length;

    if (allFlightsAllocated && allHotelsAllocated && failedAllocations.length === 0) {
      onAllocationComplete();
    } else {
      setError('Some allocations are still pending or failed. Please retry failed allocations.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={!isAllocating ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserCheck size={24} />
            <Typography variant="h6">Review Your Booking Details</Typography>
          </Box>
          {!isAllocating && (
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Allocation Progress */}
        {isAllocating && (
          <AllocationProgress 
            progress={allocationProgress}
            currentItem={currentAllocation}
          />
        )}

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRetryAll}
                startIcon={<RefreshCw size={16} />}
              >
                Retry All
              </Button>
            }
          >
            <AlertTitle>Error During Allocation</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Failed Allocations */}
        {failedAllocations.length > 0 && (
          <Alert 
            severity="warning" 
            icon={<AlertTriangle />}
            sx={{ mb: 3 }}
          >
            <AlertTitle>Failed Allocations</AlertTitle>
            <Stack spacing={1}>
              {failedAllocations.map((fail, idx) => (
                <Box key={idx}>
                  <Typography variant="body2" gutterBottom>
                    • {fail.type === 'flight' ? 'Flight' : 'Hotel'}: {
                      fail.type === 'flight' 
                        ? `${fail.details.origin} → ${fail.details.destination}`
                        : fail.details.name
                    }
                    <br />
                    <span className="text-sm text-gray-600">Error: {fail.error}</span>
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleRetryFailed}
                startIcon={<RefreshCw size={16} />}
                sx={{ mr: 1 }}
              >
                Retry Failed
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleRetryAll}
                startIcon={<RefreshCw size={16} />}
              >
                Retry All
              </Button>
            </Box>
          </Alert>
        )}

        {/* Success Message */}
        {allocationComplete && failedAllocations.length === 0 && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            icon={<Check size={20} />}
          >
            <AlertTitle>Allocation Complete</AlertTitle>
            All rooms and flights have been successfully allocated.
          </Alert>
        )}

        {/* Room & Traveler Details */}
        <Box sx={{ mb: 4 }}>
          {formData.rooms.map((room, index) => (
            <RoomInfo key={index} room={room} />
          ))}
        </Box>

        {/* Special Requirements */}
        {formData.specialRequirements && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Special Requirements
            </Typography>
            <Typography sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {formData.specialRequirements}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isAllocating}
          startIcon={<X size={18} />}
        >
          Cancel
        </Button>
        {!allocationComplete ? (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isAllocating}
            startIcon={isAllocating ? <CircularProgress size={20} /> : <Check size={18} />}
          >
            {isAllocating ? 'Allocating...' : 'Start Allocation'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleProceed}
            disabled={failedAllocations.length > 0}
            startIcon={<Check size={18} />}
            color="success"
          >
            Proceed to Price Check
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReviewBookingModal;