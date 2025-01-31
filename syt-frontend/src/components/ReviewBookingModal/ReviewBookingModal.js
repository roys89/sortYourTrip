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
import { AlertTriangle, Check, ChevronLeft, Hotel, Plane, RefreshCw, UserCheck, X } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertDescription } from "../../components/ui/alert";
import {
  searchReplacementFlight,
  updateItineraryFlight
} from '../../redux/slices/flightReplacementSlice';
import {
  allocateFlightPassengers,
  allocateHotelRooms
} from '../../redux/slices/guestAllocationSlice';


// Helper function to get remaining error message
const getRemainingErrorMessage = (failedAllocations) => {
  const failedFlights = failedAllocations.filter(f => f.type === 'flight');
  const failedHotels = failedAllocations.filter(f => f.type === 'hotel');

  if (failedFlights.length > 0 && failedHotels.length > 0) {
    return 'Please replace remaining flights and hotels before proceeding';
  } else if (failedFlights.length > 0) {
    return 'Please replace remaining flights before proceeding';
  } else if (failedHotels.length > 0) {
    return 'Please replace remaining hotels before proceeding';
  }
  return null;
};

// Allocation Progress Component
const AllocationProgress = ({ progress, currentItem }) => (
  <Alert severity="info" sx={{ mb: 3 }}>
    <AlertTitle>Allocating Rooms and Flights</AlertTitle>
    {progress.total > 0 && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CircularProgress size={20} />
        <Typography>
          Progress: {progress.current} of {progress.total} items
        </Typography>
      </Box>
    )}
    
    {currentItem && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {currentItem.type === 'flight' ? (
          <>
            <Plane size={16} />
            <Typography variant="body2">
              {currentItem.status || `Allocating flight: ${currentItem.origin} → ${currentItem.destination}`}
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

// Failed Allocations Component
const FailedAllocationsSection = ({ 
  failedAllocations, 
  handleFlightReplacement,
  isAllocating
}) => (
  <Alert 
    severity="warning" 
    icon={<AlertTriangle />}
    sx={{ mb: 3 }}
  >
    <AlertTitle>{getRemainingErrorMessage(failedAllocations)}</AlertTitle>
    <Stack spacing={1}>
      {failedAllocations.map((fail, idx) => (
        <Box key={idx}>
          {fail.type === 'flight' && (
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <div>
                <Typography variant="body2">
                  Flight: {fail.details.origin} → {fail.details.destination}
                  <br />
                  <span className="text-sm text-gray-600">
                    {fail.error.message}
                  </span>
                </Typography>
              </div>
              {(fail.error.errorCode === "6" || fail.error) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleFlightReplacement(fail)}
                  startIcon={isAllocating ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
                  disabled={isAllocating}
                  sx={{ ml: 2 }}
                >
                  {isAllocating ? 'Replacing...' : 'Replace Flight'}
                </Button>
              )}
            </Box>
          )}
          {fail.type === 'hotel' && (
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <div>
                <Typography variant="body2">
                  Hotel: {fail.details.name}
                  <br />
                  <span className="text-sm text-gray-600">
                    {fail.error.message}
                  </span>
                </Typography>
              </div>
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  </Alert>
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
  const navigate = useNavigate();
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

  const handleFlightReplacement = async (failedFlight) => {
    try {
      // Clear previous error when starting replacement
      setError(null);
      setIsAllocating(true);
      // Reset progress during replacement
      setAllocationProgress({
        current: 0,
        total: 0
      });
      
      setCurrentAllocation({
        type: 'flight',
        origin: failedFlight.details.origin,
        destination: failedFlight.details.destination,
        status: 'Searching for replacement flight...'
      });
  
      const searchResult = await dispatch(searchReplacementFlight({
        expiredFlight: failedFlight.details,
        itinerary,
        inquiryToken: tokens.inquiry
      })).unwrap();
  
      console.log('Flight search result:', searchResult);
  
      if (!Array.isArray(searchResult) || searchResult.length === 0) {
        throw new Error('No replacement flights found');
      }
  
      setCurrentAllocation(prev => ({
        ...prev,
        status: 'Updating itinerary with new flight...'
      }));
  
      const cityName = failedFlight.details.type === 'return_flight' 
        ? failedFlight.details.origin 
        : failedFlight.details.destination;
  
      const result = await dispatch(updateItineraryFlight({
        itineraryToken: tokens.itinerary,
        cityName,
        date: failedFlight.details.departureDate,
        newFlightDetails: searchResult[0], 
        type: failedFlight.details.type || 'departure_flight',
        inquiryToken: tokens.inquiry
      })).unwrap();
  
      console.log('Itinerary update result:', result);
  
      if (result.success) {
        const updatedFailedAllocations = failedAllocations.filter(f => 
          f.type !== 'flight' || 
          f.details.flightCode !== failedFlight.details.flightCode
        );
        
        setFailedAllocations(updatedFailedAllocations);
  
        const remainingFailedFlights = updatedFailedAllocations.filter(f => 
          f.type === 'flight'
        );
  
        if (remainingFailedFlights.length === 0) {
          setError('Please go back to itinerary to view updated flights and select seats if needed');
          setAllocationComplete(false);
        }
      } else {
        throw new Error('Failed to update itinerary with new flight');
      }
  
    } catch (error) {
      console.error('Error replacing flight:', error);
      setError(error.message || 'Failed to replace flight. Please try again.');
    } finally {
      setIsAllocating(false);
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
        {isAllocating && (
          <AllocationProgress 
            progress={allocationProgress}
            currentItem={currentAllocation}
          />
        )}

        {error && !error.includes('go back to itinerary') && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
          >
            <AlertTitle>Error During Allocation</AlertTitle>
            {error}
          </Alert>
        )}

{failedAllocations.length > 0 && (
  <FailedAllocationsSection
    failedAllocations={failedAllocations}
    handleFlightReplacement={handleFlightReplacement}
    isAllocating={isAllocating}
  />
)}

{allocationComplete && failedAllocations.length === 0 && !error?.includes('go back to itinerary') && (
  <Alert 
    severity="success" 
    sx={{ mb: 3 }}
    icon={<Check size={20} />}
  >
    <AlertTitle>Allocation Complete</AlertTitle>
    <AlertDescription>
      All rooms and flights have been successfully allocated.
    </AlertDescription>
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

<DialogActions>
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    width: '100%', 
    p: 2,
    alignItems: 'flex-start'  // Added to keep Cancel button height consistent
  }}>
    <Button
      variant="outlined"
      onClick={onClose}
      disabled={isAllocating}
      startIcon={<X size={18} />}
      sx={{ 
        borderColor: 'error.main',
        color: 'error.main',
        '&:hover': {
          borderColor: 'error.dark',
          backgroundColor: 'error.lighter',
        }
      }}
    >
      Cancel
    </Button>

    <Box sx={{ display: 'flex', gap: 2 }}>
      {failedAllocations.length === 0 && error?.includes('go back to itinerary') && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          alignItems: 'center',
          maxWidth: '500px'  // To control alert width
        }}>
          <Alert severity="success">
            <AlertTitle>All replacements complete!</AlertTitle>
            <AlertDescription>
              You can now go back to itinerary to view your updated flights and select seats
            </AlertDescription>
          </Alert>
          <Button
            variant="contained"
            onClick={() => {
              navigate('/itinerary', {
                state: {
                  itineraryToken: tokens.itinerary,
                  itineraryInquiryToken: tokens.inquiry
                }
              });
            }}
            startIcon={<ChevronLeft size={18} />}
            color="primary"
            fullWidth
          >
            Go Back to Itinerary
          </Button>
        </Box>
      )}
      
      {!error?.includes('go back to itinerary') && (
        !allocationComplete ? (
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
        )
      )}
    </Box>
  </Box>
</DialogActions>
</Dialog>
);
};

export default ReviewBookingModal;