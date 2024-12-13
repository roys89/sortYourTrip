import { Baby, ChevronLeft, ChevronRight, Clock, Info, MapPin, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/activitySlice';

const ActivityModal = () => {
  const dispatch = useDispatch();
  const { selectedActivity, isModalOpen } = useSelector(state => state.activities);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  if (!isModalOpen || !selectedActivity) return null;

  const images = selectedActivity?.images || [];

  const getDisplayPrice = () => {
    if (selectedActivity?.packageDetails?.amount && selectedActivity?.packageDetails?.currency) {
      return `${selectedActivity.packageDetails.currency} ${selectedActivity.packageDetails.amount.toLocaleString()}`;
    }
    return "Price on request";
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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

        {/* Image Carousel */}
        <div className="flex-shrink-0">
          {images.length > 0 && (
            <div className="relative h-72 w-full rounded-t-xl overflow-hidden bg-gray-100">
              <img
                src={images[currentImageIndex]?.variants?.[0]?.url || '/api/placeholder/800/400'}
                alt={`${selectedActivity.activityName} - view ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white">
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold mb-4">{selectedActivity.activityName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                {selectedActivity.duration && (
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-blue-500" />
                    <span>{selectedActivity.duration}</span>
                  </div>
                )}
                {selectedActivity.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-blue-500" />
                    <span>{selectedActivity.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">{getDisplayPrice()}</span>
                </div>
              </div>
            </div>

            {/* Age Bands */}
            {selectedActivity.ageBands?.length > 0 && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-3">Age Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedActivity.ageBands.map((band, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Baby size={16} className="text-blue-500" />
                        <p className="font-medium text-sm text-gray-900">{band.ageBand}</p>
                      </div>
                      <p className="text-sm text-gray-600">Age Range: {band.startAge} - {band.endAge} years</p>
                      <p className="text-sm text-gray-600">Max Travelers: {band.maxTravelersPerBooking}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedActivity.description && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <Info size={18} className="text-blue-500" />
                  Description
                </h3>
                <div className="prose max-w-none text-gray-600 text-sm">
                  {selectedActivity.description}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {selectedActivity.additionalInfo?.length > 0 && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-2">Additional Information</h3>
                <ul className="space-y-2">
                  {selectedActivity.additionalInfo.map((info, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{info.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
              {/* Inclusions */}
              {selectedActivity.inclusions?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Inclusions</h3>
                  <ul className="space-y-2">
                    {selectedActivity.inclusions.map((inclusion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{inclusion.otherDescription || inclusion.typeDescription}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exclusions */}
              {selectedActivity.exclusions?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Exclusions</h3>
                  <ul className="space-y-2">
                    {selectedActivity.exclusions.map((exclusion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-red-500 mt-1">✕</span>
                        <span>{exclusion.otherDescription || exclusion.typeDescription}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Booking Requirements */}
            {selectedActivity.bookingRequirements && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-2">Booking Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={18} className="text-blue-500" />
                    <span>Min Travelers: {selectedActivity.bookingRequirements.minTravelersPerBooking}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={18} className="text-blue-500" />
                    <span>Max Travelers: {selectedActivity.bookingRequirements.maxTravelersPerBooking}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Policy */}
            {selectedActivity.cancellationFromTourDate?.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-2">Cancellation Policy</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <ul className="space-y-2">
                    {selectedActivity.cancellationFromTourDate.map((policy, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {policy.dayRangeMin} {policy.dayRangeMax ? `- ${policy.dayRangeMax}` : '+'} days: 
                        <span className="font-medium"> {policy.percentageRefundable}% refundable</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;