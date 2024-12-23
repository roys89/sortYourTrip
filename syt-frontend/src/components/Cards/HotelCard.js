import { useTheme } from '@mui/material/styles';
import { Baby, Bed, MapPin, Star, Users } from 'lucide-react';
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setChangeHotel, setSelectedHotel } from "../../redux/slices/hotelSlice";
import * as HotelUtils from "../../utils/hotelUtils";
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
  const [error, setError] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Determine icon colors based on theme
  const iconColor = theme.palette.mode === 'dark' 
    ? '#60A5FA'  // Light blue for dark mode
    : '#1D4ED8'; // Darker blue for light mode

  const imageUrl = !imageLoadError ? HotelUtils.getImageUrl(hotel) : '/api/placeholder/400/300';

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
      oldHotelCode: hotel.hotelCode
    }));

    navigate('/hotels', {
      state: {
        city,
        date,
        inquiryToken,
        travelersDetails,
        returnTo: '/itinerary',
        oldHotelCode: hotel.hotelCode,
        existingHotelPrice: hotel.rate?.price 
      }
    });
  };

  return (
    <div className="common-card-base">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Hotel Image */}
        <div className="w-full lg:w-80 h-48 lg:h-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <img
            src={imageUrl}
            alt={HotelUtils.getHotelName(hotel)}
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
                {HotelUtils.getHotelName(hotel)}
              </h3>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center text-yellow-400">
                  {[...Array(HotelUtils.getStarCount(hotel))].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <div className="flex items-center text-gray-100">
                  <MapPin size={16} color={iconColor} className="mr-1" />
                  <span className="text-sm">{hotel.address}</span>
                </div>
              </div>
            </div>

            {/* Room Types */}
            <div className="space-y-2">
              {HotelUtils.getRooms(hotel).map((room, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-100">
                  <div className="flex items-center">
                    <Bed size={16} color={iconColor} className="mr-2 flex-shrink-0" />
                    <span className="font-medium">{room.room_type}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Users size={16} color={iconColor} className="mr-1 flex-shrink-0" />
                      <span>x{room.no_of_adults}</span>
                    </div>
                    {room.no_of_children > 0 && (
                      <div className="flex items-center">
                        <Baby size={16} color={iconColor} className="mr-1 flex-shrink-0" />
                        <span>x{room.no_of_children}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Bed size={16} color={iconColor} className="mr-1 flex-shrink-0" />
                      <span>x{room.no_of_rooms}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Boarding Details */}
            {HotelUtils.getBoardingDetails(hotel)?.[0] && (
              <div>
                <span className="inline-block bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-blue-500/20">
                  {HotelUtils.getBoardingDetails(hotel)[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons Container - Right-most side */}
        <div className="flex flex-col justify-center p-4 space-y-2">
          <button
            onClick={handleViewDetails}
            className="common-button-base common-button-view w-full"
          >
            View Details
          </button>
          {showChange && (
            <button
              onClick={handleChangeHotel}
              className="common-button-base common-button-change w-full"
            >
              Change Hotel
            </button>
          )}
        </div>

        {error && (
          <div className="px-6 pb-6">
            <div className="p-3 bg-red-900/30 text-red-200 rounded-lg text-sm border border-red-700/50">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelCard;