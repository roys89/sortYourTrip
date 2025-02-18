import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography
} from "@mui/material";
import axios from "axios";
import { CheckCircle, Download, Loader, XCircle } from "lucide-react";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  bookActivity,
  bookFlight,
  bookHotel,
  bookTransfer,
  setBookingStatus,
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

// Memoized Booking Item Component
const BookingItem = memo(
  ({ type, item, status, error, onVoucherDownload, isLoading }) => {
    const getDisplayName = useCallback(() => {
      switch (type) {
        case "flight":
          return `${item.flightData.flightProvider} ${item.flightData.flightCode} - ${item.flightData.origin} to ${item.flightData.destination}`;
        case "hotel":
          const hotelName = item.data?.hotelDetails?.name || "Unknown Hotel";
          const cityName =
            item.data?.hotelDetails?.address?.city?.name || "Unknown City";
          return `${hotelName} - ${cityName}`;
        case "activity":
          return item.packageDetails?.title || item.activityName;
        case "transfer":
          const from = item.details.origin?.city;
          const to = item.details.destination?.city;
          return `Transfer from ${from} to ${to}`;
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

    return (
      <Box className="p-4 mb-4 rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon()}
            <div>
              <Typography variant="subtitle1" className="font-medium">
                {getDisplayName()}
              </Typography>
              <Typography
                variant="body2"
                className={`
                ${status === "confirmed" ? "text-green-500" : ""}
                ${status === "failed" ? "text-red-500" : ""}
                ${isLoading ? "text-blue-500" : ""}
              `}
              >
                {isLoading ? "Loading" : status}
              </Typography>
              {error && (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              )}
            </div>
          </div>
          <Button
            variant="outlined"
            startIcon={<Download size={20} />}
            onClick={() =>
              status === "confirmed" && onVoucherDownload(type, item)
            }
            disabled={status !== "confirmed"}
            sx={{
              opacity: status === "confirmed" ? 1 : 0.5,
              "&.Mui-disabled": {
                color: "rgba(0, 0, 0, 0.26)",
                borderColor: "rgba(0, 0, 0, 0.12)",
              },
            }}
          >
            View Voucher
          </Button>
        </div>
      </Box>
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
        error: error.message || `${type} booking failed`,
      });
    },
    [debouncedSetBookingStatus]
  );

  const processBooking = useCallback(
    async (type, item, cityName, date) => {
      if (!bookingId || !fetchedItinerary) return;

      const allTravelers = bookingData.rooms.flatMap((room) => room.travelers);

      try {
        debouncedSetBookingStatus({
          type,
          id: getBookingId(type, item),
          status: "loading",
        });

        let bookingResponse;

        switch (type) {
          case "flight": {
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
                flightData: item.flightData,
              },
            };
            bookingResponse = await dispatch(
              bookFlight(flightPayload)
            ).unwrap();
            break;
          }

          case "hotel": {
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
              },
            };
            bookingResponse = await dispatch(bookHotel(hotelPayload)).unwrap();
            break;
          }

          case "activity": {
            if (item.activityType === "offline") {
              debouncedSetBookingStatus({
                type: "activity",
                id: item.activityCode,
                status: "confirmed",
              });
              return;
            }

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
                },
              },
            };
            bookingResponse = await dispatch(
              bookActivity(activityPayload)
            ).unwrap();
            break;
          }

          case "transfer": {
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
              },
            };
            bookingResponse = await dispatch(
              bookTransfer(transferPayload)
            ).unwrap();
            break;
          }

          default: {
            throw new Error(`Unsupported booking type: ${type}`);
          }
        }

        if (!bookingResponse?.success) {
          throw new Error(bookingResponse?.error || `${type} booking failed`);
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
      let response;
      switch (type) {
        case "flight": {
          const flightDetails =
            item.flightData.bookingDetails?.data?.results?.details?.[0];
          const bmsBookingCode = flightDetails?.bmsBookingCode;

          if (!bmsBookingCode) {
            console.error(
              "No bmsBookingCode found in flight data:",
              item.flightData
            );
            return;
          }

          response = await dispatch(
            openFlightVoucher({
              bmsBookingCode,
              itineraryToken: fetchedItinerary.itineraryToken,
              date: item.date,
              city: item.city,
              inquiryToken: fetchedItinerary.inquiryToken,
            })
          ).unwrap();
          break;
        }

        case "hotel": {
          const hotelDetails =
            item.data.bookingDetails?.data?.results?.[0]?.data?.[0];
          const bookingCode = hotelDetails?.bookingRefId;

          if (!bookingCode) {
            console.error("No bookingRefId found in hotel data:", item.data);
            return;
          }

          response = await dispatch(
            openHotelVoucher({
              bookingCode,
              itineraryToken: fetchedItinerary.itineraryToken,
              date: item.date,
              city: item.city,
              inquiryToken: fetchedItinerary.inquiryToken,
            })
          ).unwrap();
          break;
        }

        case "activity": {
          const { bookingReference, searchId } =
            item.bookingDetails?.data || {};

          if (!bookingReference) {
            console.error(
              "No bookingReference found in activity data:",
              item.bookingDetails
            );
            return;
          }

          response = await dispatch(
            openActivityVoucher({
              bookingReference,
              searchId,
              itineraryToken: fetchedItinerary.itineraryToken,
              date: item.fromDate,
              city: item.city,
              inquiryToken: fetchedItinerary.inquiryToken,
            })
          ).unwrap();
          break;
        }

        case "transfer": {
          const booking_id = item.details.bookingDetails?.data?.booking_id;

          if (!booking_id) {
            console.error(
              "No booking_id found in transfer data:",
              item.details
            );
            return;
          }

          response = await dispatch(
            openTransferVoucher({
              booking_id,
              itineraryToken: fetchedItinerary.itineraryToken,
              date: item.details.booking_date,
              city: item.details.origin.city,
              inquiryToken: fetchedItinerary.inquiryToken,
            })
          ).unwrap();
          break;
        }

        default: {
          console.error(`Unsupported voucher type: ${type}`);
          return;
        }
      }

      // Open window after getting response
      if (response) {
        const voucherWindow = window.open("about:blank", "_blank");
        if (voucherWindow) {
          voucherWindow.document.open();
          voucherWindow.document.write(response);
          voucherWindow.document.close();
        } else {
          alert("Please allow popups to view the voucher");
        }
      }
    } catch (error) {
      console.error(`Error opening ${type} voucher:`, error);
      alert(`Failed to open voucher: ${error.message}`);
    }
  };

  // Load itinerary
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

  // Process bookings after initial render
  useEffect(() => {
    if (!isInitialLoad || !fetchedItinerary || isItineraryLoading) return;

    const processAllBookings = async () => {
      for (const city of fetchedItinerary.cities) {
        for (const day of city.days) {
          // Process each booking type in parallel for each day
          const bookingPromises = [];

          // Flights
          if (day.flights?.length > 0) {
            const flightPromises = day.flights.map((flight) => {
              const existingStatus = flight.flightData.bookingStatus;
              if (
                existingStatus === "confirmed" ||
                existingStatus === "failed"
              ) {
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

          // Hotels
          if (day.hotels?.length > 0) {
            const hotelPromises = day.hotels.map((hotel) => {
              const existingStatus = hotel.data.bookingStatus;
              if (
                existingStatus === "confirmed" ||
                existingStatus === "failed"
              ) {
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

          // Activities
          if (day.activities?.length > 0) {
            const activityPromises = day.activities.map((activity) => {
              const existingStatus = activity.bookingStatus;
              if (
                existingStatus === "confirmed" ||
                existingStatus === "failed"
              ) {
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

          // Transfers
          if (day.transfers?.length > 0) {
            const transferPromises = day.transfers.map((transfer) => {
              const existingStatus = transfer.details.bookingStatus;
              if (
                existingStatus === "confirmed" ||
                existingStatus === "failed"
              ) {
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

          // Wait for all bookings in this day to complete
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

  // Update overall status
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
      <Container maxWidth="xl" className="min-h-screen py-16">
        <Paper elevation={3} className="p-8 text-center">
          <CircularProgress size={48} />
          <Typography variant="h6" className="mt-6">
            Loading Itinerary Details...
          </Typography>
        </Paper>
      </Container>
    );
  }


  return (
    <Container maxWidth="xl" className="min-h-screen pt-6 px-4 pb-8 mt-8">
      {/* Header Section */}
      <Paper elevation={1} className="mb-4">
        <Box className="p-3">
          <Typography variant="h6" className="font-medium text-gray-800">
            Booking Confirmation
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            Reference: <span className="font-mono text-gray-800">{bookingId}</span>
          </Typography>
          {overallStatus !== 'processing' && (
            <div className={`
              mt-2 py-1.5 px-3 text-center rounded
              ${overallStatus === 'completed' ? 'bg-green-50 text-green-700' : ''}
              ${overallStatus === 'partial' ? 'bg-yellow-50 text-yellow-700' : ''}
              ${overallStatus === 'failed' ? 'bg-red-50 text-red-700' : ''}
            `}>
              <Typography variant="body2">
                {overallStatus === 'completed' 
                  ? 'All bookings confirmed successfully!'
                  : overallStatus === 'partial'
                  ? 'Some bookings were successful, but others failed.'
                  : 'Failed to complete all bookings.'
                }
              </Typography>
            </div>
          )}
        </Box>
      </Paper>

      {/* Main Content */}
      {(fetchedItinerary || passedItinerary).cities.map((city, cityIndex) => (
        <Paper key={cityIndex} elevation={1} className="mb-4">
          {/* City Header */}
          <Box className="px-4 py-3 bg-gray-50 border-b">
            <Typography variant="subtitle1" className="font-medium text-gray-800">
              {city.city}, {city.country}
            </Typography>
          </Box>

          {city.days.map((day, dayIndex) => (
            <Box key={dayIndex} className="p-4">
              {/* Date Header */}
              <Box className="mb-3 pb-2 border-b">
                <Typography variant="subtitle1" className="text-gray-700">
                  Day {dayIndex + 1}
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              {/* Bookings Sections */}
              <div className="space-y-4">
                {/* Flights Section */}
                {day.flights?.length > 0 && (
                  <Box className="pb-2">
                    <Typography variant="subtitle1" className="flex items-center mb-2 text-gray-700 font-medium">
                      <span className="px-1.5 py-0.5">✈️</span>
                      Flights
                    </Typography>
                    <div className="space-y-2">
                      {day.flights.map((flight) => (
                        <BookingItem
                          key={flight.flightData.flightCode}
                          type="flight"
                          item={flight}
                          status={bookingStatuses[`flight-${flight.flightData.flightCode}`]}
                          error={errors[`flight-${flight.flightData.flightCode}`]}
                          onVoucherDownload={handleVoucherDownload}
                          isLoading={bookingLoading[`flight-${flight.flightData.flightCode}`]}
                        />
                      ))}
                    </div>
                  </Box>
                )}

                {/* Hotels Section */}
                {day.hotels?.length > 0 && (
                  <Box className="pb-2">
                    <Typography variant="subtitle1" className="flex items-center mb-2 text-gray-700 font-medium">
                      <span className="px-1.5 py-0.5">🏨</span>
                      Hotels
                    </Typography>
                    <div className="space-y-2">
                      {day.hotels.map((hotel) => (
                        <BookingItem
                          key={hotel.data.traceId}
                          type="hotel"
                          item={hotel}
                          status={bookingStatuses[`hotel-${hotel.data.traceId}`]}
                          error={errors[`hotel-${hotel.data.traceId}`]}
                          onVoucherDownload={handleVoucherDownload}
                          isLoading={bookingLoading[`hotel-${hotel.data.traceId}`]}
                        />
                      ))}
                    </div>
                  </Box>
                )}

                {/* Transfers Section */}
                {day.transfers?.length > 0 && (
                  <Box className="pb-2">
                    <Typography variant="subtitle1" className="flex items-center mb-2 text-gray-700 font-medium">
                      <span className="px-1.5 py-0.5">🚗</span>
                      Transfers
                    </Typography>
                    <div className="space-y-2">
                      {day.transfers.map((transfer) => (
                        <BookingItem
                          key={transfer.details.quotation_id}
                          type="transfer"
                          item={transfer}
                          status={bookingStatuses[`transfer-${transfer.details.quotation_id}`]}
                          error={errors[`transfer-${transfer.details.quotation_id}`]}
                          onVoucherDownload={handleVoucherDownload}
                          isLoading={bookingLoading[`transfer-${transfer.details.quotation_id}`]}
                        />
                      ))}
                    </div>
                  </Box>
                )}

                {/* Activities Section */}
                {day.activities?.length > 0 && (
                  <Box className="pb-2">
                    <Typography variant="subtitle1" className="flex items-center mb-2 text-gray-700 font-medium">
                      <span className="px-1.5 py-0.5">🎯</span>
                      Activities
                    </Typography>
                    <div className="space-y-2">
                      {day.activities.map((activity) => (
                        <BookingItem
                          key={activity.activityCode}
                          type="activity"
                          item={activity}
                          status={bookingStatuses[`activity-${activity.activityCode}`]}
                          error={errors[`activity-${activity.activityCode}`]}
                          onVoucherDownload={handleVoucherDownload}
                          isLoading={bookingLoading[`activity-${activity.activityCode}`]}
                        />
                      ))}
                    </div>
                  </Box>
                )}
              </div>
            </Box>
          ))}
        </Paper>
      ))}
    </Container>
  );
};

export default BookingConfirmation;