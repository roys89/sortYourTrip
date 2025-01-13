import axios from "axios";
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

const HotelDetailModal = ({
  hotel,
  traceId,
  onClose,
  isLoading,
  itineraryToken,
  inquiryToken,
  city,
  date,
  dates,
  existingHotelPrice
}) => {
  const navigate = useNavigate();
  
  // All state declarations consolidated at the top
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [expandedSections, setExpandedSections] = useState({});  // Only declared once
  const [bookingStatus, setBookingStatus] = useState({
    loading: false,
    success: false,
    error: null,
    message: null,
    partialSuccess: false
  });

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotel.id}/details`,
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
        setDetailsLoading(false);
      } catch (error) {
        console.error("Error fetching hotel details:", error);
        setDetailsError(error.message);
        setDetailsLoading(false);
      }
    };

    if (hotel && traceId) {
      fetchHotelDetails();
    }
  }, [hotel, traceId, inquiryToken, city, date]);

  // Get room rate data
  const roomRateData = hotelDetails?.data?.results?.[0]?.data?.[0]?.roomRate?.[0];

  const handleConfirm = async () => {
    if (!selectedRecommendation || !roomRateData) return;

    setBookingStatus({
      loading: true,
      success: false,
      error: null,
      message: null,
      partialSuccess: false
    });

    try {
      // Prepare room and rate allocations
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

      const requestData = {
        roomsAndRateAllocations,
        recommendationId: selectedRecommendation.id,
        items: hotelDetails?.data?.results?.[0]?.items,
        itineraryCode: hotelDetails?.data?.results?.[0]?.itinerary.code,
        traceId,
        inquiryToken,
        cityName: city,
        date,
      };

      // Select room
      const selectRoomResponse = await axios.post(
        `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotel.id}/select-room`,
        requestData,
        {
          headers: {
            "X-Inquiry-Token": inquiryToken,
          },
        }
      );

      // Prepare hotel replacement request
      const replaceHotelRequest = {
        cityName: city,
        date,
        newHotelDetails: {
          ...selectRoomResponse.data.data,
          checkIn: date,
          checkOut: dates.checkOut,
          staticContent: [{
            id: selectRoomResponse.data.data.staticContent?.[0]?.id,
            name: selectRoomResponse.data.data.staticContent?.[0]?.name,
            descriptions: selectRoomResponse.data.data.staticContent?.[0]?.descriptions,
            contact: selectRoomResponse.data.data.staticContent?.[0]?.contact,
            images: selectRoomResponse.data.data.staticContent?.[0]?.images,
            facilities: selectRoomResponse.data.data.staticContent?.[0]?.facilities,
          }],
          hotelDetails: {
            name: selectRoomResponse.data.data.hotelDetails?.name,
            starRating: selectRoomResponse.data.data.hotelDetails?.starRating,
            reviews: selectRoomResponse.data.data.hotelDetails?.reviews,
            geolocation: selectRoomResponse.data.data.hotelDetails?.geolocation || selectRoomResponse.data.data.hotelDetails?.geoCode,
            address: selectRoomResponse.data.data.hotelDetails?.address
          }
        }
      };

      // Replace hotel in itinerary
      const replaceHotelResponse = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`,
        replaceHotelRequest,
        {
          headers: {
            "X-Inquiry-Token": inquiryToken,
          },
        }
      );

      if (replaceHotelResponse.data.success) {
        setBookingStatus({
          loading: false,
          success: true,
          error: null,
          message: replaceHotelResponse.data.message,
          partialSuccess: replaceHotelResponse.data.partialSuccess
        });

        if (replaceHotelResponse.data.transferUpdateFailed) {
          alert('Hotel updated successfully, but transfers could not be updated automatically. Please check and update transfers manually if needed.');
        }

        navigate("/itinerary", {
          state: {
            itineraryInquiryToken: inquiryToken,
          },
        });
      } else {
        setBookingStatus({
          loading: false,
          success: false,
          error: true,
          message: replaceHotelResponse.data.message || "Failed to update itinerary"
        });
      }
    } catch (error) {
      console.error("Error selecting room:", error);
      setBookingStatus({
        loading: false,
        success: false,
        error: true,
        message: error.response?.data?.message || "Failed to book hotel. Please try again."
      });
    }
  };

  // Group recommendations by standardized room type
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
    const hasImage = standardRoom.images?.[0]?.links;
    const imageUrl = imageErrorMap[groupId] 
      ? "/api/placeholder/96/96"
      : (hasImage ? standardRoom.images[0].links.find((l) => l.size === "Standard")?.url : "/api/placeholder/96/96");
  
    return (
      <div key={groupId} className="mb-3 sm:mb-4">
        <div
          onClick={() => toggleSection(groupId)}
          className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition-all duration-200"
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img
              src={imageUrl}
              alt={standardRoom.name}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
              onError={() => {
                if (!imageErrorMap[groupId]) {
                  setImageErrorMap(prev => ({
                    ...prev,
                    [groupId]: true
                  }));
                }
              }}
            />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {standardRoom.name}
              </h3>
              {standardRoom.type && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">{standardRoom.type}</p>
              )}
            </div>
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

  const renderStarRating = () => {
    const rating = hotel.starRating || hotel.category;
    if (!rating) return null;

    const numRating = Math.min(Math.max(0, parseInt(rating, 10) || 0), 5);

    return (
      <div className="flex items-center mb-2">
        {Array.from({ length: numRating }, (_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
      </div>
    );
  };

  // Render action buttons based on booking status
  const renderActionButtons = () => {
    // Loading state
    if (bookingStatus.loading) {
      return (
        <button
          disabled
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg flex items-center justify-center"
        >
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Processing Booking...
        </button>
      );
    }

    // Success state
    if (bookingStatus.success) {
      return (
        <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
          <div className="flex-grow">
            <p className="text-green-700 font-semibold">Booking Successful</p>
            <p className="text-sm text-green-600">{bookingStatus.message}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Close
          </button>
        </div>
      );
    }

    // Error state
    if (bookingStatus.error) {
      return (
        <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <div className="flex-grow">
            <p className="text-red-700 font-semibold">Booking Failed</p>
            <p className="text-sm text-red-600">{bookingStatus.message}</p>
          </div>
          <button
            onClick={() => setBookingStatus({
              loading: false,
              success: false,
              error: null,
              message: null,
              partialSuccess: false
            })}
            className="ml-auto px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    // Default state
    return (
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedRecommendation || bookingStatus.loading}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white ${
            !selectedRecommendation || bookingStatus.loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {bookingStatus.loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </div>
          ) : (
            "Select Rooms"
          )}
        </button>
      </div>
    );
  };

  // Loading state
  if (detailsLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  // Error state
  if (detailsError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-red-500">Failed to load hotel details: {detailsError}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const groupedRecommendations = getGroupedRecommendations();

  // Get image URL with fallback
  const imageUrl = hotel.images?.[0]?.links?.find((link) => link.size === "Standard")?.url 
    || hotel.heroImage 
    || "/api/placeholder/800/400";

  // Main render
return (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center pt-10">
    <div className="bg-white w-full md:rounded-lg h-full md:h-auto md:w-[90%] md:max-w-5xl md:max-h-[85vh] overflow-y-auto">
      {/* Header - Made sticky and more compact on mobile */}
      <div className="sticky top-0 bg-white z-10 p-3 sm:p-4 border-b flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold truncate pr-2">{hotel.name}</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Improved padding and spacing for mobile */}
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Hotel Basic Info - Responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          <div className="w-full">
            <img
              src={imageUrl}
              alt={hotel.name}
              className="w-full h-40 md:h-64 object-cover rounded"
              onError={(e) => {
                if (!imageError) {
                  setImageError(true);
                  e.target.src = "/api/placeholder/400/300";
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-semibold">{hotel.name}</h3>
            {renderStarRating()}
            <div className="text-sm text-gray-600">
              {hotel.descriptions?.map(
                (desc, index) =>
                  desc.type === "location" && (
                    <p key={index}>{desc.text}</p>
                  )
              )}
            </div>
          </div>
        </div>

        {/* Price Alert - More compact on mobile */}
        {existingHotelPrice && (
          <Alert className={`${existingHotelPrice > calculateTotalPrice(selectedRecommendation) ? "bg-green-50" : "bg-yellow-50"} p-3 sm:p-4`}>
            <AlertTitle className="text-sm sm:text-base">Price Difference Alert</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">
              The new price is {existingHotelPrice > calculateTotalPrice(selectedRecommendation) ? "lower" : "higher"} than your current hotel price.
              <div className="mt-1">
                Current: INR {existingHotelPrice.toLocaleString()}
                {selectedRecommendation && ` → New: INR ${calculateTotalPrice(selectedRecommendation).toLocaleString()}`}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Room Types - Improved mobile layout */}
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(groupedRecommendations).map(([groupId, recs]) => 
            renderRoomTypeSection(groupId, recs)
          )}
        </div>

        {/* Action Buttons - More spacing and bottom margin */}
        <div className="sticky bottom-0 bg-white border-t p-3 sm:p-4 mt-auto mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedRecommendation || bookingStatus.loading}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white ${
                !selectedRecommendation || bookingStatus.loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {bookingStatus.loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : (
                "Select Rooms"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default HotelDetailModal;