import { Baby, Bed, MapPin, Star, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setChangeHotel, setSelectedHotel } from '../../redux/slices/hotelSlice';
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
  const [imageLoadError, setImageLoadError] = useState(false);

  // Looking at the data structure, hotel data is nested in the response
  const hotelDetails = hotel?.data?.items?.[0] || {};
  const hotelStatic = hotel?.data?.staticContent?.[0] || {};
  
  // Get the selected room and rate info
  const roomAndRate = hotelDetails?.selectedRoomsAndRates?.[0] || {};

  const getHotelName = () => hotelStatic?.name || 'Hotel Name Not Available';
  const getStarCount = () => parseInt(hotelStatic?.starRating) || 0;
  const getAddress = () => {
    const location = hotelStatic?.contact?.address;
    if (!location) return '';
    return [location.line1, location.line2, location.city?.name].filter(Boolean).join(', ');
  };

  const getImageUrl = () => {
    if (imageLoadError) return '/api/placeholder/400/300';
    return hotel?.data?.staticContent?.[0]?.heroImage || hotel?.data?.staticContent?.[0]?.images?.[0]?.links?.[0]?.url || '/api/placeholder/400/300';
  };

  const getRooms = () => {
    if (!roomAndRate?.room) return [];
    return [{
      room_type: roomAndRate.room.name,
      no_of_adults: roomAndRate.room.occupancy?.adults || roomAndRate.occupancy?.adults || 0,
      no_of_children: roomAndRate.room.occupancy?.children || 0,
      no_of_rooms: 1
    }];
  };

  const handleViewDetails = () => {
    dispatch(setSelectedHotel(hotel));
  };

  const handleChangeHotel = () => {
    dispatch(setChangeHotel({
      ...hotel,
      city,
      date,
      inquiryToken,
      travelersDetails,
      oldHotelCode: hotelDetails.code
    }));

    navigate('/hotels', {
      state: {
        city,
        date,
        inquiryToken,
        travelersDetails,
        returnTo: '/itinerary',
        oldHotelCode: hotelDetails.code,
        existingHotelPrice: roomAndRate.rate?.finalRate
      }
    });
  };

  if (!hotelDetails || !hotelStatic) {
    return null;
  }

  return (
    <div className="common-card-base">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Hotel Image */}
        <div className="w-full lg:w-80 h-48 lg:h-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <img
            src={getImageUrl()}
            alt={getHotelName()}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            onError={() => setImageLoadError(true)}
          />
        </div>

        {/* Content Container */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-grow space-y-4">
            {/* Hotel Name and Stars */}
            <div>
              <h3 className="text-xl font-bold text-white">
                {getHotelName()}
              </h3>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center text-yellow-400">
                  {[...Array(getStarCount())].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <div className="flex items-center text-gray-100">
                  <MapPin size={16} className="text-blue-500 mr-1" />
                  <span className="text-sm">{getAddress()}</span>
                </div>
              </div>
            </div>

            {/* Room Types */}
            <div className="space-y-2">
              {getRooms().map((room, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-100">
                  <div className="flex items-center">
                    <Bed size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                    <span className="font-medium">{room.room_type}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Users size={16} className="text-blue-500 mr-1 flex-shrink-0" />
                      <span>x{room.no_of_adults}</span>
                    </div>
                    {room.no_of_children > 0 && (
                      <div className="flex items-center">
                        <Baby size={16} className="text-blue-500 mr-1 flex-shrink-0" />
                        <span>x{room.no_of_children}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Bed size={16} className="text-blue-500 mr-1 flex-shrink-0" />
                      <span>x{room.no_of_rooms}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Boarding Details */}
            {roomAndRate?.rate?.boardBasis?.description && (
              <div>
                <span className="inline-block bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-blue-500/20">
                  {roomAndRate.rate.boardBasis.description}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons Container */}
        <div className="flex flex-col justify-center p-4 space-y-2">
          <button
            onClick={handleViewDetails}
            className="common-button-base common-button-view"
          >
            View Details
          </button>
          {showChange && (
            <button
              onClick={handleChangeHotel}
              className="common-button-base common-button-change"
            >
              Change Hotel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelCard;