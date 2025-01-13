import axios from 'axios';
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setError, setLoading, setRoomLoading } from '../../redux/slices/roomChangeSlice';

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
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
      <div className="space-y-3">
        {rates.map((rate, index) => {
          if (!rate?.occupancies) return null;

          return rate.occupancies.map((occupancy, occIndex) => {
            const room = getRoomDetailsFromOccupancy(occupancy);
            if (!room) return null;

            return (
              <div key={`${index}-${occIndex}`} className="border-b pb-3 last:border-b-0">
                <p className="font-medium">{room.name}</p>
                <div className="text-xs sm:text-sm text-gray-600">
                  <p>Adults: {occupancy.numOfAdults}</p>
                  {occupancy.numOfChildren > 0 && (
                    <p>
                      Children: {occupancy.numOfChildren}
                      {occupancy.childAges?.length > 0 &&
                        ` (Ages: ${occupancy.childAges.join(", ")})`}
                    </p>
                  )}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-gray-600">
                  <p>{rate.refundable ? "Refundable" : "Non-refundable"}</p>
                  {rate.boardBasis?.description && (
                    <p>{rate.boardBasis.description}</p>
                  )}
                </div>
              </div>
            );
          });
        })}
        <div className="text-right font-semibold text-base sm:text-lg text-blue-600">
          {firstRate?.currency || "USD"} {totalPrice.toLocaleString()}
        </div>
      </div>
    );
  };

  const renderRoomTypeSection = (groupId, recommendations) => {
    const standardRoom = roomRateData?.standardizedRooms?.[groupId];
    if (!standardRoom) return null;

    const isExpanded = expandedSections[groupId];

    return (
      <div key={groupId} className="mb-3 sm:mb-4">
        <div
          onClick={() => toggleSection(groupId)}
          className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition-all duration-200"
        >
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {standardRoom.name}
            </h3>
            {standardRoom.type && (
              <p className="text-xs sm:text-sm text-gray-600 truncate">{standardRoom.type}</p>
            )}
          </div>
          <div className="flex items-center ml-2 sm:ml-4">
            <div className="text-xs sm:text-sm text-gray-600 mr-2">
              {recommendations.length} option{recommendations.length !== 1 ? "s" : ""}
            </div>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 ${
                isExpanded ? "transform rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-2 pl-2 md:pl-20">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec)}
                className={`cursor-pointer p-3 sm:p-4 rounded-lg ${
                  selectedRecommendation?.id === rec.id
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-white border border-gray-100 hover:border-blue-200"
                } transition-all duration-200 shadow-sm`}
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center pt-10">
    <div className="bg-white w-full md:rounded-lg h-full md:h-auto md:w-[90%] md:max-w-5xl md:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Change Room</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
              {/* Price Alert */}
              {existingPrice && selectedRecommendation && (
                <div className={`rounded-lg p-4 ${
                  existingPrice > calculateTotalPrice(selectedRecommendation) 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-yellow-50 border border-yellow-200"
                }`}>
                  <h5 className="text-sm sm:text-base font-medium mb-1">Price Difference Alert</h5>
                  <div className="text-xs sm:text-sm">
                    The new price is {
                      existingPrice > calculateTotalPrice(selectedRecommendation) 
                        ? "lower" 
                        : "higher"
                    } than your current room price.
                    <div className="mt-1">
                      Current: INR {existingPrice.toLocaleString()}
                      {selectedRecommendation && 
                        ` → New: INR ${calculateTotalPrice(selectedRecommendation).toLocaleString()}`
                      }
                    </div>
                  </div>
                </div>
              )}

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
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedRecommendation || isLoading}
              className={`px-4 py-2 rounded-lg text-white ${
                !selectedRecommendation || isLoading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Processing...
              </div>
            ) : (
              "Select Room"
            )}
          </button>
        </div>
      </div>

      {/* Messages - Error and Success */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-50">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {bookingStatus.success && (
        <div className="fixed bottom-4 left-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 z-50">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <p className="text-green-700">{bookingStatus.message}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default RoomChangeModal;