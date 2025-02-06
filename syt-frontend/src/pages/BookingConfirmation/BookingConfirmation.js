import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Loader,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
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
  transformActivityBookings,
  transformTransferBookings,
} from "../../utils/bookingDataTransformer";

// Individual booking item component
const BookingItem = ({ type, item, status, error, onVoucherDownload }) => {
  const getDisplayName = () => {
    switch (type) {
      case "flight":
        return `${item.flightData.flightProvider} ${
          item.flightData.flightCode
        } - ${item.flightData.origin} (${
          item.flightData.originAirport?.code || ""
        }) to ${item.flightData.destination} (${
          item.flightData.arrivalAirport?.code || ""
        })`;
      case "hotel":
        const hotelName = item.data?.hotelDetails?.name || "Unknown Hotel";
        const cityName =
          item.data?.hotelDetails?.address?.city?.name || "Unknown City";
        const rating = item.data?.hotelDetails?.starRating
          ? ` (${item.data.hotelDetails.starRating}★)`
          : "";
        return `${hotelName}${rating} - ${cityName}`;
      case "activity":
        const title = item.packageDetails?.title || item.activityName;
        const time = item.selectedTime ? ` at ${item.selectedTime}` : "";
        return `${title}${time}`;
      case "transfer":
        const from =
          item.details.selectedQuote?.routeDetails?.from ||
          item.details.origin?.city;
        const to =
          item.details.selectedQuote?.routeDetails?.to ||
          item.details.destination?.city;
        return `Transfer from ${from} to ${to}`;
      default:
        return "Unknown Item";
    }
  };

  const getAdditionalInfo = () => {
    switch (type) {
      case "flight":
        return `${item.flightData.departureTime} - ${item.flightData.arrivalTime} | Duration: ${item.flightData.flightDuration}`;
      case "hotel":
        const checkIn = item.checkIn || "";
        const checkOut = item.checkOut || "";
        const roomInfo = item.data?.items?.[0]?.selectedRoomsAndRates?.[0]?.room
          ?.name
          ? ` | Room: ${item.data.items[0].selectedRoomsAndRates[0].room.name}`
          : "";
        return `Check-in: ${checkIn} | Check-out: ${checkOut}${roomInfo}`;
      case "activity":
        return `Duration: ${item.duration} hours`;
      case "transfer":
        const pickup =
          item.details.selectedQuote?.routeDetails?.pickup_date?.split(
            " "
          )[1] || "";
        return `Pickup: ${pickup} | Distance: ${item.details.distance}`;
      default:
        return "";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="text-green-500" size={24} />;
      case "failed":
        return <XCircle className="text-red-500" size={24} />;
      case "loading":
        return <Loader className="animate-spin text-blue-500" size={24} />;
      default:
        return <CircularProgress size={24} />;
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
            <Typography variant="body2" color="text.secondary">
              {getAdditionalInfo()}
            </Typography>
            <Typography
              variant="body2"
              className={`
                ${status === "confirmed" ? "text-green-500" : ""}
                ${status === "failed" ? "text-red-500" : ""}
                ${status === "loading" ? "text-blue-500" : ""}
              `}
            >
              {status === "loading" ? "Booking in progress..." : status}
            </Typography>
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </div>
        </div>
        {status === "confirmed" && (
          <Button
            variant="outlined"
            startIcon={<Download size={20} />}
            onClick={() => onVoucherDownload(type, item)}
          >
            View Voucher
          </Button>
        )}
      </div>
    </Box>
  );
};

// City component to group bookings
const CityBookings = ({
  city,
  bookingId,
  bookingStatuses,
  errors,
  onVoucherDownload,
}) => {
  return (
    <Box className="mb-8">
      <Typography variant="h5" className="mb-4 font-semibold">
        {city.city}, {city.country}
      </Typography>

      {city.days.map((day, dayIndex) => (
        <Box key={dayIndex} className="mb-6">
          <Typography variant="h6" className="mb-3">
            Day {dayIndex + 1} - {day.date}
          </Typography>

          {day.flights?.map((flight) => (
            <BookingItem
              key={flight.flightData.flightCode}
              type="flight"
              item={flight}
              status={bookingStatuses[`flight-${flight.flightData.flightCode}`]}
              error={errors[`flight-${flight.flightData.flightCode}`]}
              onVoucherDownload={onVoucherDownload}
            />
          ))}

          {day.hotels?.map((hotel) => (
            <BookingItem
              key={hotel.data.traceId}
              type="hotel"
              item={hotel}
              status={bookingStatuses[`hotel-${hotel.data.traceId}`]}
              error={errors[`hotel-${hotel.data.traceId}`]}
              onVoucherDownload={onVoucherDownload}
            />
          ))}

          {day.activities?.map((activity) => (
            <BookingItem
              key={activity.activityCode}
              type="activity"
              item={activity}
              status={bookingStatuses[`activity-${activity.activityCode}`]}
              error={errors[`activity-${activity.activityCode}`]}
              onVoucherDownload={onVoucherDownload}
            />
          ))}

          {day.transfers?.map((transfer) => (
            <BookingItem
              key={transfer.details.quotation_id}
              type="transfer"
              item={transfer}
              status={
                bookingStatuses[`transfer-${transfer.details.quotation_id}`]
              }
              error={errors[`transfer-${transfer.details.quotation_id}`]}
              onVoucherDownload={onVoucherDownload}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Main BookingConfirmation component
const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { bookingStatuses = {}, errors = {} } = useSelector(
    (state) => state.bookingConfirmation || {}
  );
  const [overallStatus, setOverallStatus] = useState("processing");
  const { bookingId, itinerary, bookingData } = location.state || {};

  // Process Bookings
  useEffect(() => {
    if (!bookingId || !itinerary || !bookingData) {
      navigate("/");
      return;
    }

    const allTravelers = bookingData.rooms.flatMap((room) => room.travelers);

    const startBookingProcess = async () => {
      try {
        for (const city of itinerary.cities) {
          for (const day of city.days) {
            // Process flights
            if (day.flights?.length > 0) {
              for (const flight of day.flights) {
                try {
                  dispatch(
                    setBookingStatus({
                      type: "flight",
                      id: flight.flightData.flightCode,
                      status: "loading",
                    })
                  );

                  // Correct flight payload
                  await dispatch(
                    bookFlight({
                      bookingId,
                      flight: {
                        // Wrap in 'flight' object
                        bookingId: bookingId,
                        itineraryToken: itinerary.itineraryToken,
                        inquiryToken: itinerary.inquiryToken,
                        date: day.date,
                        city: city.city,
                        traceId: flight.flightData.traceId,
                        itineraryCode:
                          flight.flightData.bookingDetails?.itineraryCode,
                      },
                    })
                  ).unwrap();
                } catch (error) {
                  console.error("Flight booking error:", error);
                  dispatch(
                    setBookingStatus({
                      type: "flight",
                      id: flight.flightData.flightCode,
                      status: "failed",
                    })
                  );
                }
              }
            }

            // Process hotels
            if (day.hotels?.length > 0) {
              for (const hotel of day.hotels) {
                try {
                  dispatch(
                    setBookingStatus({
                      type: "hotel",
                      id: hotel.data.traceId,
                      status: "loading",
                    })
                  );

                  // Correct hotel payload
                  await dispatch(
                    bookHotel({
                      bookingId,
                      hotel: {
                        // Wrap in 'hotel' object
                        bookingId: bookingId,
                        itineraryToken: itinerary.itineraryToken,
                        inquiryToken: itinerary.inquiryToken,
                        date: day.date,
                        city: city.city,
                        traceId: hotel.data.traceId,
                        itineraryCode: hotel.data.code,
                      },
                    })
                  ).unwrap();
                } catch (error) {
                  console.error("Hotel booking error:", error);
                  dispatch(
                    setBookingStatus({
                      type: "hotel",
                      id: hotel.data.traceId,
                      status: "failed",
                    })
                  );
                }
              }
            }

            // Process activities
            if (day.activities?.length > 0) {
              for (const activity of day.activities) {
                if (activity.activityType === 'online') {
                  try {
                    dispatch(setBookingStatus({
                      type: 'activity',
                      id: activity.activityCode,
                      status: 'loading'
                    }));
            
                    // Create proper context with date and tokens
                    const activityContext = {
                      cities: [{
                        days: [{
                          date: day.date,
                          activities: [activity]
                        }]
                      }],
                      itineraryToken: itinerary.itineraryToken,
                      inquiryToken: itinerary.inquiryToken
                    };
            
                    const transformedActivity = transformActivityBookings(
                      activityContext,
                      allTravelers,
                      bookingData.specialRequirements
                    )[0];
            
                    await dispatch(bookActivity({
                      bookingId,
                      activity: {
                        bookingId: bookingId,
                        transformedActivity: {
                          ...transformedActivity,
                          itineraryToken: itinerary.itineraryToken,
                          inquiryToken: itinerary.inquiryToken
                        }
                      }
                    })).unwrap();
            
                  } catch (error) {
                    console.error('Activity booking error:', error);
                    dispatch(setBookingStatus({
                      type: 'activity',
                      id: activity.activityCode,
                      status: 'failed'
                    }));
                  }
                } else {
                  dispatch(setBookingStatus({
                    type: 'activity',
                    id: activity.activityCode,
                    status: 'confirmed'
                  }));
                }
              }
            }

            // Process transfers
            if (day.transfers?.length > 0) {
              for (const transfer of day.transfers) {
                try {
                  const quotationId = transfer.details.quotation_id;

                  dispatch(
                    setBookingStatus({
                      type: "transfer",
                      id: quotationId,
                      status: "loading",
                    })
                  );

                  // Create a temporary itinerary with only this specific transfer
                  const singleTransferItinerary = {
                    ...itinerary,
                    cities: [
                      {
                        ...city,
                        days: [
                          {
                            ...day,
                            transfers: [transfer],
                          },
                        ],
                      },
                    ],
                  };

                  // Transform the single transfer
                  const transformedTransfer = transformTransferBookings(
                    singleTransferItinerary,
                    allTravelers
                  )[0];

                  if (!transformedTransfer) {
                    throw new Error("Failed to transform transfer data");
                  }

                  await dispatch(
                    bookTransfer({
                      bookingId,
                      transfer: {
                        ...transformedTransfer,
                        bookingId,
                        quotationId,
                      },
                    })
                  ).unwrap();
                } catch (error) {
                  console.error("Transfer booking error:", error);
                  dispatch(
                    setBookingStatus({
                      type: "transfer",
                      id: transfer.details.quotation_id,
                      status: "failed",
                    })
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Overall booking process error:", error);
        setOverallStatus("failed");
      }
    };

    startBookingProcess();
  }, [bookingId, itinerary, bookingData, dispatch, navigate]);

  // Status monitoring effect
  useEffect(() => {
    if (!bookingId || !itinerary) return;

    const allStatuses = Object.values(bookingStatuses);
    if (allStatuses.length > 0) {
      const isAllConfirmed = allStatuses.every(
        (status) => status === "confirmed"
      );
      const hasFailures = allStatuses.some((status) => status === "failed");
      setOverallStatus(
        isAllConfirmed ? "completed" : hasFailures ? "partial" : "failed"
      );
    }
  }, [bookingId, itinerary, bookingStatuses]);

  // Voucher download handler
  const handleVoucherDownload = async (type, item) => {
    try {
      const getId = () => {
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
            return null;
        }
      };

      const itemId = getId();
      if (!itemId) return;

      const response = await fetch(
        `http://localhost:5000/api/booking/${bookingId}/voucher/${type}/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to download voucher");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-voucher-${itemId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading voucher:", error);
    }
  };

  if (!bookingId || !itinerary) {
    return null;
  }

  return (
    <Container maxWidth="xl" className="py-8">
      <Paper elevation={3} className="p-6">
        {/* Header */}
        <Box className="text-center mb-8">
          <Typography variant="h4" gutterBottom>
            Booking Confirmation
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Booking Reference: {bookingId}
          </Typography>

          {/* Overall Status Alert */}
          {overallStatus !== "processing" && (
            <Alert
              severity={
                overallStatus === "completed"
                  ? "success"
                  : overallStatus === "partial"
                  ? "warning"
                  : "error"
              }
              className="mt-4"
            >
              {overallStatus === "completed"
                ? "All bookings confirmed successfully!"
                : overallStatus === "partial"
                ? "Some bookings were successful, but others failed."
                : "Failed to complete all bookings."}
            </Alert>
          )}
        </Box>

        <Divider className="mb-6" />

        {/* Bookings by City */}
        {itinerary.cities.map((city, index) => (
          <CityBookings
            key={index}
            city={city}
            bookingId={bookingId}
            bookingStatuses={bookingStatuses}
            errors={errors}
            onVoucherDownload={handleVoucherDownload}
          />
        ))}

        {/* Navigation Buttons */}
        <Box className="mt-8 flex justify-between items-center">
          <Button
            variant="outlined"
            startIcon={<ArrowLeft />}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/my-bookings")}
          >
            View All Bookings
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default BookingConfirmation;
