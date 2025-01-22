import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Changed from lucide-react to MUI
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { CheckCircle, CircleDashed, Download, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookAllItems, getItemVoucher } from '../../redux/slices/bookingSlice';

// Item components for each booking type
const BookingItem = ({ type, item, bookingId }) => {
  const dispatch = useDispatch();
  const bookingStatuses = useSelector(state => state.booking.bookingStatuses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get the unique identifier for this item based on type
  const getItemIdentifier = () => {
    switch(type) {
      case 'flight':
        return item.flightCode;
      case 'hotel':
        return item.traceId;
      case 'activity':
        return item.bookingRef;
      case 'transfer':
        return item.quotation_id;
      default:
        return null;
    }
  };

  const status = bookingStatuses[`${type}-${getItemIdentifier()}`] || 'pending';

  const handleDownloadVoucher = async () => {
    try {
      await dispatch(getItemVoucher({
        bookingId,
        type,
        item
      })).unwrap();
    } catch (err) {
      setError('Failed to download voucher');
    }
  };

  const getStatusIcon = () => {
    if (loading) {
      return <CircleDashed className="animate-spin text-blue-500" size={24} />;
    }
    
    switch(status) {
      case 'confirmed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'failed':
        return <X className="text-red-500" size={24} />;
      default:
        return <CircleDashed className="text-gray-500" size={24} />;
    }
  };

  const getItemTitle = () => {
    switch(type) {
      case 'flight':
        return `Flight ${item.flightCode} - ${item.origin} to ${item.destination}`;
      case 'hotel':
        return `${item.hotelDetails.name} - ${item.cityCode}`;
      case 'activity':
        return item.packageDetails.title;
      case 'transfer':
        return `Transfer from ${item.routeDetails.pickup_location.address} to ${item.routeDetails.dropoff_location.address}`;
      default:
        return 'Unknown Item';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-4 bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        {getStatusIcon()}
        <div>
          <Typography variant="subtitle1" className="font-medium">
            {getItemTitle()}
          </Typography>
          <Typography variant="body2" className={`
            ${status === 'confirmed' ? 'text-green-500' : ''}
            ${status === 'failed' ? 'text-red-500' : ''}
            ${status === 'pending' ? 'text-gray-500' : ''}
          `}>
            {loading ? 'Booking in progress...' : status}
          </Typography>
          {error && (
            <Typography variant="body2" className="text-red-500">
              {error}
            </Typography>
          )}
        </div>
      </div>
      {status === 'confirmed' && (
        <Button
          variant="outlined"
          startIcon={<Download size={20} />}
          onClick={handleDownloadVoucher}
        >
          View Voucher
        </Button>
      )}
    </div>
  );
};

// City component
const CityBookings = ({ city, bookingId }) => {
  return (
    <div className="mb-8">
      <Typography variant="h5" className="mb-4 font-semibold">
        {city.city}, {city.country}
      </Typography>
      {city.days.map((day, dayIndex) => (
        <div key={dayIndex} className="mb-6">
          <Typography variant="h6" className="mb-3">
            Day {dayIndex + 1} - {day.date}
          </Typography>
          
          {day.flights?.map((flight) => (
            <BookingItem
              key={flight.flightData.flightCode}
              type="flight"
              item={flight.flightData}
              bookingId={bookingId}
            />
          ))}
          
          {day.hotels?.map((hotel) => (
            <BookingItem
              key={hotel.data.traceId}
              type="hotel"
              item={hotel.data}
              bookingId={bookingId}
            />
          ))}
          
          {day.activities?.map((activity) => (
            <BookingItem
              key={activity.bookingRef}
              type="activity"
              item={activity}
              bookingId={bookingId}
            />
          ))}
          
          {day.transfers?.map((transfer) => (
            <BookingItem
              key={transfer.details.quotation_id}
              type="transfer"
              item={transfer.details}
              bookingId={bookingId}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Main component
const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const bookingStatuses = useSelector(state => state.booking.bookingStatuses);
  const { bookingData, itinerary } = location.state || {};

  useEffect(() => {
    if (bookingData && itinerary) {
      // Start booking all items
      dispatch(bookAllItems({
        bookingId: bookingData.bookingId,
        itinerary
      }));
    }
  }, [dispatch, bookingData, itinerary]);

  if (!bookingData || !itinerary) {
    navigate('/');
    return null;
  }

  const allConfirmed = Object.values(bookingStatuses).every(
    status => status === 'confirmed'
  );

  return (
    <Container maxWidth="xl" className="py-8">
      <Paper elevation={3} className="p-6">
        <Box className="text-center mb-8">
          <Typography variant="h4" gutterBottom>
            Booking Confirmation
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600">
            Booking Reference: {bookingData.bookingId}
          </Typography>
        </Box>

        {itinerary.cities.map((city, index) => (
          <CityBookings
            key={index}
            city={city}
            bookingId={bookingData.bookingId}
          />
        ))}

        <Box className="mt-8 flex justify-between items-center">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          
          {allConfirmed && (
            <Typography variant="subtitle1" className="text-green-500">
              All bookings confirmed successfully!
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default BookingConfirmation;