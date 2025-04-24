import axios from 'axios';
import { AlertTriangle, CheckCircle, Loader2, X, Bed, Users, Coffee, Info } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setError, setLoading, setRoomLoading } from '../../redux/slices/roomChangeSlice';

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-full bg-gray-200 rounded mt-3"></div>
        </div>
      ))}
    </div>
  </div>
);

const RoomChangeModal = ({
  hotel,
  hotelId,
  traceId,
  onClose,
  itineraryToken,
  inquiryToken,
  city,
  date,
  dates,
  existingPrice
}) => {
  const dispatch = useDispatch();
  const { isLoading, isRoomLoading, error } = useSelector(state => state.roomChange);

  // States
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [bookingStatus, setBookingStatus] = useState({
    success: false,
    message: null
  });

  // Room data helper
  const roomRateData = hotelDetails?.data?.results?.[0]?.data?.[0]?.roomRate?.[0];

  // Fetch room recommendations
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelId}/rooms`,
          {
            params: {
              traceId,
              cityName: city,
              checkIn: date,
            },
            headers: {
              "X-Inquiry-Token": inquiryToken,
            },
          }
        );
        setHotelDetails(response.data);
        dispatch(setRoomLoading(false));
      } catch (error) {
        console.error("Error fetching room details:", error);
        dispatch(setError(error.message));
      }
    };

    if (hotelId && traceId) {
      fetchRoomDetails();
    }
  }, [hotelId, traceId, inquiryToken, city, date, dispatch]);

  // Helper functions
  const getRateDetails = (rateId) => roomRateData?.rates?.[rateId];

  const getRoomDetailsFromOccupancy = (occupancy) => {
    if (!occupancy || !roomRateData?.rooms) return null;

    const room = roomRateData.rooms[occupancy.roomId];
    if (!room) return null;

    return {
      ...room,
      occupancyDetails: {
        adults: occupancy.numOfAdults,
        children: occupancy.numOfChildren || 0,
        childAges: occupancy.childAges || [],
      },
    };
  };

  const calculateTotalPrice = (recommendation) => {
    if (!recommendation?.rates) return 0;
    return recommendation.rates.reduce((total, rateId) => {
      const rate = getRateDetails(rateId);
      return total + (rate?.finalRate || 0);
    }, 0);
  };

  const getGroupedRecommendations = () => {
    if (!roomRateData?.recommendations) return {};

    return Object.entries(roomRateData.recommendations).reduce(
      (acc, [recKey, rec]) => {
        if (!rec?.rates) return acc;

        const groupId = rec.groupId;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push({ ...rec, id: recKey });
        return acc;
      },
      {}
    );
  };

  // Handle room change confirmation
  const handleConfirm = async () => {
    if (!selectedRecommendation || !roomRateData) return;

    dispatch(setLoading(true));
    setBookingStatus({
      success: false,
      message: null
    });

    try {
      // Prepare room allocations
      const selectedRates = selectedRecommendation.rates
        .map((rateId) => roomRateData.rates[rateId])
        .filter(Boolean);

      const roomsAndRateAllocations = selectedRates.map((rate) => ({
        rateId: rate.id,
        roomId: rate.occupancies[0].roomId,
        occupancy: {
          adults: rate.occupancies[0].numOfAdults,
          ...(rate.occupancies[0].numOfChildren > 0 && {
            childAges: rate.occupancies[0].childAges,
          }),
        },
      }));

      // Select room rates
      const selectRoomResponse = await axios.post(
        `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelId}/select-room`,
        {
          roomsAndRateAllocations,
          recommendationId: selectedRecommendation.id,
          items: hotelDetails?.data?.results?.[0]?.items,
          itineraryCode: hotelDetails?.data?.results?.[0]?.itinerary?.code,
          traceId: hotelDetails?.data?.results?.[0]?.traceId,
          inquiryToken,
          cityName: city,
          date,
        },
        {
          headers: {
            "X-Inquiry-Token": inquiryToken,
          },
        }
      );

      // Update itinerary with new room
      const response = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/room`,
        {
            cityName: city,
            date: date,
            newHotelDetails: {
              ...selectRoomResponse.data.data,
              checkIn: selectRoomResponse.data.data.searchRequestLog.checkIn,
              checkOut: selectRoomResponse.data.data.searchRequestLog.checkOut
            }
          },
          {
            headers: {
              "X-Inquiry-Token": inquiryToken,
            },
          }
        );

      if (response.data.success) {
        setBookingStatus({
          success: true,
          message: "Room updated successfully"
        });

        // Close modal and reload page to show updated itinerary
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error changing room:", error);
      dispatch(setError(error.response?.data?.message || "Failed to change room"));
    }
  };

  // UI helper functions
  const toggleSection = (groupId) => {
    setExpandedSections(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const renderRecommendationDetails = (recommendation) => {
    if (!recommendation?.rates) return null;

    const rates = recommendation.rates.map((rateId) => getRateDetails(rateId));
    const totalPrice = calculateTotalPrice(recommendation);
    const firstRate = rates[0];

    return (
      <div className="space-y-3 overflow-hidden">
        {rates.map((rate, index) => {
          if (!rate?.occupancies) return null;
          return rate.occupancies.map((occupancy, occIndex) => {
            const room = getRoomDetailsFromOccupancy(occupancy);
            if (!room) return null;
            return (
              <div key={`${index}-${occIndex}`} className="pb-3 border-b last:border-b-0">
                <div className="flex items-start gap-2">
                  <Bed className="h-5 w-5 text-[#093923] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium break-words text-[#093923]">{room.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1 text-[#13804e]" />
                        <span>Adults: {occupancy.numOfAdults}</span>
                      </div>
                      {occupancy.numOfChildren > 0 && (
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1 text-[#13804e]" />
                          <span>
                            Children: {occupancy.numOfChildren}
                            {occupancy.childAges?.length > 0 && ` (Ages: ${occupancy.childAges.join(", ")})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })}

        {firstRate && (
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Info className="h-4 w-4 mr-1 text-[#13804e]" />
                <span>{firstRate.refundable ? "Refundable" : "Non-refundable"}</span>
              </div>
              {firstRate.boardBasis?.description && (
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Coffee className="h-4 w-4 mr-1 text-[#13804e]" />
                  <span className="break-words">{firstRate.boardBasis.description}</span>
                </div>
              )}
            </div>
            {existingPrice && (
              <div className="text-right">
                {existingPrice === totalPrice ? (
                  <span className="text-sm font-medium text-gray-600">Same price</span>
                ) : existingPrice > totalPrice ? (
                  <span className="text-sm font-medium text-[#093923]">
                    INR {Math.abs(existingPrice - totalPrice).toLocaleString()} less
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-600">
                    INR {Math.abs(existingPrice - totalPrice).toLocaleString()} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRoomTypeSection = (groupId, recommendations) => {
    const standardRoom = roomRateData?.standardizedRooms?.[groupId];
    if (!standardRoom) return null;

    const isExpanded = expandedSections[groupId];
    const hasImage = standardRoom.images?.[0]?.links;
    const imageUrl = hasImage 
      ? standardRoom.images[0].links.find(l => l.size === "Standard")?.url || "/api/placeholder/96/96" 
      : "/api/placeholder/96/96";

    return (
      <div key={groupId} className="mb-3 sm:mb-4">
        <div
          onClick={() => toggleSection(groupId)}
          className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200 hover:border-[#093923]/30'}`}
        >
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <img
              src={imageUrl}
              alt={standardRoom.name}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/api/placeholder/96/96";
              }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-[#093923] truncate">
                {standardRoom.name}
              </h3>
              {standardRoom.type && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">{standardRoom.type}</p>
              )}
            </div>
          </div>
          <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-600 mr-2 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
              {recommendations.length} option{recommendations.length !== 1 ? "s" : ""}
            </div>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? "transform rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec)}
                className={`cursor-pointer p-3 sm:p-4 rounded-lg ${selectedRecommendation?.id === rec.id
                  ? 'bg-[#093923]/10 border-2 border-[#093923]'
                  : 'bg-white border border-gray-100 hover:border-[#093923]/30'} transition-all duration-200 shadow-sm`}
              >
                {renderRecommendationDetails(rec)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-16 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#093923] text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Change Room</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#13804e] rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isRoomLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-4">
              {/* Price Alert section removed - now shown in footer */}

              {/* Room Types */}
              {hotelDetails ? (
                <div className="space-y-3 sm:space-y-4">
                  {Object.entries(getGroupedRecommendations()).map(([groupId, recs]) => 
                    renderRoomTypeSection(groupId, recs)
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  No room options available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <div className="flex justify-between items-center">
            {/* Price Difference Alert in Footer */}
            <div className="flex-1">
              {existingPrice && selectedRecommendation && (
                <div className="flex items-center">
                  <div className={`mr-2 ${
                    existingPrice === calculateTotalPrice(selectedRecommendation)
                      ? "text-gray-500"
                      : existingPrice > calculateTotalPrice(selectedRecommendation) 
                        ? "text-[#093923]" 
                        : "text-red-500"
                  }`}>
                    {existingPrice === calculateTotalPrice(selectedRecommendation) ? (
                      <Info className="h-5 w-5" />
                    ) : existingPrice > calculateTotalPrice(selectedRecommendation) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    {existingPrice === calculateTotalPrice(selectedRecommendation) ? (
                      <span className="font-medium text-gray-600">Same price</span>
                    ) : existingPrice > calculateTotalPrice(selectedRecommendation) ? (
                      <span className="font-medium text-[#093923]">
                        INR {Math.abs(existingPrice - calculateTotalPrice(selectedRecommendation)).toLocaleString()} less
                      </span>
                    ) : (
                      <span className="font-medium text-red-600">
                        INR {Math.abs(existingPrice - calculateTotalPrice(selectedRecommendation)).toLocaleString()} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="relative group overflow-hidden px-4 py-2 border border-[#093923] rounded-lg text-[#093923] font-medium"
                disabled={isLoading}
              >
                <span className="relative z-10 group-hover:text-white">Cancel</span>
                <div className="absolute inset-0 bg-[#093923] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedRecommendation || isLoading}
                className={`relative group overflow-hidden px-4 py-2 rounded-lg text-white font-medium ${
                  !selectedRecommendation || isLoading
                  ? "bg-[#093923]/40 cursor-not-allowed"
                  : "bg-[#093923]"
                }`}
              >
                {!isLoading && selectedRecommendation && (
                  <div className="absolute inset-0 bg-[#13804e] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
                )}
                <span className="relative z-10">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </div>
                  ) : (
                    "Select Room"
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages - Error and Success */}
        {error && (
          <div className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-50 shadow-lg animate-fadeIn">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {bookingStatus.success && (
          <div className="fixed bottom-4 left-4 right-4 bg-[#093923]/10 border border-[#093923]/20 rounded-lg p-4 z-50 shadow-lg animate-fadeIn">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-[#093923] mr-2" />
              <p className="text-[#093923]">{bookingStatus.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomChangeModal;