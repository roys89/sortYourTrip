import { Baby, Bed, Check, Clock, MapPin, Star, Users, X } from 'lucide-react';
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../redux/slices/hotelSlice";
import * as HotelUtils from '../../utils/hotelUtils';
import './Modal.css';

const HotelModal = () => {
  const dispatch = useDispatch();
  const { selectedHotel, isModalOpen } = useSelector((state) => state.hotels);

  if (!isModalOpen || !selectedHotel) return null;

  const hotelName = HotelUtils.getHotelName(selectedHotel);
  const imageUrl = HotelUtils.getImageUrl(selectedHotel, '800/400');
  const starCount = HotelUtils.getStarCount(selectedHotel);
  const rateDetails = HotelUtils.getRateDetails(selectedHotel);
  const hotelDescription = HotelUtils.getHotelDescription(selectedHotel);
  const { checkIn, checkOut } = HotelUtils.getCheckTimes(selectedHotel);
  const isRefundable = HotelUtils.isRefundable(selectedHotel);

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-enter">
        {/* Close Button */}
        <button 
          onClick={() => dispatch(closeModal())}
          className="modal-close-btn"
        >
          <X size={24} />
        </button>

        {/* Hero Image */}
        <div className="modal-banner">
          <img
            src={imageUrl}
            alt={hotelName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Scrollable Content */}
        <div className="modal-content">
          {/* Header */}
          <div className="modal-section">
            <h2 className="text-xl font-bold mb-4 modal-text-base">{hotelName}</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-yellow-400">
                {[...Array(starCount)].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="modal-icon" />
                <span className="modal-text-secondary">{selectedHotel.address}</span>
              </div>
            </div>
          </div>

          {/* Room Types */}
          {rateDetails?.rooms && (
            <div className="modal-section">
              <h3 className="modal-section-title">
                <Bed size={18} className="modal-icon" />
                Room Types
              </h3>
              <div className="modal-grid-2">
                {HotelUtils.getRooms(selectedHotel).map((room, index) => (
                  <div key={index} className="modal-card">
                    <h4 className="modal-text-strong mb-2">{room.room_type}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="modal-icon" />
                        <span className="modal-text-secondary">Adults: {room.no_of_adults}</span>
                      </div>
                      {room.no_of_children > 0 && (
                        <div className="flex items-center gap-2">
                          <Baby size={16} className="modal-icon" />
                          <span className="modal-text-secondary">Children: {room.no_of_children}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Bed size={16} className="modal-icon" />
                        <span className="modal-text-secondary">Rooms: {room.no_of_rooms}</span>
                      </div>
                    </div>
                    {room.description && (
                      <p className="modal-text-secondary mt-2">{room.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {hotelDescription && (
            <div className="modal-section">
              <h3 className="modal-section-title">Description</h3>
              <div
                className="modal-text-secondary prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: hotelDescription,
                }}
              />
            </div>
          )}

          {/* Check Times */}
          <div className="modal-section">
            <h3 className="modal-section-title">
              <Clock size={18} className="modal-icon" />
              Check-in/Check-out Times
            </h3>
            <div className="modal-grid-2">
              <div className="modal-info-box">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="modal-icon" />
                  <span className="modal-text-secondary">Check-in: {checkIn}</span>
                </div>
              </div>
              <div className="modal-info-box">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="modal-icon" />
                  <span className="modal-text-secondary">Check-out: {checkOut}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Status */}
          <div className="modal-section">
            <h3 className="modal-section-title">Refund Status</h3>
            <div className={isRefundable ? 'modal-status-success' : 'modal-status-error'}>
              {isRefundable ? 'Refundable' : 'Non-Refundable'}
            </div>
          </div>

          {/* Facilities */}
          {selectedHotel.hotel_details?.facilities && (
            <div className="modal-section">
              <h3 className="modal-section-title">
                <Check size={18} className="modal-icon" />
                Facilities
              </h3>
              <div className="modal-grid-3">
                {HotelUtils.formatFacilities(selectedHotel.hotel_details.facilities).map(
                  (facility, index) => (
                    <div key={index} className="modal-info-box">
                      <span className="modal-text-secondary">{facility}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelModal;