import { Baby, Bed, Check, Clock, MapPin, Star, Users, X } from 'lucide-react';
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../redux/slices/hotelSlice";
import * as HotelUtils from '../../utils/hotelUtils';

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

        {/* Hero Image */}
        <div className="flex-shrink-0">
          <div className="relative h-72 w-full rounded-t-xl overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={hotelName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold mb-4">{hotelName}</h2>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center text-yellow-400">
                  {[...Array(starCount)].map((_, i) => (
                    <Star key={i} size={20} fill="currentColor" />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-blue-500" />
                  <span>{selectedHotel.address}</span>
                </div>
              </div>
            </div>

            {/* Room Types */}
            {rateDetails?.rooms && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Bed size={18} className="text-blue-500" />
                  Room Types
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {HotelUtils.getRooms(selectedHotel).map((room, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm">{room.room_type}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-blue-500" />
                          <span>Adults: {room.no_of_adults}</span>
                        </div>
                        {room.no_of_children > 0 && (
                          <div className="flex items-center gap-2">
                            <Baby size={16} className="text-blue-500" />
                            <span>Children: {room.no_of_children}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Bed size={16} className="text-blue-500" />
                          <span>Rooms: {room.no_of_rooms}</span>
                        </div>
                      </div>
                      {room.description && (
                        <p className="text-sm text-gray-600">{room.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {hotelDescription && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-2">Description</h3>
                <div
                  className="prose max-w-none text-sm text-gray-600"
                  dangerouslySetInnerHTML={{
                    __html: hotelDescription,
                  }}
                />
              </div>
            )}

            {/* Rate Information */}
            {rateDetails && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-3">Rate Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Price and Boarding */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-lg font-medium text-blue-700 mb-1">
                      {rateDetails.currency} {rateDetails.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {rateDetails.boarding_details.join(", ")}
                    </p>
                  </div>

                  {/* Check-in/Check-out Times */}
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-blue-500" />
                      <span>Check-in: {checkIn}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-blue-500" />
                      <span>Check-out: {checkOut}</span>
                    </div>
                  </div>
                </div>

                {/* Cancellation Policy */}
                {rateDetails.cancellation_policy && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Cancellation Policy</h4>
                    <p className={!HotelUtils.isRefundable(selectedHotel) ? 
                      "text-red-600 font-medium text-sm" : 
                      "text-green-600 font-medium text-sm"
                    }>
                      {!HotelUtils.isRefundable(selectedHotel)
                        ? "Non-refundable"
                        : "Refundable"}
                    </p>
                    {rateDetails.cancellation_policy.cancel_by_date && (
                      <p className="text-sm text-gray-600 mt-2">
                        Cancel by:{" "}
                        {new Date(
                          rateDetails.cancellation_policy.cancel_by_date
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Facilities */}
            {selectedHotel.hotel_details?.facilities && (
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Check size={18} className="text-blue-500" />
                  Facilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {HotelUtils.formatFacilities(selectedHotel.hotel_details.facilities).map(
                    (facility, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg"
                      >
                        <span className="text-blue-500">•</span>
                        <span className="text-sm text-gray-600">{facility}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelModal;