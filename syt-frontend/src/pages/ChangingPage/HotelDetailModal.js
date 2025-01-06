import axios from "axios";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HotelDetailModal = ({
  hotel,
  traceId,
  onClose,
  onAddHotel,
  isLoading,
  itineraryToken,
  inquiryToken,
  city,
  date,
  dates,
  existingHotelPrice,
}) => {
  const navigate = useNavigate();
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState(null);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [bookingStatus, setBookingStatus] = useState({
    loading: false,
    success: false,
    error: null,
    message: null,
  });

  // Fetch hotel details
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

  // Get roomRate data from the correct path
  const roomRateData =
    hotelDetails?.data?.results?.[0]?.data?.[0]?.roomRate?.[0];

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
            onClick={() =>
              setBookingStatus({
                loading: false,
                success: false,
                error: null,
                message: null,
              })
            }
            className="ml-auto px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    // Default state
    return (
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedRecommendation}
          className={`px-4 py-2 rounded text-white ${
            !selectedRecommendation
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Select Rooms
        </button>
      </div>
    );
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

  // Get rate details
  const getRateDetails = (rateId) => {
    return roomRateData?.rates?.[rateId];
  };

  // Get room details
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

  // Calculate total price
  const calculateTotalPrice = (recommendation) => {
    if (!recommendation?.rates) return 0;

    return recommendation.rates.reduce((total, rateId) => {
      const rate = getRateDetails(rateId);
      return total + (rate?.finalRate || 0);
    }, 0);
  };

  // Render individual recommendation
  const renderRecommendationDetails = (recommendation) => {
    if (!recommendation?.rates) return null;

    const rates = recommendation.rates.map((rateId) => getRateDetails(rateId));
    const totalPrice = calculateTotalPrice(recommendation);
    const firstRate = rates[0];

    return (
      <div className="space-y-4">
        {rates.map((rate, index) => {
          if (!rate?.occupancies) return null;

          return rate.occupancies.map((occupancy, occIndex) => {
            const room = getRoomDetailsFromOccupancy(occupancy);
            if (!room) return null;

            return (
              <div
                key={`${index}-${occIndex}`}
                className="border-b pb-3 last:border-b-0"
              >
                <p className="font-medium">{room.name}</p>
                <div className="text-sm text-gray-600">
                  <p>Adults: {occupancy.numOfAdults}</p>
                  {occupancy.numOfChildren > 0 && (
                    <p>
                      Children: {occupancy.numOfChildren}
                      {occupancy.childAges?.length > 0 &&
                        ` (Ages: ${occupancy.childAges.join(", ")})`}
                    </p>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{rate.refundable ? "Refundable" : "Non-refundable"}</p>
                  {rate.boardBasis?.description && (
                    <p>{rate.boardBasis.description}</p>
                  )}
                </div>
              </div>
            );
          });
        })}

        <div className="text-right font-semibold text-lg text-blue-600">
          {firstRate?.currency || "USD"} {totalPrice.toLocaleString()}
        </div>
      </div>
    );
  };

  // Manage expanded sections
  const [expandedSections, setExpandedSections] = useState({});

  // Toggle section expansion
  const toggleSection = (groupId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Render room type section
  const renderRoomTypeSection = (groupId, recommendations) => {
    const standardRoom = roomRateData?.standardizedRooms?.[groupId];
    if (!standardRoom) return null;

    const isExpanded = expandedSections[groupId];
    const hasImage = standardRoom.images?.[0]?.links;
    const imageUrl = hasImage
      ? standardRoom.images[0].links.find((l) => l.size === "Standard")?.url
      : "/api/placeholder/96/96";

    return (
      <div key={groupId} className="mb-4">
        <div
          onClick={() => toggleSection(groupId)}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition-all duration-200"
        >
          <div className="flex items-center space-x-4">
            <img
              src={imageUrl}
              alt={standardRoom.name}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = "/api/placeholder/96/96";
              }}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {standardRoom.name}
              </h3>
              {standardRoom.type && (
                <p className="text-sm text-gray-600">{standardRoom.type}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {recommendations.length} option
              {recommendations.length !== 1 ? "s" : ""}
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                isExpanded ? "transform rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-3 pl-20">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec)}
                className={`cursor-pointer p-4 rounded-lg ${
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

  // Safe star rating handling
  const renderStarRating = () => {
    const rating = hotel.starRating || hotel.category;
    if (!rating) return null;

    const numRating = Math.min(Math.max(0, parseInt(rating, 10) || 0), 5);

    return (
      <div className="flex items-center mb-2">
        {Array.from({ length: numRating }, (_, i) => (
          <span key={i} className="text-yellow-400">
            ★
          </span>
        ))}
      </div>
    );
  };

  // Handle booking confirmation
  const handleConfirm = async () => {
    if (!selectedRecommendation || !roomRateData) return;

    // Reset booking status
    setBookingStatus({
      loading: true,
      success: false,
      error: null,
      message: null,
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

      // Update itinerary
      if (selectRoomResponse.data.success) {
        const replaceHotelRequest = {
          cityName: city,
          date,
          newHotelDetails: {
            ...selectRoomResponse.data.data,
            traceId: selectRoomResponse.data.data.traceId || traceId,
            traceIdDetail: selectRoomResponse.data.data.traceIdDetail || {},
            code: selectRoomResponse.data.data.code || "",
            totalAmount: selectRoomResponse.data.data.totalAmount || 0,
            items: selectRoomResponse.data.data.items || [],
            isPanMandatoryForBooking: selectRoomResponse.data.data.isPanMandatoryForBooking || false,
            isPassportMandatoryForBooking: selectRoomResponse.data.data.isPassportMandatoryForBooking || false,
            checkIn: date, // Use the same date to match example
            checkOut: dates.checkOut // Use the dates from props
          },
          successMessage: `Successfully booked ${hotel.name}`
        };

        const replaceHotelResponse = await axios.put(
          `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`,
          replaceHotelRequest,
          {
            headers: {
              "X-Inquiry-Token": inquiryToken,
            },
          }
        );

        // If successful, update status and notify parent
        if (replaceHotelResponse.data.success) {
          setBookingStatus({
            loading: false,
            success: true,
            error: null,
            message: replaceHotelResponse.data.message,
          });
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
            message:
              replaceHotelResponse.data.message || "Failed to update itinerary",
          });
        }
      }
    } catch (error) {
      console.error("Error selecting room:", error);
      setBookingStatus({
        loading: false,
        success: false,
        error: true,
        message:
          error.response?.data?.message ||
          "Failed to book hotel. Please try again.",
      });
    }
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
          <p className="text-red-500">
            Failed to load hotel details: {detailsError}
          </p>
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

  // Image handling with fallback
  const imageUrl =
    hotel.images?.[0]?.links?.find((link) => link.size === "Standard")?.url ||
    hotel.heroImage ||
    "/api/placeholder/800/400";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{hotel.name}</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hotel Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={imageUrl}
                alt={hotel.name}
                className="w-full h-64 object-cover rounded"
                onError={(e) => {
                  if (!imageError) {
                    setImageError(true);
                    e.target.src = "/api/placeholder/400/300";
                  }
                }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{hotel.name}</h3>
              {renderStarRating()}
              {hotel.descriptions?.map(
                (desc, index) =>
                  desc.type === "location" && (
                    <p key={index} className="text-gray-600 text-sm">
                      {desc.text}
                    </p>
                  )
              )}
            </div>
          </div>

          {/* Room Types and Recommendations */}
          <div className="space-y-6">
            {Object.entries(groupedRecommendations).map(([groupId, recs]) =>
              renderRoomTypeSection(groupId, recs)
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t">{renderActionButtons()}</div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailModal;
