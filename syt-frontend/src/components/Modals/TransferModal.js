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

  const formatPolicy = (policy) => {
    return policy?.split(';').filter(item => item.trim()) || [];
  };

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
            {selectedTransfer.details.selectedQuote?.vehicle?.image ? (
              <img 
                src={selectedTransfer.details.selectedQuote.vehicle.image}
                alt={selectedTransfer.details.selectedQuote.vehicle.similar_type}
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
                  <span>{selectedTransfer.details.selectedQuote?.vehicle?.class} - {selectedTransfer.details.selectedQuote?.vehicle?.similar_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">
                    {selectedTransfer.details.selectedQuote?.currency_symbol}{selectedTransfer.details.selectedQuote?.fare}
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
                    <span>Capacity: {selectedTransfer.details.selectedQuote?.vehicle?.capacity} passengers</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Luggage size={16} className="text-blue-500" />
                    <span>Max Luggage: {selectedTransfer.details.selectedQuote?.vehicle?.maxLuggage} pieces</span>
                  </div>
                </div>
                {selectedTransfer.details.selectedQuote?.vehicle?.tags && (
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-sm text-gray-600">Features: {selectedTransfer.details.selectedQuote.vehicle.tags}</p>
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
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} className="text-blue-500" />
                    <span>Total Travelers: {selectedTransfer.details.totalTravelers}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div>
              <h3 className="text-base font-semibold mb-3">Policies</h3>
              {selectedTransfer.details.selectedQuote?.waiting_time_policy && (
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Waiting Time Policy:</p>
                  <p className="text-sm text-gray-600">{selectedTransfer.details.selectedQuote.waiting_time_policy}</p>
                </div>
              )}
              {selectedTransfer.details.selectedQuote?.cancellation_policy && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Cancellation Policy:</p>
                  <ul className="space-y-2">
                    {formatPolicy(selectedTransfer.details.selectedQuote.cancellation_policy).map((policy, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{policy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;