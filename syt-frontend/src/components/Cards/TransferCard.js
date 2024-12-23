import { useTheme } from '@mui/material/styles';
import { Car, Clock, Info, MapPin, Users } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { setChangeTransfer, setSelectedTransfer } from '../../redux/slices/transferSlice';
import './Card.css';

const PLACEHOLDER_IMAGE = '/assets/images/api/placeholder/400/320';

const TransferCard = ({ transfer }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Determine icon colors based on theme
  const iconColor = theme.palette.mode === 'dark' 
    ? '#60A5FA'  // Light blue for dark mode
    : '#1D4ED8'; // Darker blue for light mode

  const formatTransferType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const vehicle = transfer.details.selectedQuote?.quote?.vehicle;
  const routeDetails = transfer.details.selectedQuote?.routeDetails;

  return (
    <div className="common-card-base">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Image Container */}
        <div className="w-full lg:w-80 h-48 lg:h-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <img 
            src={vehicle?.vehicleImages?.ve_im_url || PLACEHOLDER_IMAGE}
            alt={vehicle?.ve_similar_types || 'Transfer vehicle'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
        </div>

        {/* Content Container */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-grow space-y-6">
            {/* Title and Vehicle Info */}
            <div>
              <h3 className="text-xl font-bold text-white">
                {formatTransferType(transfer.type)}
              </h3>
              <p className="mt-2 text-gray-300">
                {vehicle?.ve_class} - {vehicle?.ve_similar_types}
              </p>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4">
              {/* Left Column - Route & Passengers */}
              <div className="space-y-4">
                {/* Route Info */}
                <div className="flex items-start space-x-2">
                  <MapPin size={16} color={iconColor} className="flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-blue-300 w-12">From:</span>
                      <span className="text-sm text-gray-100">{transfer.details.origin?.display_address}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-blue-300 w-12">To:</span>
                      <span className="text-sm text-gray-100">{transfer.details.destination?.display_address}</span>
                    </div>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="flex items-center space-x-2 text-gray-100">
                  <Users size={16} color={iconColor} className="flex-shrink-0" />
                  <span className="text-sm">
                    {transfer.details.totalTravelers} travelers
                  </span>
                </div>
              </div>

              {/* Right Column - Vehicle & Journey Details */}
              <div className="space-y-4">
                {/* Vehicle Capacity */}
                <div className="flex items-center space-x-2 text-gray-100">
                  <Car size={16} color={iconColor} className="flex-shrink-0" />
                  <span className="text-sm">
                    Max {vehicle?.ve_max_capacity} passengers, {vehicle?.ve_luggage_capacity} luggage
                  </span>
                </div>

                {/* Journey Details */}
                <div className="flex items-center space-x-4 text-gray-100">
                  <div className="flex items-center space-x-2">
                    <Clock size={16} color={iconColor} className="flex-shrink-0" />
                    <span className="text-sm">{transfer.details.duration} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Info size={16} color={iconColor} className="flex-shrink-0" />
                    <span className="text-sm">{transfer.details.distance}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Container - Right-most side */}
        <div className="flex flex-col justify-center p-4 space-y-2">
          <button 
            onClick={() => dispatch(setSelectedTransfer(transfer))}
            className="common-button-base common-button-view w-full"
          >
            View Details
          </button>
          <button 
            onClick={() => dispatch(setChangeTransfer(transfer))}
            className="common-button-base common-button-change w-full"
          >
            Change Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferCard;