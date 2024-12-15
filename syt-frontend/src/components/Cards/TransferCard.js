import { MapPin } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { setChangeTransfer, setSelectedTransfer } from '../../redux/slices/transferSlice';

const TransferCard = ({ transfer }) => {
  const dispatch = useDispatch();
  const formatTransferType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const vehicle = transfer.details.selectedQuote?.vehicle;

  return (
    <div className="bg-white rounded-xl shadow-[0_3px_10px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Vehicle Image Container */}
        <div className="w-full lg:w-80 h-48 lg:h-auto relative overflow-hidden">
          {vehicle?.vehicleImages?.ve_im_url ? (
            <img 
              src={vehicle.vehicleImages.ve_im_url}
              alt={vehicle.ve_similar_types}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-grow space-y-4">
            {/* Title and Vehicle Type */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 leading-tight hover:text-blue-600 transition-colors duration-200">
                {formatTransferType(transfer.type)}
              </h3>
              <p className="mt-2 text-gray-600">
                {vehicle?.ve_class} - {vehicle?.ve_similar_types}
              </p>
            </div>

            {/* Transfer Details */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-gray-600">
                <MapPin size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">From:</span>
                    <p className="text-sm">{transfer.details.origin?.display_address}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">To:</span>
                    <p className="text-sm">{transfer.details.destination?.display_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Info */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p>Distance: {transfer.details.distance}</p>
              <p>Duration: {transfer.details.duration} minutes</p>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {transfer.details.selectedQuote?.fare && (
                <span className="text-lg font-semibold text-blue-600 whitespace-nowrap">
                  {transfer.details.selectedQuote.currency_symbol}{Number(transfer.details.selectedQuote.fare).toLocaleString()}
                </span>
              )}

              <div className="flex flex-col w-full sm:w-auto sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  onClick={() => dispatch(setSelectedTransfer(transfer))}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 whitespace-nowrap"
                >
                  View Details
                </button>
                <button 
                  onClick={() => dispatch(setChangeTransfer(transfer))}
                  className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 whitespace-nowrap"
                >
                  Change Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferCard;