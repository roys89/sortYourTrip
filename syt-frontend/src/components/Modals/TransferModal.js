import { Car, Luggage, MapPin, Users, X } from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/transferSlice';

const TransferModal = () => {
  const dispatch = useDispatch();
  const { selectedTransfer, isModalOpen } = useSelector(state => state.transfers);

  if (!isModalOpen || !selectedTransfer) return null;

  const formatTransferType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const vehicle = selectedTransfer.details.selectedQuote?.vehicle;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 pb-4">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Close Button */}
        <button 
          onClick={() => dispatch(closeModal())}
          className="absolute right-4 top-4 z-50 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X size={24} className="text-gray-500 hover:text-gray-700" />
        </button>

        {/* Vehicle Image */}
        <div className="flex-shrink-0">
          <div className="relative h-72 w-full rounded-t-xl overflow-hidden bg-gray-100">
            {vehicle?.vehicleImages?.ve_im_url ? (
              <img 
                src={vehicle.vehicleImages.ve_im_url}
                alt={vehicle.ve_similar_types}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold mb-4">{formatTransferType(selectedTransfer.type)}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Car size={18} className="text-blue-500" />
                  <span>{vehicle?.ve_class} - {vehicle?.ve_similar_types}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">
                    {selectedTransfer.details.selectedQuote?.currency_symbol}
                    {Number(selectedTransfer.details.selectedQuote?.fare).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="border-b pb-4">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Car size={18} className="text-blue-500" />
                Vehicle Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="text-blue-500" />
                    <span>Capacity: {vehicle?.ve_max_capacity} passengers</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Luggage size={16} className="text-blue-500" />
                    <span>Max Luggage: {vehicle?.ve_luggage_capacity} pieces</span>
                  </div>
                </div>
                {vehicle?.ve_tags && vehicle.ve_tags.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-sm text-gray-600">Features: {vehicle.ve_tags.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Journey Details */}
            <div className="border-b pb-4">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" />
                Journey Details
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">From:</p>
                  <p className="text-sm text-gray-600">{selectedTransfer.details.origin?.display_address}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">To:</p>
                  <p className="text-sm text-gray-600">{selectedTransfer.details.destination?.display_address}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} className="text-blue-500" />
                      <span>Total Travelers: {selectedTransfer.details.totalTravelers}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-blue-500" />
                      <span>Distance: {selectedTransfer.details.distance}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meet & Greet */}
            {selectedTransfer.details.selectedQuote?.meet_greet !== undefined && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  Meet & Greet Service: {selectedTransfer.details.selectedQuote.meet_greet ? 'Included' : 'Not Included'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;