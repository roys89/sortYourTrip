import { CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Baby, Bed, Eye, MapPin, Star, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setChangeHotel, setSelectedHotel } from '../../redux/slices/hotelSlice';
import { openRoomChangeModal } from '../../redux/slices/roomChangeSlice';
import './Card.css';

const HotelCard = ({ 
  hotel, 
  city, 
  date, 
  inquiryToken,
  itineraryToken,
  travelersDetails,
  showChange = false
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const [imageLoadError, setImageLoadError] = useState(false);
  const [tripAdvisorData, setTripAdvisorData] = useState(null);
  const [isTripAdvisorLoading, setIsTripAdvisorLoading] = useState(false);

  // Apply theme classes directly
  const themeClass = theme.palette.mode === 'light' ? 'light-theme' : '';
  const themeAttr = theme.palette.mode === 'light' ? 'light' : 'dark';

  // Get theme-appropriate colors
  const iconColor = theme.palette.mode === 'dark' 
    ? theme.palette.primary.main  // Use teal from dark theme
    : theme.palette.primary.main; // Use dark green from light theme

  // Looking at the data structure, hotel data is nested in the response
  const hotelDetails = hotel?.data?.items?.[0] || {};
  const hotelStatic = hotel?.data?.hotelDetails || {};
  const traceId = hotel?.data?.traceId;
  const hotelId = hotel?.data?.staticContent?.[0].id;
  
  // Get all selected rooms and rates info - now support multiple rooms
  const roomsAndRates = hotelDetails?.selectedRoomsAndRates || [];
  // Calculate total price from all rooms
  const totalRoomPrice = roomsAndRates.reduce((total, room) => total + (room?.rate?.finalRate || 0), 0);

  // Helper functions
  const getHotelName = () => hotelStatic?.name || 'Hotel Name Not Available';
  const getStarCount = () => parseInt(hotelStatic?.starRating) || 0;
  const getAddress = () => {
    const location = hotelStatic?.address;
    if (!location) return '';
    return [location.line1, location.line2, location.city?.name].filter(Boolean).join(', ');
  };

  const getCountry = () => {
    return hotelStatic?.address?.country?.name || '';
  };

  const getImageUrl = () => {
    if (imageLoadError) return '/api/placeholder/400/300';
    return hotel?.data?.staticContent?.[0]?.heroImage || 
           hotel?.data?.staticContent?.[0]?.images?.[0]?.links?.[0]?.url || 
           '/api/placeholder/400/300';
  };

  // Fetch TripAdvisor rating when component mounts
  useEffect(() => {
    const fetchTripAdvisorData = async () => {
      const hotelName = getHotelName();
      if (!hotelName || !city) return;
      
      setIsTripAdvisorLoading(true);
      try {
        // Get country and address from the hotel data
        const address = getAddress();
        const country = getCountry();
        
        // Create request body
        const requestBody = {
          name: hotelName,
          city,
          country,
          category: 'hotels'
        };
        
        // Only add address if it exists
        if (address) {
          requestBody.address = address;
        }
        
        const response = await fetch(
          'http://localhost:5000/api/tripadvisor/hotel/rating',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody)
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch TripAdvisor data');
        }
        
        const data = await response.json();
        if (data && data.success) {
          setTripAdvisorData(data.data);
        }
      } catch (err) {
        console.error('Error fetching TripAdvisor data:', err);
      } finally {
        setIsTripAdvisorLoading(false);
      }
    };
    
    fetchTripAdvisorData();
  }, [hotel]); // Re-run when hotel data changes

  const getRooms = () => {
    if (!roomsAndRates.length) return [];
    
    return roomsAndRates.map(roomAndRate => ({
      room_type: roomAndRate.room?.name || 'Standard Room',
      no_of_adults: roomAndRate.room?.occupancy?.adults || roomAndRate.occupancy?.adults || 0,
      no_of_children: roomAndRate.room?.occupancy?.children || roomAndRate.occupancy?.childAges?.length || 0,
      child_ages: roomAndRate.room?.occupancy?.childAges || roomAndRate.occupancy?.childAges || [],
      no_of_rooms: 1,
      board_basis: roomAndRate.rate?.boardBasis?.description || 'Room Only'
    }));
  };

  const handleViewDetails = () => {
    dispatch(setSelectedHotel(hotel));
  };

  const handleChangeHotel = () => {
    const hotelDetails = hotel?.data?.items?.[0];
  
    const navigationState = {
      city,
      date,
      inquiryToken,
      travelersDetails,
      returnTo: '/itinerary',
      oldHotelCode: hotelDetails?.code,
      existingHotelPrice: totalRoomPrice,
      checkIn: hotel.checkIn,
      checkOut: hotel.checkOut
    };
  
    dispatch(setChangeHotel({
      ...hotel,
      city,
      date,
      inquiryToken,
      travelersDetails,
      oldHotelCode: hotelDetails?.code
    }));
    console.log('Navigating to /hotels with state:', JSON.stringify(navigationState));
    navigate('/hotels', { state: navigationState });
  };

  const handleRoomChange = () => {
    dispatch(openRoomChangeModal({
      hotel,
      hotelId,
      traceId,
      itineraryToken,
      inquiryToken,
      city,
      date,
      dates: {
        checkIn: hotel.checkIn,
        checkOut: hotel.checkOut
      },
      existingPrice: totalRoomPrice
    }));
  };

  if (!hotelDetails || !hotelStatic) {
    return null;
  }

  return (
    <div className={`card-wrapper ${themeClass}`} data-theme={themeAttr}>
      {/* Image Container */}
      <div className="card-image-container">
        <div className="card-image-overlay"></div>
        <img
          src={getImageUrl()}
          alt={getHotelName()}
          className="card-image"
          loading="lazy"
          onError={() => setImageLoadError(true)}
        />
        <div className="shine-effect"></div>
        
        {/* Star rating tag */}
        {getStarCount() > 0 && (
          <div className="activity-tag">
            <Star size={14} color="#fff" />
            <span>{getStarCount()}-Star</span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="card-content-wrapper">
        {/* Hotel Name and Date */}
        <div className="flex justify-between items-start">
          <h3 
            className="text-xl font-bold"
            style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
          >
            {getHotelName()}
          </h3>
          
          {hotel.checkIn && (
            <span 
              className="text-sm whitespace-nowrap"
              style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
            >
              {new Date(hotel.checkIn).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
              {' - '}
              {new Date(hotel.checkOut).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2 mt-2">
          <MapPin 
            size={16} 
            style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
          />
          <span 
            className="text-sm"
            style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
          >
            {getAddress()}
          </span>
        </div>

        {/* Room Details - Scrollable container for multiple rooms */}
        <div className="overflow-x-auto mt-2 pb-2">
          <div className="flex gap-4" style={{ minWidth: 'fit-content' }}>
            {getRooms().map((room, index) => (
              <div key={index} className="hotel-room p-2 border border-gray-200 rounded-lg min-w-48">
                <div className="flex items-center gap-2">
                  <Bed 
                    size={16} 
                    style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                  >
                    {room.room_type}
                  </span>
                </div>
                
                <div className="hotel-info mt-1 ml-6">
                  <div className="hotel-info-item flex items-center gap-1">
                    <Users 
                      size={14} 
                      style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
                    />
                    <span 
                      className="text-xs"
                      style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                    >
                      {room.no_of_adults} {room.no_of_adults === 1 ? 'Adult' : 'Adults'}
                    </span>
                  </div>
                  
                  {room.no_of_children > 0 && (
                    <div className="hotel-info-item flex items-center gap-1">
                      <Baby 
                        size={14} 
                        style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
                      />
                      <span 
                        className="text-xs"
                        style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                      >
                        {room.no_of_children} {room.no_of_children === 1 ? 'Child' : 'Children'}
                        {room.child_ages && room.child_ages.length > 0 && (
                          <span className="text-xs opacity-75"> (Ages: {room.child_ages.join(', ')})</span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {/* Show board basis per room */}
                  <div className="mt-1">
                    <span 
                      className="inline-block text-xs px-2 py-1 rounded-full"
                      style={{ 
                        color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db',
                        backgroundColor: theme.palette.mode === 'light' ? 'rgba(9, 57, 35, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                        borderColor: theme.palette.mode === 'light' ? 'rgba(9, 57, 35, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      {room.board_basis}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* TripAdvisor Rating and Action Buttons in the same line */}
        <div className="card-footer">
          {/* TripAdvisor Rating */}
          <div className="card-rating">
            <div className="flex items-center">
              {isTripAdvisorLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : tripAdvisorData ? (
                <div className="flex items-center">
                  {/* If we have the rating image URL from TripAdvisor */}
                  {tripAdvisorData.rating_image_url ? (
                    <img 
                      src={tripAdvisorData.rating_image_url} 
                      alt={`${tripAdvisorData.rating} stars`}
                      className="h-4 mr-1"
                    />
                  ) : (
                    // Fallback to star icons if no image URL
                    <>
                      {[1, 2, 3, 4, 5].map((_, index) => {
                        const rating = parseFloat(tripAdvisorData.rating || 0);
                        const isFull = index < Math.floor(rating);
                        const isHalf = !isFull && index === Math.floor(rating) && rating % 1 >= 0.5;
                        
                        return isHalf ? (
                          <div key={index} className="relative" style={{ marginRight: '2px' }}>
                            <Star size={16} fill="transparent" color="#FFC107" />
                            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                              <Star size={16} fill="#FFC107" color="#FFC107" />
                            </div>
                          </div>
                        ) : (
                          <Star 
                            key={index} 
                            size={16} 
                            fill={isFull ? "#FFC107" : "transparent"} 
                            color="#FFC107" 
                            style={{ marginRight: '2px' }}
                          />
                        );
                      })}
                    </>
                  )}
                  <span 
                    className="ml-1 font-bold"
                    style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                  >
                    {tripAdvisorData.rating || '0.0'}
                  </span>
                  {tripAdvisorData.num_reviews && (
                    <span className="ml-1 text-xs opacity-75">
                      ({tripAdvisorData.num_reviews} reviews)
                    </span>
                  )}
                </div>
              ) : (
                // Fallback to hardcoded rating if no TripAdvisor data
                <div className="flex items-center">
                  {/* Full stars */}
                  {[1, 2, 3, 4].map((_, index) => (
                    <Star 
                      key={index} 
                      size={16} 
                      fill="#FFC107" 
                      color="#FFC107" 
                      style={{ marginRight: '2px' }}
                    />
                  ))}
                  {/* Half star - more accurate representation */}
                  <div className="relative" style={{ marginRight: '2px' }}>
                    {/* Empty star as background */}
                    <Star 
                      size={16} 
                      fill="transparent" 
                      color="#FFC107" 
                    />
                    {/* Half-filled star overlaid */}
                    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                      <Star 
                        size={16} 
                        fill="#FFC107" 
                        color="#FFC107" 
                      />
                    </div>
                  </div>
                  <span 
                    className="ml-1 font-bold"
                    style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                  >
                    4.5
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="card-actions">
            <button
              onClick={handleViewDetails}
              className="premium-button btn-view"
            >
              <div className="btn-icon-container">
                <Eye size={16} />
              </div>
            </button>
            
            {showChange && (
              <button
                onClick={handleChangeHotel}
                className="premium-button btn-change"
              >
                <div className="btn-icon-container">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <span>Change Hotel</span>
                </div>
              </button>
            )}
            
            <button
              onClick={handleRoomChange}
              className="premium-button btn-change"
            >
              <div className="btn-icon-container">
                <Bed size={16} />
                <span>Change Room</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;