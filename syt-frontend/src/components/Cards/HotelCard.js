import { Baby, Bed, MapPin, Star, Users } from 'lucide-react';
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setChangeHotel, setSelectedHotel } from "../../redux/slices/hotelSlice";
import * as HotelUtils from "../../utils/hotelUtils";

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
  const [error, setError] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

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
    <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-gray-700/50">
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
        <div className="flex-1 p-6 flex flex-col bg-gray-900/40">
          <div className="flex-grow space-y-4">
            {/* Hotel Name and Stars */}
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">
                {HotelUtils.getHotelName(hotel)}
              </h3>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center text-yellow-400">
                  {[...Array(HotelUtils.getStarCount(hotel))].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <div className="flex items-center text-gray-100">
                  <MapPin size={16} className="text-blue-300 mr-1" />
                  <span className="text-sm">{hotel.address}</span>
                </div>
              </div>
            </div>

            {/* Room Types */}
            <div className="space-y-2">
              {HotelUtils.getRooms(hotel).map((room, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-100">
                  <div className="flex items-center">
                    <Bed size={16} className="text-blue-300 mr-2 flex-shrink-0" />
                    <span className="font-medium">{room.room_type}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Users size={16} className="text-blue-300 mr-1 flex-shrink-0" />
                      <span>x{room.no_of_adults}</span>
                    </div>
                    {room.no_of_children > 0 && (
                      <div className="flex items-center">
                        <Baby size={16} className="text-blue-300 mr-1 flex-shrink-0" />
                        <span>x{room.no_of_children}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Bed size={16} className="text-blue-300 mr-1 flex-shrink-0" />
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

          {/* Price and Actions */}
          <div className="pt-4 mt-4 border-t border-gray-400/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {HotelUtils.getRateDetails(hotel) && (
                <span className="text-lg font-semibold text-blue-300 whitespace-nowrap">
                  {hotel.rate.currency} {hotel.rate.price.toLocaleString()}
                </span>
              )}

              <div className="flex flex-col w-full sm:w-auto sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={handleViewDetails}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-500/80 hover:bg-blue-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 backdrop-blur-sm"
                >
                  View Details
                </button>
                {showChange && (
                  <button
                    onClick={handleChangeHotel}
                    className="w-full sm:w-auto px-4 py-2 bg-green-500/80 hover:bg-green-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 backdrop-blur-sm"
                  >
                    Change Hotel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 pb-6">
          <div className="p-3 bg-red-900/30 text-red-200 rounded-lg text-sm border border-red-700/50">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelCard;