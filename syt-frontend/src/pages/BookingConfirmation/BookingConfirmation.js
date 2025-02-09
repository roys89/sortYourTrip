import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Typography
} from "@mui/material";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Loader,
  XCircle
} from "lucide-react";
import React, { memo, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  bookActivity,
  bookFlight,
  bookHotel,
  bookTransfer,
  setBookingStatus
} from '../../redux/slices/bookingConfirmationSlice';
import {
  transformActivityBookings,
  transformTransferBookings
} from '../../utils/bookingDataTransformer';

// Memoized Booking Item Component
const BookingItem = memo(({ type, item, status, error, onVoucherDownload, isLoading }) => {
  const getDisplayName = useCallback(() => {
    switch (type) {
      case "flight":
        return `${item.flightData.flightProvider} ${item.flightData.flightCode} - ${item.flightData.origin} to ${item.flightData.destination}`;
      case "hotel":
        const hotelName = item.data?.hotelDetails?.name || "Unknown Hotel";
        const cityName = item.data?.hotelDetails?.address?.city?.name || "Unknown City";
        return `${hotelName} - ${cityName}`;
      case "activity":
        return item.packageDetails?.title || item.activityName;
      case "transfer":
        const from = item.details.origin?.city;
        const to = item.details.destination?.city;
        return `Transfer from ${from} to ${to}`;
      default:
        return "Unknown Item";
    }
  }, [type, item]);

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader className="animate-spin text-blue-500" size={24} />;
    }
    
    switch (status) {
      case "confirmed":
        return <CheckCircle className="text-green-500" size={24} />;
      case "failed":
        return <XCircle className="text-red-500" size={24} />;
      default:
        return null;
    }
  };

  return (
    <Box className="p-4 mb-4 rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getStatusIcon()}
          <div>
            <Typography variant="subtitle1" className="font-medium">
              {getDisplayName()}
            </Typography>
            <Typography 
              variant="body2" 
              className={`
                ${status === "confirmed" ? "text-green-500" : ""}
                ${status === "failed" ? "text-red-500" : ""}
                ${isLoading ? "text-blue-500" : ""}
              `}
            >
              {isLoading ? "Loading" : status}
            </Typography>
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </div>
        </div>
        {status === "confirmed" && (
          <Button
            variant="outlined"
            startIcon={<Download size={20} />}
            onClick={() => onVoucherDownload(type, item)}
          >
            View Voucher
          </Button>
        )}
      </div>
    </Box>
  );
});

BookingItem.displayName = 'BookingItem';

// Helper functions
const getBookingKey = (type, item) => {
  switch (type) {
    case 'flight':
      return `flight-${item.flightData.flightCode}`;
    case 'hotel':
      return `hotel-${item.data.traceId}`;
    case 'activity':
      return `activity-${item.activityCode}`;
    case 'transfer':
      return `transfer-${item.details.quotation_id}`;
    default:
      return null;
  }
};

const getItemId = (type, item) => {
  switch (type) {
    case 'flight':
      return item.flightData.flightCode;
    case 'hotel':
      return item.data.traceId;
    case 'activity':
      return item.activityCode;
    case 'transfer':
      return item.details.quotation_id;
    default:
      return null;
  }
};

const BookingConfirmation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [overallStatus, setOverallStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const { 
    bookingStatuses = {}, 
    errors = {}, 
    bookingLoading = {} 
  } = useSelector((state) => state.bookingConfirmation || {});

  const { bookingId, itinerary, bookingData } = location.state || {};

  const handleBookingError = useCallback((type, id, error) => {
    console.error(`${type} booking error:`, error);
    dispatch(setBookingStatus({
      type,
      id,
      status: 'failed',
      error: error.message || `${type} booking failed`
    }));
  }, [dispatch]);

  const processBookings = useCallback(async () => {
    if (!bookingId || !itinerary || !bookingData) {
      navigate('/');
      return;
    }

    const allTravelers = bookingData.rooms.flatMap((room) => room.travelers);

    try {
      for (const city of itinerary.cities) {
        for (const day of city.days) {
          // Process Flights
          if (day.flights?.length > 0) {
            for (const flight of day.flights) {
              const flightId = flight.flightData.flightCode;
              try {
                dispatch(setBookingStatus({
                  type: 'flight',
                  id: flightId,
                  status: 'loading'
                }));

                const bookingResponse = await dispatch(
                  bookFlight({
                    bookingId,
                    flight: {
                      bookingId,
                      itineraryToken: itinerary.itineraryToken,
                      inquiryToken: itinerary.inquiryToken,
                      date: day.date,
                      city: city.city,
                      traceId: flight.flightData.traceId,
                      itineraryCode: flight.flightData.bookingDetails?.itineraryCode,
                      flightData: flight.flightData
                    }
                  })
                ).unwrap();

                if (!bookingResponse.success) {
                  handleBookingError('flight', flightId, new Error(bookingResponse.error || 'Flight booking failed'));
                }
              } catch (error) {
                handleBookingError('flight', flightId, error);
              }
            }
          }

          // Process Hotels
          if (day.hotels?.length > 0) {
            for (const hotel of day.hotels) {
              const hotelId = hotel.data.traceId;
              try {
                dispatch(setBookingStatus({
                  type: 'hotel',
                  id: hotelId,
                  status: 'loading'
                }));

                const bookingResponse = await dispatch(
                  bookHotel({
                    bookingId,
                    hotel: {
                      bookingId,
                      itineraryToken: itinerary.itineraryToken,
                      inquiryToken: itinerary.inquiryToken,
                      date: day.date,
                      city: city.city,
                      traceId: hotelId,
                      itineraryCode: hotel.data.code,
                      code: hotel.data.code,
                    }
                  })
                ).unwrap();

                if (!bookingResponse.success) {
                  handleBookingError('hotel', hotelId, new Error(bookingResponse.error || 'Hotel booking failed'));
                }
              } catch (error) {
                handleBookingError('hotel', hotelId, error);
              }
            }
          }

          // Process Activities
if (day.activities?.length > 0) {
  for (const activity of day.activities) {
    const activityId = activity.activityCode;
    try {
      dispatch(setBookingStatus({
        type: 'activity',
        id: activityId,
        status: 'loading'
      }));

      if (activity.activityType === 'offline') {
        // For offline activities, directly set as confirmed without API call
        dispatch(setBookingStatus({
          type: 'activity',
          id: activityId,
          status: 'confirmed'
        }));
        continue; // Skip the rest of this iteration
      }

      const activityContext = {
        cities: [{
          days: [{
            date: day.date,
            activities: [activity]
          }]
        }],
        itineraryToken: itinerary.itineraryToken,
        inquiryToken: itinerary.inquiryToken
      };

      const transformedActivity = transformActivityBookings(
        activityContext,
        allTravelers,
        bookingData.specialRequirements
      )[0];

      const bookingResponse = await dispatch(
        bookActivity({
          bookingId,
          activity: {
            bookingId,
            transformedActivity: {
              ...transformedActivity,
              itineraryToken: itinerary.itineraryToken,
              inquiryToken: itinerary.inquiryToken,
              cityName: city.city
            }
          }
        })
      ).unwrap();

      if (!bookingResponse.success) {
        handleBookingError('activity', activityId, bookingResponse);
      }
    } catch (error) {
      handleBookingError('activity', activityId, error);
    }
  }
}

          // Process Transfers
          if (day.transfers?.length > 0) {
            for (const transfer of day.transfers) {
              const quotationId = transfer.details.quotation_id;
              try {
                dispatch(setBookingStatus({
                  type: 'transfer',
                  id: quotationId,
                  status: 'loading'
                }));

                const singleTransferItinerary = {
                  ...itinerary,
                  cities: [{
                    ...city,
                    days: [{
                      ...day,
                      transfers: [transfer]
                    }]
                  }]
                };

                const transformedTransfer = transformTransferBookings(
                  singleTransferItinerary,
                  allTravelers
                )[0];

                const bookingResponse = await dispatch(
                  bookTransfer({
                    bookingId,
                    transfer: {
                      ...transformedTransfer,
                      bookingId,
                      quotationId,
                      itineraryToken: itinerary.itineraryToken,
                      inquiryToken: itinerary.inquiryToken,
                      cityName: city.city
                    }
                  })
                ).unwrap();

                if (!bookingResponse.success) {
                  handleBookingError('transfer', quotationId, new Error(bookingResponse.error || 'Transfer booking failed'));
                }
              } catch (error) {
                handleBookingError('transfer', quotationId, error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Overall booking process error:', error);
      setErrorMessage('Failed to complete the booking process');
    }
  }, [bookingId, itinerary, bookingData, navigate, dispatch, handleBookingError]);

  useEffect(() => {
    processBookings();
  }, [processBookings]);

  useEffect(() => {
    if (!bookingId || !itinerary) return;

    const allStatuses = Object.values(bookingStatuses);
    const allLoadingStates = Object.values(bookingLoading);

    if (allStatuses.length > 0) {
      const isStillLoading = allLoadingStates.some(loading => loading === true);
      const isAllConfirmed = allStatuses.every(
        (status) => status === 'confirmed'
      );
      const hasFailures = allStatuses.some((status) => status === 'failed');

      if (isStillLoading) {
        setOverallStatus('processing');
      } else {
        setOverallStatus(
          isAllConfirmed ? 'completed' : hasFailures ? 'partial' : 'processing'
        );
      }
    }
  }, [bookingId, itinerary, bookingStatuses, bookingLoading]);

  const handleVoucherDownload = async (type, item) => {
    const bookingKey = getBookingKey(type, item);
    if (bookingStatuses[bookingKey] !== 'confirmed') {
      console.warn('Voucher not available for this booking');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/booking/${bookingId}/voucher/${type}/${getItemId(type, item)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to download voucher');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-voucher-${getItemId(type, item)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading voucher:', error);
    }
  };

  if (!bookingId || !itinerary) {
    return null;
  }

  return (
    <Container maxWidth="xl" className="py-8">
      <Paper elevation={3} className="p-6">
        <Box className="text-center mb-8">
          <Typography variant="h4" gutterBottom>
            Booking Confirmation
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Booking Reference: {bookingId}
          </Typography>

          {overallStatus !== 'processing' && (
            <Alert
              severity={
                overallStatus === 'completed'
                  ? 'success'
                  : overallStatus === 'partial'
                  ? 'warning'
                  : 'error'
              }
              className="mt-4"
            >
              {overallStatus === 'completed'
                ? 'All bookings confirmed successfully!'
                : overallStatus === 'partial'
                ? 'Some bookings were successful, but others failed.'
                : 'Failed to complete all bookings.'}
            </Alert>
          )}
        </Box>

        <Divider className="mb-6" />

        {itinerary.cities.map((city, index) => (
         <Box key={index} className="mb-8">
         <Typography variant="h5" className="mb-4 font-semibold">
           {city.city}, {city.country}
         </Typography>

         {city.days.map((day, dayIndex) => (
           <Box key={dayIndex} className="mb-6">
             <Typography variant="h6" className="mb-3">
               Day {dayIndex + 1} - {day.date}
             </Typography>

             {day.flights?.map((flight) => (
               <BookingItem
                 key={flight.flightData.flightCode}
                 type="flight"
                 item={flight}
                 status={bookingStatuses[`flight-${flight.flightData.flightCode}`]}
                 error={errors[`flight-${flight.flightData.flightCode}`]}
                 onVoucherDownload={handleVoucherDownload}
                 isLoading={bookingLoading[`flight-${flight.flightData.flightCode}`]}
               />
             ))}

             {day.hotels?.map((hotel) => (
               <BookingItem
                 key={hotel.data.traceId}
                 type="hotel"
                 item={hotel}
                 status={bookingStatuses[`hotel-${hotel.data.traceId}`]}
                 error={errors[`hotel-${hotel.data.traceId}`]}
                 onVoucherDownload={handleVoucherDownload}
                 isLoading={bookingLoading[`hotel-${hotel.data.traceId}`]}
               />
             ))}

             {day.activities?.map((activity) => (
               <BookingItem
                 key={activity.activityCode}
                 type="activity"
                 item={activity}
                 status={bookingStatuses[`activity-${activity.activityCode}`]}
                 error={errors[`activity-${activity.activityCode}`]}
                 onVoucherDownload={handleVoucherDownload}
                 isLoading={bookingLoading[`activity-${activity.activityCode}`]}
               />
             ))}

             {day.transfers?.map((transfer) => (
               <BookingItem
                 key={transfer.details.quotation_id}
                 type="transfer"
                 item={transfer}
                 status={bookingStatuses[`transfer-${transfer.details.quotation_id}`]}
                 error={errors[`transfer-${transfer.details.quotation_id}`]}
                 onVoucherDownload={handleVoucherDownload}
                 isLoading={bookingLoading[`transfer-${transfer.details.quotation_id}`]}
               />
             ))}
           </Box>
         ))}
       </Box>
     ))}

     <Box className="mt-8 flex justify-between items-center">
       <Button
         variant="outlined"
         startIcon={<ArrowLeft />}
         onClick={() => navigate("/dashboard")}
       >
         Back to Dashboard
       </Button>

       <Button
         variant="contained"
         color="primary"
         onClick={() => navigate("/my-bookings")}
       >
         View All Bookings
       </Button>
     </Box>
   </Paper>
 </Container>
);
};

export default BookingConfirmation;