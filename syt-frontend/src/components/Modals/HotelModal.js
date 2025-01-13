import {
  Baby, Bed,
  Calendar,
  Check, ChevronDown, ChevronUp,
  Info,
  MapPin,
  MoreHorizontal,
  Shield,
  Star, Users, X
} from 'lucide-react';
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../redux/slices/hotelSlice";
import './Modal.css';

// Image Collage Component
const ImageCollage = ({ images }) => {
  const [visibleImageCount, setVisibleImageCount] = useState(5);
  const [isFullGalleryMode, setIsFullGalleryMode] = useState(false);

  // If no images, return placeholder
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[400px]">
        <img 
          src="/api/placeholder/1200/600" 
          alt="Hotel Placeholder" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Determine which images to show
  const processedImages = images
    .map(img => ({
      url: img.links.find(l => l.size === 'Standard')?.url || img.links[0].url,
      caption: img.caption || 'Hotel Image'
    }))
    .filter(img => img.url);

  // Slice images based on visibility and mode
  const imagesToShow = isFullGalleryMode 
    ? processedImages.slice(0, visibleImageCount)
    : processedImages.slice(0, 5);

  // Handle view more
  const handleViewMore = () => {
    if (isFullGalleryMode) {
      setVisibleImageCount(prevCount => prevCount + 10);
    } else {
      setIsFullGalleryMode(true);
      setVisibleImageCount(10);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {imagesToShow.map((img, index) => {
          // Special styling for the first image and last image with view more
          const isFirstImage = index === 0;
          const isLastImage = index === imagesToShow.length - 1;
          const hasMoreImages = processedImages.length > imagesToShow.length;
          
          return (
            <div 
              key={index} 
              className={`
                relative overflow-hidden
                ${isFirstImage ? 'col-span-2 row-span-2' : 'aspect-square'}
                ${isLastImage && hasMoreImages ? 'cursor-pointer' : ''}
              `}
            >
              <img 
                src={img.url} 
                alt={img.caption} 
                className="w-full h-full object-cover"
              />
              {isLastImage && hasMoreImages && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                  onClick={handleViewMore}
                >
                  <div className="flex items-center gap-2 text-white">
                    <MoreHorizontal />
                    <span>View More ({processedImages.length - imagesToShow.length})</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Collapsible Component
const Collapsible = ({ title, children, icon: Icon, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b last:border-b-0">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-primary-main" />}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
};

const HotelModal = () => {
  const dispatch = useDispatch();
  const { selectedHotel, isModalOpen } = useSelector((state) => state.hotels);

  if (!isModalOpen || !selectedHotel) return null;

  // Destructure nested data
  const hotelData = selectedHotel?.data;
  const staticContent = hotelData?.staticContent?.[0] || {};
  const hotelItems = hotelData?.items?.[0] || {};
  const roomDetails = hotelItems?.selectedRoomsAndRates || [];
  const hotelDetails = hotelData?.hotelDetails || {};
  const images = staticContent?.images || [];

  // Helper functions
  const getHotelName = () => hotelDetails?.name || 'Hotel Name Unavailable';
  const getStarCount = () => parseInt(hotelDetails?.starRating) || 0;
  const getAddress = () => {
    const address = hotelDetails?.address;
    return address 
      ? [address.line1, address.city?.name, address.country?.name].filter(Boolean).join(', ') 
      : 'Address Not Available';
  };

  // Compile all hotel amenities
  const getAllFacilities = () => {
    const staticFacilities = staticContent?.facilities || [];
    return staticFacilities.map(facility => facility.name).filter(Boolean);
  };

  // Compile all hotel descriptions
  const getDescriptions = () => {
    const descriptions = staticContent?.descriptions || [];
    return descriptions.reduce((acc, desc) => {
      if (desc.type && desc.text) {
        acc[desc.type] = desc.text;
      }
      return acc;
    }, {});
  };

  // Compile cancelation policies
  const getCancellationPolicies = () => {
    const policies = [];
    roomDetails.forEach(room => {
      const roomPolicies = room?.rate?.cancellationPolicies || [];
      policies.push(...roomPolicies);
    });
    return policies;
  };

  // Compile room details
  const getRoomDetails = () => {
    return roomDetails.map(room => ({
      name: room.room?.name || 'Room',
      description: room.room?.description || '',
      occupancy: room.occupancy,
      rate: room.rate
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Close Button */}
        <button 
          onClick={() => dispatch(closeModal())}
          className="modal-close-btn"
        >
          <X size={24} />
        </button>

        {/* Entire Content Scrollable */}
        <div className="w-full h-full overflow-y-auto">
          {/* Image Collage */}
          <ImageCollage images={images} />

          {/* Hotel Header */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold mb-2">{getHotelName()}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-yellow-400">
                {[...Array(getStarCount())].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary-main" />
                <span className="text-gray-600">{getAddress()}</span>
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <Collapsible title="About the Hotel" icon={Info}>
            {Object.entries(getDescriptions()).map(([type, text]) => (
              <div key={type} className="mb-4">
                <h4 className="font-semibold mb-2 capitalize">{type.replace('_', ' ')}</h4>
                <p className="text-gray-600">{text}</p>
              </div>
            ))}
          </Collapsible>

          {/* Room Details */}
          <Collapsible title="Room Types" icon={Bed}>
            {getRoomDetails().map((room, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-3">{room.name}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-primary-main" />
                    <span>Adults: {room.occupancy?.adults || 0}</span>
                  </div>
                  {room.occupancy?.childAges && room.occupancy.childAges.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Baby size={16} className="text-primary-main" />
                      <span>Children: {room.occupancy.childAges.length} (Ages: {room.occupancy.childAges.join(', ')})</span>
                    </div>
                  )}
                </div>
                {room.description && (
                  <p className="text-gray-600 mb-3">{room.description}</p>
                )}
                {room.rate?.boardBasis && (
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={16} className="text-primary-main" />
                    <span>Meal Plan: {room.rate.boardBasis.description}</span>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Price: {room.rate?.baseRate} {room.rate?.currency}
                </div>
              </div>
            ))}
          </Collapsible>

          {/* Cancellation Policies */}
          <Collapsible title="Cancellation Policies" icon={Calendar}>
            {getCancellationPolicies().map((policy, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-600 mb-2">{policy.text}</p>
                {policy.rules?.map((rule, ruleIndex) => (
                  <div key={ruleIndex} className="mb-2">
                    <div className="flex justify-between">
                      <span>Period Start: {new Date(rule.start).toLocaleString()}</span>
                      <span>Period End: {new Date(rule.end).toLocaleString()}</span>
                    </div>
                    <div className="text-sm">
                      Cancellation Value: {rule.value} {rule.valueType}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </Collapsible>

          {/* Facilities */}
          <Collapsible title="Hotel Facilities" icon={Check}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getAllFacilities().map((facility, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-600">
                  <Check size={16} className="text-primary-main" />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </Collapsible>

          {/* Safety & Policies */}
          <Collapsible title="Safety & Policies" icon={Shield} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Check-in/Check-out</h4>
                <p className="text-gray-600">
                  Check-in: From {hotelData?.searchRequestLog?.checkIn || 'Not specified'}
                  <br />
                  Check-out: Until {hotelData?.searchRequestLog?.checkOut || 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Additional Information</h4>
                <ul className="list-disc list-inside text-gray-600">
                  <li>PAN Card Mandatory: {hotelData?.isPanMandatoryForBooking ? 'Yes' : 'No'}</li>
                  <li>Passport Mandatory: {hotelData?.isPassportMandatoryForBooking ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            </div>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default HotelModal;