import { Baby, ChevronLeft, ChevronRight, Clock, Info, MapPin, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/activitySlice';
import './Modal.css';

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

  // const getDisplayPrice = () => {
  //   if (selectedActivity?.packageDetails?.amount && selectedActivity?.packageDetails?.currency) {
  //     return `${selectedActivity.packageDetails.currency} ${selectedActivity.packageDetails.amount.toLocaleString()}`;
  //   }
  //   return "Price on request";
  // };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-enter">
        {/* Close Button */}
        <button 
          onClick={() => dispatch(closeModal())}
          className="modal-close-btn"
        >
          <X size={24} className="modal-text-base" />
        </button>

        {/* Image Carousel */}
        <div className="modal-banner">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]?.variants?.[0]?.url || '/api/placeholder/800/400'}
                alt={`${selectedActivity.activityName} - view ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={24} className="modal-text-base" />
                  </button>
                  <button 
                    onClick={nextImage} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronRight size={24} className="modal-text-base" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="modal-text-secondary">No image available</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="modal-content">
          {/* Header */}
          <div className="modal-section">
            <h2 className="modal-section-title">{selectedActivity.activityName}</h2>
            <div className="modal-grid-3">
              {selectedActivity.duration && (
                <div className="modal-info-box">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="modal-icon" />
                    <span className="modal-text-secondary">{selectedActivity.duration} Hour</span>
                  </div>
                </div>
              )}
              {selectedActivity.location && (
                <div className="modal-info-box">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="modal-icon" />
                    <span className="modal-text-secondary">{selectedActivity.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Age Bands */}
          {selectedActivity.ageBands?.length > 0 && (
            <div className="modal-section">
              <h3 className="modal-section-title">Age Requirements</h3>
              <div className="modal-grid-2">
                {selectedActivity.ageBands.map((band, index) => (
                  <div key={index} className="modal-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Baby size={16} className="modal-icon" />
                      <p className="modal-text-strong">{band.ageBand}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="modal-text-secondary">Age Range: {band.startAge} - {band.endAge} years</p>
                      <p className="modal-text-secondary">Max Travelers: {band.maxTravelersPerBooking}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {selectedActivity.description && (
            <div className="modal-section">
              <h3 className="modal-section-title">
                <Info size={18} className="modal-icon" />
                Description
              </h3>
              <div className="modal-text-secondary">
                {selectedActivity.description}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {selectedActivity.additionalInfo?.length > 0 && (
            <div className="modal-section">
              <h3 className="modal-section-title">Additional Information</h3>
              <div className="modal-info-box">
                <ul className="space-y-2">
                  {selectedActivity.additionalInfo.map((info, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="modal-icon mt-1">•</span>
                      <span className="modal-text-secondary">{info.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Inclusions & Exclusions */}
          <div className="modal-section">
            <div className="modal-grid-2">
              {/* Inclusions */}
              {selectedActivity.inclusions?.length > 0 && (
                <div className="modal-card">
                  <h3 className="modal-section-title">Inclusions</h3>
                  <ul className="space-y-2">
                    {selectedActivity.inclusions.map((inclusion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="modal-text-secondary">
                          {inclusion.otherDescription || inclusion.typeDescription}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exclusions */}
              {selectedActivity.exclusions?.length > 0 && (
                <div className="modal-card">
                  <h3 className="modal-section-title">Exclusions</h3>
                  <ul className="space-y-2">
                    {selectedActivity.exclusions.map((exclusion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">✕</span>
                        <span className="modal-text-secondary">
                          {exclusion.otherDescription || exclusion.typeDescription}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Booking Requirements */}
          {selectedActivity.bookingRequirements && (
            <div className="modal-section">
              <h3 className="modal-section-title">Booking Requirements</h3>
              <div className="modal-grid-2">
                <div className="modal-info-box">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="modal-icon" />
                    <span className="modal-text-secondary">
                      Min Travelers: {selectedActivity.bookingRequirements.minTravelersPerBooking}
                    </span>
                  </div>
                </div>
                <div className="modal-info-box">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="modal-icon" />
                    <span className="modal-text-secondary">
                      Max Travelers: {selectedActivity.bookingRequirements.maxTravelersPerBooking}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Policy */}
          {selectedActivity.cancellationFromTourDate?.length > 0 && (
            <div className="modal-section">
              <h3 className="modal-section-title">Cancellation Policy</h3>
              <div className="modal-info-box">
                <ul className="space-y-2">
                  {selectedActivity.cancellationFromTourDate.map((policy, index) => (
                    <li key={index} className="modal-text-secondary">
                      {policy.dayRangeMin} {policy.dayRangeMax ? `- ${policy.dayRangeMax}` : '+'} days: 
                      <span className="modal-text-strong"> {policy.percentageRefundable}% refundable</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;