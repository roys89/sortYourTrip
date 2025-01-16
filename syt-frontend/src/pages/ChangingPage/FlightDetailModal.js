import axios from 'axios';
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

const FlightDetailModal = ({
  flight,
  onClose,
  itineraryToken,
  inquiryToken,
  existingPrice,
  type,               // Flight type (departure/return/inter-city)
  originCityName,     // Origin city name
  destinationCityName,// Destination city name
  date,               // Flight date
  traceId             // Trace ID for fare rules
}) => {
  const [fareRules, setFareRules] = useState(null);
  const [fareRulesLoading, setFareRulesLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState({
    loading: false,
    success: false,
    error: null,
    message: null,
    partialSuccess: false
  });

  // Determine city name based on flight type
  function determineCityName() {
    switch(type) {
      case 'departure_flight':
      case 'inter_city_flight':
        return destinationCityName;
      case 'return_flight':
        return originCityName;
      default:
        console.warn('Unknown flight type:', type);
        return destinationCityName;
    }
  }

  // Helper functions (existing implementation)
  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeDuration = () => {
    const duration = flight.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStops = () => {
    const stops = flight.sg.length - 1;
    return stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`;
  };

  // Fetch fare rules
  const fetchFareRules = async () => {
    if (flight.sg[0].bg === "Check Fare Rules") {
      try {
        setFareRulesLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/itinerary/flights/${inquiryToken}/fare-rules`,
          {
            params: {
              traceId,
              resultIndex: flight.rI,
              cityName: determineCityName(),
              date
            },
            headers: {
              'X-Inquiry-Token': inquiryToken
            }
          }
        );
        setFareRules(response.data.data.results);
      } catch (error) {
        console.error('Error fetching fare rules:', error);
      } finally {
        setFareRulesLoading(false);
      }
    }
  };

  // Handle flight selection
  const handleSelectFlight = async () => {
    setBookingStatus({
      loading: true,
      success: false,
      error: null,
      message: null,
      partialSuccess: false
    });

    try {
      // Create flight itinerary
      const createResponse = await axios.post(
        `http://localhost:5000/api/itinerary/flights/${inquiryToken}/${flight.rI}/select`,
        {
          traceId,
          cityName: determineCityName(),
          date,
          type  // Pass flight type
        },
        {
          headers: {
            'X-Inquiry-Token': inquiryToken
          }
        } 
      );

      if (!createResponse.data.success) {
        throw new Error(createResponse.data.message || 'Failed to create flight itinerary');
      }

      // Replace flight in main itinerary
      const replaceResponse = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/flight`,
        {
          cityName: determineCityName(),
          date,
          newFlightDetails: createResponse.data.data,
          type,  // Pass flight type for accurate replacement
          userStyle: 'Normal'
        },
        {
          headers: {
            'X-Inquiry-Token': inquiryToken
          }
        }
      );

      setBookingStatus({
        loading: false,
        success: true,
        error: null,
        message: replaceResponse.data.message,
        partialSuccess: replaceResponse.data.partialSuccess
      });

      if (replaceResponse.data.transferUpdateFailed) {
        alert('Flight updated successfully, but transfers could not be updated automatically. Please check and update transfers manually if needed.');
      }

      onClose();

    } catch (error) {
      console.error('Error selecting flight:', error);
      setBookingStatus({
        loading: false,
        success: false,
        error: true,
        message: error.response?.data?.message || 'Failed to book flight. Please try again.'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center pt-10">
      <div className="bg-white w-full md:rounded-lg h-full md:h-auto md:w-[90%] md:max-w-5xl md:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-3 sm:p-4 border-b flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold truncate pr-2">Flight Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Flight segments */}
          {flight.sg.map((segment, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                {/* Airline Info */}
                <div className="flex-shrink-0">
                  <h3 className="text-lg font-semibold">{segment.al.alN}</h3>
                  <p className="text-sm text-gray-600">{`${segment.al.alC} ${segment.al.fN}`}</p>
                  {segment.bg && (
                    <p className="text-xs text-gray-500 mt-1">{segment.bg}</p>
                  )}
                </div>

                {/* Flight Details */}
                <div className="flex-grow flex flex-col md:flex-row justify-between items-center gap-4">
                  {/* Departure */}
                  <div className="text-center">
                    <p className="text-xl font-bold">{formatTime(segment.or.dT)}</p>
                    <p className="text-sm">{segment.or.cN}</p>
                    <p className="text-xs text-gray-500">{segment.or.aC}</p>
                  </div>

                  {/* Duration/Type */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{`${Math.floor(segment.dr / 60)}h ${segment.dr % 60}m`}</p>
                    <div className="w-32 h-px bg-gray-300 my-2"></div>
                    <p className="text-xs text-blue-600">{segment.sO ? 'Technical Stop' : 'Direct'}</p>
                  </div>

                  {/* Arrival */}
                  <div className="text-center">
                    <p className="text-xl font-bold">{formatTime(segment.ds.aT)}</p>
                    <p className="text-sm">{segment.ds.cN}</p>
                    <p className="text-xs text-gray-500">{segment.ds.aC}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-4 text-sm text-gray-600">
                <p>Class: {segment.cC === 2 ? 'Economy' : 'Business'}</p>
                {segment.nOSA && <p>Seats Available: {segment.nOSA}</p>}
              </div>
            </div>
          ))}

          {/* Price Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">Total Duration: {getTimeDuration()}</p>
                <p className="text-sm text-gray-600">{getStops()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">₹{flight.pF}</p>
                {existingPrice && (
                  <p className={`text-sm ${flight.pF > existingPrice ? 'text-red-500' : 'text-green-500'}`}>
                    {flight.pF > existingPrice ? '↑' : '↓'} 
                    ₹{Math.abs(flight.pF - existingPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fare Rules */}
          {fareRulesLoading && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {fareRules && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Fare Rules</h3>
              <div className="text-sm text-gray-600" 
                   dangerouslySetInnerHTML={{ __html: fareRules[0].fareRuleDetail }} 
              />
            </div>
          )}

          {/* Booking Status Messages */}
          {bookingStatus.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{bookingStatus.message}</AlertDescription>
            </Alert>
          )}

          {bookingStatus.success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{bookingStatus.message}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectFlight}
              disabled={bookingStatus.loading}
              className={`px-4 py-2 rounded-lg text-white ${
                bookingStatus.loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {bookingStatus.loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : (
                'Select Flight'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailModal;