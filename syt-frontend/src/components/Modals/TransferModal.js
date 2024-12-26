import { Car, Clock, Luggage, MapPin, Users, X } from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/transferSlice';
import './Modal.css';

const TransferModal = () => {
  const dispatch = useDispatch();
  const { selectedTransfer, isModalOpen } = useSelector(state => state.transfers);
  const quote = selectedTransfer?.details?.selectedQuote;
  const vehicle = quote?.quote?.vehicle;
  const routeDetails = quote?.routeDetails;

  if (!isModalOpen || !selectedTransfer) return null;

  const formatTransferType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

        {/* Vehicle Image Banner */}
        <div className="modal-banner">
          {vehicle?.vehicleImages?.ve_im_url ? (
            <img 
              src={vehicle.vehicleImages.ve_im_url}
              alt={vehicle.ve_similar_types}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Car size={120} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="modal-content">
          {/* Header */}
          <div className="modal-section">
            <h2 className="modal-section-title">
              {formatTransferType(selectedTransfer.type)}
            </h2>
            <div className="modal-grid-2">
              <div className="modal-info-box">
                <div className="flex items-center gap-2">
                  <Car size={18} className="modal-icon" />
                  <span className="modal-text-secondary">
                    {vehicle?.ve_class} - {vehicle?.ve_similar_types}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="modal-section">
            <h3 className="modal-section-title">
              <Car size={18} className="modal-icon" />
              Vehicle Details
            </h3>
            <div className="modal-grid-2">
              <div className="modal-card">
                <div className="flex items-center gap-2">
                  <Users size={16} className="modal-icon" />
                  <span className="modal-text-secondary">
                    Capacity: {vehicle?.ve_max_capacity} passengers
                  </span>
                </div>
              </div>
              <div className="modal-card">
                <div className="flex items-center gap-2">
                  <Luggage size={16} className="modal-icon" />
                  <span className="modal-text-secondary">
                    Max Luggage: {vehicle?.ve_luggage_capacity} pieces
                  </span>
                </div>
              </div>
            </div>
            {vehicle?.ve_tags && vehicle.ve_tags.length > 0 && (
              <div className="modal-card mt-4">
                <p className="modal-text-secondary">
                  Features: {vehicle.ve_tags.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Journey Details */}
          <div className="modal-section">
            <h3 className="modal-section-title">
              <MapPin size={18} className="modal-icon" />
              Journey Details
            </h3>
            <div className="space-y-4">
              <div className="modal-card">
                <h4 className="modal-text-strong mb-2">Pickup Location</h4>
                <p className="modal-text-secondary">
                  {selectedTransfer.details.origin?.display_address}
                </p>
                {routeDetails?.pickup_date && (
                  <p className="modal-text-secondary mt-2">
                    <Clock size={16} className="inline mr-2 modal-icon" />
                    {formatDateTime(routeDetails.pickup_date)}
                  </p>
                )}
              </div>
              <div className="modal-card">
                <h4 className="modal-text-strong mb-2">Drop-off Location</h4>
                <p className="modal-text-secondary">
                  {selectedTransfer.details.destination?.display_address}
                </p>
              </div>
              <div className="modal-grid-2">
                <div className="modal-info-box">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="modal-icon" />
                    <span className="modal-text-secondary">
                      Travelers: {selectedTransfer.details.totalTravelers}
                    </span>
                  </div>
                </div>
                <div className="modal-info-box">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="modal-icon" />
                    <span className="modal-text-secondary">
                      Distance: {selectedTransfer.details.distance}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Services */}
          {quote?.quote?.meet_greet !== undefined && (
            <div className="modal-section">
              <h3 className="modal-section-title">Additional Services</h3>
              <div className={quote.quote.meet_greet ? 'modal-status-success' : 'modal-status-error'}>
                Meet & Greet: {quote.quote.meet_greet ? 'Included' : 'Not Included'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferModal;