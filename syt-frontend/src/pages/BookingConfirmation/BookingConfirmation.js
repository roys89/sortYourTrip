import axios from "axios";
import { CheckCircle, ChevronDown, ChevronUp, Download, Loader, XCircle } from "lucide-react";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  bookActivity,
  bookFlight,
  bookHotel,
  bookTransfer,
  setBookingStatus,
  updateBookingStatus,
} from "../../redux/slices/bookingConfirmationSlice";
import {
  openActivityVoucher,
  openFlightVoucher,
  openHotelVoucher,
  openTransferVoucher,
} from "../../redux/slices/voucherSlice";
import {
  transformActivityBookings,
  transformTransferBookings,
} from "../../utils/bookingDataTransformer";

// Offline Activity Details Component
const OfflineActivityDetails = ({ activity }) => {
  return (
    <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">Time</p>
          <p className="font-medium">{activity.selectedTime} - {activity.endTime}</p>
        </div>
        <div>
          <p className="text-gray-600">Duration</p>
          <p className="font-medium">{activity.duration} hours</p>
        </div>
        <div>
          <p className="text-gray-600">Location</p>
          <p className="font-medium">{activity.fullAddress}</p>
        </div>
        <div>
          <p className="text-gray-600">Time Slot</p>
          <p className="font-medium capitalize">{activity.timeSlot}</p>
        </div>
        {activity.budget && (
          <div>
            <p className="text-gray-600">Budget Category</p>
            <p className="font-medium">{activity.budget}</p>
          </div>
        )}
        {activity.category && (
          <div>
            <p className="text-gray-600">Activity Type</p>
            <p className="font-medium">{activity.category}</p>
          </div>
        )}
      </div>
      
      {activity.preference && activity.preference.length > 0 && (
        <div className="mt-3">
          <p className="text-gray-600 mb-1">Preferences</p>
          <div className="flex flex-wrap gap-2">
            {activity.preference.map((pref, index) => (
              <span key={index} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Memoized Booking Item Component
const BookingItem = memo(
  ({ type, item, status, error, onVoucherDownload, isLoading }) => {
    const [showOfflineDetails, setShowOfflineDetails] = useState(false);
    
    const getDisplayName = useCallback(() => {
      switch (type) {
        case "flight":
          const flightRef = item.flightData?.bookingDetails?.bmsBookingCode;
          return `${item.flightData.flightProvider} ${
            item.flightData.flightCode
          } - ${item.flightData.origin} to ${item.flightData.destination}${
            flightRef ? ` (Ref: ${flightRef})` : ""
          }`;
        case "hotel":
          const hotelName = item.data?.hotelDetails?.name || "Unknown Hotel";
          const cityName = item.data?.hotelDetails?.address?.city?.name || "Unknown City";
          const bookingRef = item.data?.bookingDetails?.bookingRefId;
          return `${hotelName} - ${cityName}${
            bookingRef ? ` (Ref: ${bookingRef})` : ""
          }`;
        case "activity":
          const activityTitle = item.packageDetails?.title || item.activityName;
          const bookingId = item.bookingDetails?.bookingReference;
          return `${activityTitle}${bookingId ? ` (Ref: ${bookingId})` : ""}`;
        case "transfer":
          const from = item.details.origin?.city;
          const to = item.details.destination?.city;
          const transferRef = item.details.bookingDetails?.booking_id;
          return `Transfer from ${from} to ${to}${
            transferRef ? ` (Ref: ${transferRef})` : ""
          }`;
        default:
          return "Unknown Item";
      }
    }, [type, item]);

    const getStatusIcon = () => {
      if (isLoading) {
        return <Loader className="animate-spin text-blue-500" size={24} />;
      }

      switch (status) {
        case "confirmed":
          return <CheckCircle className="text-green-500" size={24} />;
        case "failed":
          return <XCircle className="text-red-500" size={24} />;
        default:
          return null;
      }
    };

    const isOfflineActivity = type === 'activity' && item.activityType === 'offline';

    return (
      <div className="p-4 mb-4 rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="font-medium">
                {getDisplayName()}
              </p>
              <p className={`text-sm
                ${status === "confirmed" ? "text-green-500" : ""}
                ${status === "failed" ? "text-red-500" : ""}
                ${isLoading ? "text-blue-500" : ""}
              `}>
                {isLoading ? "Loading" : status}
              </p>
              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}
            </div>
          </div>
          
          {isOfflineActivity ? (
            <button
              onClick={() => setShowOfflineDetails(!showOfflineDetails)}
              className="px-4 py-2 border rounded-lg flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {showOfflineDetails ? (
                <ChevronUp size={20} className="mr-2" />
              ) : (
                <ChevronDown size={20} className="mr-2" />
              )}
              <span>Activity Details</span>
            </button>
          ) : (
            <button
              className={`px-4 py-2 border rounded-lg flex items-center space-x-2
                ${status === "confirmed" 
                  ? "border-blue-500 text-blue-500 hover:bg-blue-50" 
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
              onClick={() => status === "confirmed" && onVoucherDownload(type, item)}
              disabled={status !== "confirmed"}
            >
              <Download size={20} className="mr-2" />
              <span>View Voucher</span>
            </button>
          )}
        </div>
        
        {isOfflineActivity && showOfflineDetails && (
          <OfflineActivityDetails activity={item} />
        )}
      </div>
    );
  }
);

BookingItem.displayName = "BookingItem";


const BookingConfirmation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const debouncedSetBookingStatus = useCallback(
    (payload) => {
      dispatch(setBookingStatus(payload));
    },
    [dispatch]
  );

  const [fetchedItinerary, setFetchedItinerary] = useState(null);
  const [isItineraryLoading, setIsItineraryLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState("processing");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    bookingId,
    itinerary: passedItinerary,
    bookingData,
  } = location.state || {};
  const { itineraryToken, inquiryToken } = passedItinerary || {};

  const {
    bookingStatuses = {},
    errors = {},
    bookingLoading = {},
  } = useSelector((state) => state.bookingConfirmation || {});

  const fetchItinerary = useCallback(async () => {
    if (!itineraryToken || !inquiryToken) {
      throw new Error("Missing itinerary or inquiry token");
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/itinerary/${itineraryToken}`,
        {
          headers: {
            "X-Inquiry-Token": inquiryToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      throw error;
    }
  }, [itineraryToken, inquiryToken]);

  const handleBookingError = useCallback(
    (type, id, error) => {
      console.error(`${type} booking error:`, error);
      debouncedSetBookingStatus({
        type,
        id,
        status: "failed",
        error:
          error.response?.data?.message ||
          error.message ||
          `${type} booking failed`,
      });
    },
    [debouncedSetBookingStatus]
  );

  const processBooking = useCallback(
    async (type, item, cityName, date) => {
      if (!bookingId || !fetchedItinerary) return;

      const allTravelers = bookingData.rooms.flatMap((room) => room.travelers);

      try {
        switch (type) {
          case "flight": {
            const flightId = item.flightData.flightCode;

            const existingStatus = item.flightData.bookingStatus;
            if (existingStatus === "confirmed" || existingStatus === "failed") {
              debouncedSetBookingStatus({
                type: "flight",
                id: flightId,
                status: existingStatus,
              });
              return;
            }

            debouncedSetBookingStatus({
              type: "flight",
              id: flightId,
              status: "loading",
            });

            const flightPayload = {
              bookingId,
              flight: {
                bookingId,
                itineraryToken: fetchedItinerary.itineraryToken,
                inquiryToken: fetchedItinerary.inquiryToken,
                date,
                city: cityName,
                traceId: item.flightData.traceId,
                itineraryCode: item.flightData.bookingDetails?.itineraryCode,
                flightData: {
                  ...item.flightData,
                  bookingDetails: item.flightData.bookingDetails,
                },
              },
            };

            await dispatch(bookFlight(flightPayload)).unwrap();
            break;
          }

          case "hotel": {
            const hotelId = item.data.traceId;

            const existingStatus = item.data.bookingStatus;
            if (existingStatus === "confirmed" || existingStatus === "failed") {
              debouncedSetBookingStatus({
                type: "hotel",
                id: hotelId,
                status: existingStatus,
              });
              return;
            }

            debouncedSetBookingStatus({
              type: "hotel",
              id: hotelId,
              status: "loading",
            });

            const hotelPayload = {
              bookingId,
              hotel: {
                bookingId,
                itineraryToken: fetchedItinerary.itineraryToken,
                inquiryToken: fetchedItinerary.inquiryToken,
                date,
                city: cityName,
                traceId: item.data.traceId,
                code: item.data.code,
                bookingDetails: item.data.bookingDetails,
              },
            };

            await dispatch(bookHotel(hotelPayload)).unwrap();
            break;
          }

          case "activity": {
            const activityId = item.activityCode;

            // Handle offline activities
            if (item.activityType === "offline") {
              const offlineDetails = {
                activityCode: item.activityCode,
                date: item.fromDate || date,
                selectedTime: item.selectedTime,
                endTime: item.endTime,
                timeSlot: item.timeSlot,
                departureTime: item.departureTime,
                duration: item.duration,
              };

              // Update booking status for offline activity
              await dispatch(
                updateBookingStatus({
                  bookingId,
                  itineraryToken: fetchedItinerary.itineraryToken,
                  inquiryToken: fetchedItinerary.inquiryToken,
                  cityName,
                  date: item.fromDate || date,
                  bookingType: "activity",
                  bookingStatus: "confirmed",
                  activityCode: item.activityCode,
                  bookingResponse: {
                    offlineDetails,
                    success: true,
                  },
                })
              ).unwrap();

              debouncedSetBookingStatus({
                type: "activity",
                id: activityId,
                status: "confirmed",
                bookingDetails: offlineDetails,
              });
              return;
            }

            const existingStatus = item.bookingStatus;
            if (existingStatus === "confirmed" || existingStatus === "failed") {
              debouncedSetBookingStatus({
                type: "activity",
                id: activityId,
                status: existingStatus,
              });
              return;
            }

            debouncedSetBookingStatus({
              type: "activity",
              id: activityId,
              status: "loading",
            });

            const activityContext = {
              cities: [
                {
                  days: [
                    {
                      date,
                      activities: [item],
                    },
                  ],
                },
              ],
              itineraryToken: fetchedItinerary.itineraryToken,
              inquiryToken: fetchedItinerary.inquiryToken,
            };

            const transformedActivity = transformActivityBookings(
              activityContext,
              allTravelers,
              bookingData.specialRequirements
            )[0];

            const activityPayload = {
              bookingId,
              activity: {
                bookingId,
                transformedActivity: {
                  ...transformedActivity,
                  itineraryToken: fetchedItinerary.itineraryToken,
                  inquiryToken: fetchedItinerary.inquiryToken,
                  cityName,
                  bookingDetails: item.bookingDetails,},
                },
              };
  
              await dispatch(bookActivity(activityPayload)).unwrap();
              break;
            }
  
            case "transfer": {
              const transferId = item.details.quotation_id;
  
              const existingStatus = item.details.bookingStatus;
              if (existingStatus === "confirmed" || existingStatus === "failed") {
                debouncedSetBookingStatus({
                  type: "transfer",
                  id: transferId,
                  status: existingStatus,
                });
                return;
              }
  
              debouncedSetBookingStatus({
                type: "transfer",
                id: transferId,
                status: "loading",
              });
  
              const singleTransferItinerary = {
                ...fetchedItinerary,
                cities: [
                  {
                    city: cityName,
                    days: [
                      {
                        date,
                        transfers: [item],
                      },
                    ],
                  },
                ],
              };
  
              const transformedTransfer = transformTransferBookings(
                singleTransferItinerary,
                allTravelers
              )[0];
  
              const transferPayload = {
                bookingId,
                transfer: {
                  ...transformedTransfer,
                  bookingId,
                  quotationId: item.details.quotation_id,
                  itineraryToken: fetchedItinerary.itineraryToken,
                  inquiryToken: fetchedItinerary.inquiryToken,
                  cityName,
                  bookingDetails: item.details.bookingDetails,
                },
              };
  
              await dispatch(bookTransfer(transferPayload)).unwrap();
              break;
            }
  
            default: {
              throw new Error(`Unsupported booking type: ${type}`);
            }
          }
        } catch (error) {
          handleBookingError(type, getBookingId(type, item), error);
        }
      },
      [
        bookingId,
        fetchedItinerary,
        bookingData,
        dispatch,
        handleBookingError,
        debouncedSetBookingStatus,
      ]
    );
  
    const getBookingId = (type, item) => {
      switch (type) {
        case "flight":
          return item.flightData.flightCode;
        case "hotel":
          return item.data.traceId;
        case "activity":
          return item.activityCode;
        case "transfer":
          return item.details.quotation_id;
        default:
          return "";
      }
    };
  
    const handleVoucherDownload = async (type, item) => {
      if (!fetchedItinerary) return;
    
      const bookingKey = `${type}-${getBookingId(type, item)}`;
      if (bookingStatuses[bookingKey] !== "confirmed") {
        console.warn("Voucher not available for this booking");
        return;
      }
    
      try {
        const referenceId = (() => {
          switch (type) {
            case "flight":
              return item.flightData.bookingDetails.itineraryCode;
            case "hotel":
              return item.data.code;
            case "activity":
              return item.activityCode;
            case "transfer":
              return item.details.quotation_id;
            default:
              throw new Error(`Unsupported type: ${type}`);
          }
        })();
    
        console.log(`Making booking details API call for: ${type}`);
        const bookingResponse = await axios.get(
          `http://localhost:5000/api/booking/itinerary/${bookingId}/booking-details/${type}/${referenceId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
    
        console.log('Booking details response:', bookingResponse.data);
        const bookingDetails = bookingResponse.data.data;
        let voucherResponse;
    
        switch (type) {
          case "flight": {
            voucherResponse = await dispatch(
              openFlightVoucher({
                bmsBookingCode: bookingDetails.bmsBookingCode,
                itineraryToken: bookingDetails.itineraryToken,
                date: bookingDetails.date,
                city: bookingDetails.city,
                inquiryToken: bookingDetails.inquiryToken,
              })
            ).unwrap();
    
            if (voucherResponse) {
              console.log('Navigating to flight-voucher with data:', voucherResponse);
              navigate('/flight-voucher', {
                state: { voucherData: voucherResponse }
              });
            }
            break;
          }
    
          case "hotel": {
            voucherResponse = await dispatch(
              openHotelVoucher({
                bookingCode: bookingDetails.bookingRefId,
                itineraryToken: bookingDetails.itineraryToken,
                date: bookingDetails.date,
                city: bookingDetails.city,
                inquiryToken: bookingDetails.inquiryToken,
              })
            ).unwrap();
          
            if (voucherResponse) {
              console.log('Navigating to hotel-voucher with data:', voucherResponse);
              navigate('/hotel-voucher', {
                state: { voucherData: voucherResponse }
              });
            }
            break;
          }
    
          case "activity": {
            voucherResponse = await dispatch(
              openActivityVoucher({
                bookingReference: bookingDetails.bookingReference,
                searchId: bookingDetails.searchId,
                itineraryToken: bookingDetails.itineraryToken,
                date: bookingDetails.date,
                city: bookingDetails.city,
                inquiryToken: bookingDetails.inquiryToken,
              })
            ).unwrap();
    
            if (voucherResponse) {
              console.log('Navigating to activity-voucher with data:', voucherResponse);
              navigate('/activity-voucher', {
                state: { voucherData: voucherResponse }
              });
            }
            break;
          }
    
          case "transfer": {
            voucherResponse = await dispatch(
              openTransferVoucher({
                booking_id: bookingDetails.booking_id,
                itineraryToken: bookingDetails.itineraryToken,
                date: bookingDetails.date,
                city: bookingDetails.city,
                inquiryToken: bookingDetails.inquiryToken,
              })
            ).unwrap();
          
            if (voucherResponse) {
              console.log('Navigating to transfer-voucher with data:', voucherResponse);
              navigate('/transfer-voucher', {
                state: { voucherData: voucherResponse }
              });
            }
            break;
          }
    
          default: {
            throw new Error(`Unsupported voucher type: ${type}`);
          }
        }
      } catch (error) {
        console.error(`Error opening ${type} voucher:`, error);
        alert(`Failed to open voucher: ${error.message}`);
      }
    };
  
    useEffect(() => {
      const loadItinerary = async () => {
        if (!bookingId) {
          navigate("/");
          return;
        }
  
        setIsItineraryLoading(true);
        try {
          const fullItinerary = await fetchItinerary();
          setFetchedItinerary(fullItinerary);
        } catch (error) {
          console.error("Failed to load itinerary:", error);
          if (passedItinerary) {
            setFetchedItinerary(passedItinerary);
          }
        } finally {
          setIsItineraryLoading(false);
        }
      };
  
      loadItinerary();
    }, [bookingId, fetchItinerary, passedItinerary, navigate]);
  
    useEffect(() => {
      if (!isInitialLoad || !fetchedItinerary || isItineraryLoading) return;
  
      const processAllBookings = async () => {
        for (const city of fetchedItinerary.cities) {
          for (const day of city.days) {
            const bookingPromises = [];
  
            if (day.flights?.length > 0) {
              const flightPromises = day.flights.map((flight) => {
                const existingStatus = flight.flightData.bookingStatus;
                if (existingStatus === "confirmed" || existingStatus === "failed") {
                  debouncedSetBookingStatus({
                    type: "flight",
                    id: flight.flightData.flightCode,
                    status: existingStatus,
                  });
                  return Promise.resolve();
                }
                return processBooking("flight", flight, city.city, day.date);
              });
              bookingPromises.push(...flightPromises);
            }
  
            if (day.hotels?.length > 0) {
              const hotelPromises = day.hotels.map((hotel) => {
                const existingStatus = hotel.data.bookingStatus;
                if (existingStatus === "confirmed" || existingStatus === "failed") {
                  debouncedSetBookingStatus({
                    type: "hotel",
                    id: hotel.data.traceId,
                    status: existingStatus,
                  });
                  return Promise.resolve();
                }
                return processBooking("hotel", hotel, city.city, day.date);
              });
              bookingPromises.push(...hotelPromises);
            }
  
            if (day.activities?.length > 0) {
              const activityPromises = day.activities.map((activity) => {
                const existingStatus = activity.bookingStatus;
                if (existingStatus === "confirmed" || existingStatus === "failed") {
                  debouncedSetBookingStatus({
                    type: "activity",
                    id: activity.activityCode,
                    status: existingStatus,
                  });
                  return Promise.resolve();
                }
                return processBooking("activity", activity, city.city, day.date);
              });
              bookingPromises.push(...activityPromises);
            }
  
            if (day.transfers?.length > 0) {
              const transferPromises = day.transfers.map((transfer) => {
                const existingStatus = transfer.details.bookingStatus;
                if (existingStatus === "confirmed" || existingStatus === "failed") {
                  debouncedSetBookingStatus({
                    type: "transfer",
                    id: transfer.details.quotation_id,
                    status: existingStatus,
                  });
                  return Promise.resolve();
                }
                return processBooking("transfer", transfer, city.city, day.date);
              });
              bookingPromises.push(...transferPromises);
            }
  
            await Promise.all(bookingPromises);
          }
        }
        setIsInitialLoad(false);
      };
  
      processAllBookings();
    }, [
      fetchedItinerary,
      isItineraryLoading,
      isInitialLoad,
      debouncedSetBookingStatus,
      processBooking,
    ]);
  
    useEffect(() => {
      if (!bookingId) return;
  
      const allStatuses = Object.values(bookingStatuses);
      const allLoadingStates = Object.values(bookingLoading);
  
      if (allStatuses.length > 0 && !allLoadingStates.includes(true)) {
        const isAllConfirmed = allStatuses.every(
          (status) => status === "confirmed"
        );
        const hasFailures = allStatuses.some((status) => status === "failed");
  
        setOverallStatus(
          isAllConfirmed ? "completed" : hasFailures ? "partial" : "processing"
        );
      }
    }, [bookingId, bookingStatuses, bookingLoading]);
  
    if (!bookingId) {
      return null;
    }
  
    if (isItineraryLoading) {
      return (
        <div className="min-h-screen py-16">
          <div className="p-8 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-6 text-xl font-medium">Loading Itinerary Details...</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen pt-6 px-4 pb-8 mt-8">
        <div className="mb-4 bg-white rounded-lg shadow-sm">
          <div className="p-3">
            <h6 className="font-medium text-gray-800 text-lg">
              Booking Confirmation
            </h6>
            <p className="text-gray-600">
              Reference:{" "}
              <span className="font-mono text-gray-800">{bookingId}</span>
            </p>
            {overallStatus !== "processing" && (
              <div
                className={`
                mt-2 py-1.5 px-3 text-center rounded
                ${overallStatus === "completed" ? "bg-green-50 text-green-700" : ""}
                ${overallStatus === "partial" ? "bg-yellow-50 text-yellow-700" : ""}
                ${overallStatus === "failed" ? "bg-red-50 text-red-700" : ""}
              `}
              >
                <p className="text-sm">
                  {overallStatus === "completed"
                    ? "All bookings confirmed successfully!"
                    : overallStatus === "partial"
                    ? "Some bookings were successful, but others failed."
                    : "Failed to complete all bookings."}
                </p>
              </div>
            )}
          </div>
        </div>
  
        {(fetchedItinerary || passedItinerary).cities.map((city, cityIndex) => (
          <div key={cityIndex} className="mb-4 bg-white rounded-lg shadow-sm">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="font-medium text-gray-800">
                {city.city}, {city.country}
              </p>
            </div>
  
            {city.days.map((day, dayIndex) => (
              <div key={dayIndex} className="p-4">
                <div className="mb-3 pb-2 border-b">
                  <p className="text-gray-700">Day {dayIndex + 1}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
  
                <div className="space-y-4">
                  {day.flights?.length > 0 && (
                    <div className="pb-2">
                      <p className="flex items-center mb-2 text-gray-700 font-medium">
                        <span className="px-1.5 py-0.5">✈️</span>
                        Flights
                      </p>
                      <div className="space-y-2">
                        {day.flights.map((flight) => (
                          <BookingItem
                            key={flight.flightData.flightCode}
                            type="flight"
                            item={flight}
                            status={
                              bookingStatuses[
                                `flight-${flight.flightData.flightCode}`
                              ]
                            }
                            error={
                              errors[`flight-${flight.flightData.flightCode}`]
                            }
                            onVoucherDownload={handleVoucherDownload}
                            isLoading={
                              bookingLoading[
                                `flight-${flight.flightData.flightCode}`
                              ]
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
  
                  {day.hotels?.length > 0 && (
                    <div className="pb-2">
                      <p className="flex items-center mb-2 text-gray-700 font-medium">
                        <span className="px-1.5 py-0.5">🏨</span>
                        Hotels
                      </p>
                      <div className="space-y-2">
                        {day.hotels.map((hotel) => (
                          <BookingItem
                            key={hotel.data.traceId}
                            type="hotel"
                            item={hotel}
                            status={
                              bookingStatuses[`hotel-${hotel.data.traceId}`]
                            }
                            error={errors[`hotel-${hotel.data.traceId}`]}
                            onVoucherDownload={handleVoucherDownload}
                            isLoading={
                              bookingLoading[`hotel-${hotel.data.traceId}`]
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
  
                  {day.transfers?.length > 0 && (
                    <div className="pb-2">
                      <p className="flex items-center mb-2 text-gray-700 font-medium">
                        <span className="px-1.5 py-0.5">🚗</span>
                        Transfers
                      </p>
                      <div className="space-y-2">
                        {day.transfers.map((transfer) => (
                          <BookingItem
                            key={transfer.details.quotation_id}
                            type="transfer"
                            item={transfer}
                            status={
                              bookingStatuses[
                                `transfer-${transfer.details.quotation_id}`
                              ]
                            }
                            error={
                              errors[`transfer-${transfer.details.quotation_id}`]
                            }
                            onVoucherDownload={handleVoucherDownload}
                            isLoading={
                              bookingLoading[
                                `transfer-${transfer.details.quotation_id}`
                              ]
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
  
                  {day.activities?.length > 0 && (
                    <div className="pb-2">
                      <p className="flex items-center mb-2 text-gray-700 font-medium">
                        <span className="px-1.5 py-0.5">🎯</span>
                        Activities
                      </p>
                      <div className="space-y-2">
                        {day.activities.map((activity) => (
                          <BookingItem
                            key={activity.activityCode}
                            type="activity"
                            item={activity}
                            status={
                              bookingStatuses[`activity-${activity.activityCode}`]
                            }
                            error={errors[`activity-${activity.activityCode}`]}
                            onVoucherDownload={handleVoucherDownload}
                            isLoading={
                              bookingLoading[`activity-${activity.activityCode}`]
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  export default BookingConfirmation;