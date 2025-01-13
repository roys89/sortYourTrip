import { useTheme } from '@mui/material/styles';
import { Clock, Info, MapPin } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { setChangeTransfer, setSelectedTransfer } from '../../redux/slices/transferSlice';
import './Card.css';

const PLACEHOLDER_IMAGE = '/assets/images/api/placeholder/400/320';

const truncateAddress = (address, maxLength = 30) => {
  return address && address.length > maxLength 
    ? `${address.slice(0, maxLength)}...`
    : address;
};

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
            <div className="space-y-4">
              {/* Route Info */}
              <div className="flex items-center space-x-2">
                <MapPin size={16} color={iconColor} className="flex-shrink-0" />
                <div className="flex flex-col w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
                    <span className="text-sm text-gray-100 mb-1 sm:mb-0">
                      From: {truncateAddress(transfer.details.origin?.display_address)}
                    </span>
                    <div className="hidden sm:flex items-center mx-2">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke={iconColor} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="lucide lucide-arrow-right"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </div>
                    <div className="sm:hidden flex items-center self-center w-full justify-center my-1">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke={iconColor} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="lucide lucide-arrow-down"
                      >
                        <path d="M12 5v14" />
                        <path d="m19 12-7 7-7-7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-100">
                      To: {truncateAddress(transfer.details.destination?.display_address)}
                    </span>
                  </div>
                </div>
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