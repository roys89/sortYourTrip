import { Baby, Bed, Check, ChevronDown, ChevronUp, Clock, MapPin, Star, Users, X } from 'lucide-react';
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../redux/slices/hotelSlice";
import './Modal.css';

// Collapsible Component
const Collapsible = ({ title, children, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="modal-section">
      <div 
        className="modal-section-title cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="modal-icon" />}
          <h3>{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      {isOpen && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

// Parse room description into structured sections
const parseRoomDescription = (description) => {
  // Remove any leading/trailing whitespace and split by paragraph
  const paragraphs = description.trim().split('</p>').map(p => p.replace('<p>', '').trim()).filter(Boolean);
  
  // Group paragraphs by category
  const sections = {};
  let currentCategory = 'General';

  paragraphs.forEach(para => {
    // Check if paragraph starts with a bold category
    const categoryMatch = para.match(/<strong>(.+?)<\/strong>|<b>(.+?)<\/b>/);
    if (categoryMatch) {
      currentCategory = (categoryMatch[1] || categoryMatch[2]).replace(':', '');
      // Remove the category from the paragraph
      para = para.replace(/<strong>.*?<\/strong>|<b>.*?<\/b>/, '').trim();
    }

    // Initialize category if not exists
    if (!sections[currentCategory]) {
      sections[currentCategory] = [];
    }

    // Add paragraph to the current category
    if (para) {
      sections[currentCategory].push(para.replace(/<\/?strong>|<\/?b>/g, ''));
    }
  });

  return sections;
};

const HotelModal = () => {
  const dispatch = useDispatch();
  const { selectedHotel, isModalOpen } = useSelector((state) => state.hotels);

  if (!isModalOpen || !selectedHotel) return null;

  // Destructure nested data
  const hotelData = selectedHotel?.data;
  const staticContent = hotelData?.staticContent?.[0] || {};
  const hotelItems = hotelData?.items?.[0] || {};
  const roomDetails = hotelItems?.selectedRoomsAndRates?.[0] || {};
  const rateDetails = roomDetails?.rate || {};
  const roomInfo = roomDetails?.room || {};

  // Helper functions to extract data safely
  const getHotelName = () => staticContent?.name || 'Hotel Name Unavailable';
  const getImageUrl = () => staticContent?.heroImage || '/api/placeholder/800/400';
  const getStarCount = () => parseInt(staticContent?.starRating) || 0;
  const getAddress = () => {
    const contact = staticContent?.contact?.address;
    return contact 
      ? [contact.line1, contact.line2, contact.city?.name].filter(Boolean).join(', ') 
      : 'Address Not Available';
  };

  // Extract room details
  const getRooms = () => {
    return [{
      room_type: roomInfo?.name || 'Room',
      no_of_adults: roomDetails?.occupancy?.adults || 0,
      no_of_children: roomDetails?.occupancy?.children || 0,
      no_of_rooms: 1,
      description: roomInfo?.description || ''
    }];
  };

  // Extract check-in/out times
  const getCheckTimes = () => {
    const checkInPolicy = staticContent?.checkinInfo || {};
    const checkOutPolicy = staticContent?.checkoutInfo || {};
    
    return {
      checkIn: checkInPolicy.beginTime || 'Not specified',
      checkOut: checkOutPolicy.time || 'Not specified'
    };
  };

  // Check refundability
  const isRefundable = () => {
    return rateDetails?.refundable === true;
  };

  // Extract facilities
  const getFacilities = () => {
    const allFacilities = roomInfo?.facilities || [];
    return allFacilities.map(facility => facility.name).filter(Boolean);
  };

  // Extract policies
  const getPolicies = () => {
    return rateDetails?.policies || [];
  };

  // Extract rate includes
  const getRateIncludes = () => {
    return rateDetails?.includes || [];
  };

  const { checkIn, checkOut } = getCheckTimes();

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
            src={getImageUrl()}
            alt={getHotelName()}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Scrollable Content */}
        <div className="modal-content">
          {/* Header */}
          <div className="modal-section">
            <h2 className="text-xl font-bold mb-4 modal-text-base">{getHotelName()}</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-yellow-400">
                {[...Array(getStarCount())].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="modal-icon" />
                <span className="modal-text-secondary">{getAddress()}</span>
              </div>
            </div>
          </div>

          {/* Room Types */}
          {getRooms().length > 0 && (
            <Collapsible title="Room Types" icon={Bed}>
              <div className="modal-grid-2">
                {getRooms().map((room, index) => {
                  // Parse room description
                  const roomSections = room.description 
                    ? parseRoomDescription(room.description) 
                    : {};

                  return (
                    <div key={index} className="modal-card">
                      <h4 className="modal-text-strong mb-2">{room.room_type}</h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
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
                      </div>

                      {/* Detailed Room Description */}
                      {Object.entries(roomSections).map(([category, details]) => (
                        <div key={category} className="mb-3">
                          <h5 className="modal-text-strong text-sm mb-1">{category}</h5>
                          <ul className="list-disc list-inside text-sm modal-text-secondary">
                            {details.map((detail, idx) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Collapsible>
          )}

          {/* Check Times */}
          <Collapsible title="Check-in/Check-out Times" icon={Clock}>
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
          </Collapsible>

          {/* Refund Status */}
          <Collapsible title="Refund Status">
            <div className={isRefundable() ? 'modal-status-success' : 'modal-status-error'}>
              {isRefundable() ? 'Refundable' : 'Non-Refundable'}
            </div>
          </Collapsible>

          {/* Rate Includes */}
          {getRateIncludes().length > 0 && (
            <Collapsible title="Rate Includes" icon={Check}>
              <div className="modal-grid-3">
                {getRateIncludes().map((include, index) => (
                  <div key={index} className="modal-info-box">
                    <span className="modal-text-secondary">{include}</span>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* Facilities */}
          {getFacilities().length > 0 && (
            <Collapsible title="Room Facilities" icon={Check}>
              <div className="modal-grid-3">
                {getFacilities().map((facility, index) => (
                  <div key={index} className="modal-info-box">
                    <span className="modal-text-secondary">{facility}</span>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* Policies */}
          {getPolicies().length > 0 && (
            <Collapsible title="Hotel Policies" icon={Check}>
              <div className="space-y-2">
                {getPolicies().map((policy, index) => (
                  <div key={index} className="modal-card">
                    <h4 className="modal-text-strong mb-2">{policy.type}</h4>
                    <p className="modal-text-secondary" 
                       dangerouslySetInnerHTML={{ __html: policy.text || 'No details available' }}
                    />
                  </div>
                ))}
              </div>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelModal;