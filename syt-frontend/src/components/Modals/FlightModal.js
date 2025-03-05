import {
  AlertTriangle,
  Armchair,
  Briefcase,
  Clock,
  Info,
  MapPin,
  Plane, // Using Armchair icon instead of Seat which isn't available
  Utensils,
  X
} from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/flightSlice';
import './Modal.css';

const FlightModal = () => {
  const dispatch = useDispatch();
  const { selectedFlight, isModalOpen } = useSelector((state) => state.flights);
  const flightData = selectedFlight?.flightData;

  if (!isModalOpen || !flightData) return null;

  const formatTime = (date, time) => {
    if (!date) return time || 'Not available';
    try {
      return new Date(date).toLocaleTimeString() || time || 'Not available';
    } catch (error) {
      return time || 'Not available';
    }
  };

  // Helper function to render seat selection
  const renderSeatSelection = (segment) => {
    // Check if seats are available and selected
    const seatMap = flightData.seatMap?.find(
      map => map.origin === segment.origin && map.destination === segment.destination
    );

    const selectedSeats = flightData.selectedSeats?.find(
      seats => seats.origin === segment.origin && seats.destination === segment.destination
    );

    if (!seatMap || !flightData.isSeatSelected) {
      return (
        <div className="modal-card">
          <div className="flex items-center gap-2">
            <Armchair size={18} className="modal-icon" />
            <span className="modal-text-base">No Seat Selected</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Default Seat: Any available seat from {segment.baggage} class
          </p>
        </div>
      );
    }

    // If seats are selected
    return (
      <div className="modal-card">
        <div className="flex items-center gap-2 mb-2">
                            <Armchair size={18} className="modal-icon" />
          <span className="modal-text-strong">Selected Seats</span>
        </div>
        {selectedSeats?.rows?.map(row => 
          row.seats.map(seat => (
            <div key={seat.code} className="text-sm">
              <span className="modal-text-base">
                Seat {seat.code} - {seat.type.isWindow ? 'Window' : seat.type.isAisle ? 'Aisle' : 'Middle'}
              </span>
              <span className="text-gray-500 ml-2">₹{seat.price.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    );
  };

  // Helper function to render meal selection
  const renderMealSelection = (segment) => {
    const mealOptions = flightData.mealOptions?.find(
      meal => meal.origin === segment.origin && meal.destination === segment.destination
    );

    const selectedMeal = flightData.selectedMeal?.find(
      meal => meal.origin === segment.origin && meal.destination === segment.destination
    );

    if (!mealOptions || !flightData.isMealSelected) {
      return (
        <div className="modal-card">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="modal-icon" />
            <span className="modal-text-base">No Meal Selected</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Default: Standard in-flight meal
          </p>
        </div>
      );
    }

    // If meal is selected
    return (
      <div className="modal-card">
        <div className="flex items-center gap-2 mb-2">
          <Utensils size={18} className="modal-icon" />
          <span className="modal-text-strong">Selected Meal</span>
        </div>
        {selectedMeal?.options?.map(meal => (
          <div key={meal.code} className="text-sm">
            <span className="modal-text-base">{meal.description}</span>
            <span className="text-gray-500 ml-2">₹{meal.price.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render baggage selection
  const renderBaggageSelection = (segment) => {
    const baggageOptions = flightData.baggageOptions?.find(
      baggage => baggage.origin === segment.origin && baggage.destination === segment.destination
    );

    const selectedBaggage = flightData.selectedBaggage?.find(
      baggage => baggage.origin === segment.origin && baggage.destination === segment.destination
    );

    if (!baggageOptions || !flightData.isBaggageSelected) {
      return (
        <div className="modal-card">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="modal-icon" />
            <span className="modal-text-base">No Extra Baggage Selected</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Default: {segment.baggage} checked, {segment.cabinBaggage} cabin
          </p>
        </div>
      );
    }

    // If baggage is selected
    return (
      <div className="modal-card">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase size={18} className="modal-icon" />
          <span className="modal-text-strong">Selected Baggage</span>
        </div>
        {selectedBaggage?.options?.map(baggage => (
          <div key={baggage.code} className="text-sm">
            <span className="modal-text-base">{baggage.description}</span>
            <span className="text-gray-500 ml-2">₹{baggage.price.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Close Button */}
        <button 
          onClick={() => dispatch(closeModal())}
          className="modal-close-btn"
        >
          <X size={24} className="modal-text-base" />
        </button>

        {/* Flight Banner */}
        <div className="modal-banner">
          <div className="absolute inset-0 flex items-center justify-center">
            <Plane size={120} className="text-white/20 rotate-45" />
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-12">
            <div className="text-white text-center">
              <p className="text-3xl font-bold">{flightData.originAirport?.code}</p>
              <p className="text-sm mt-2">{flightData.departureTime}</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-px bg-white/20 relative">
                <Plane size={24} className="text-white absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 rotate-45" />
              </div>
            </div>
            <div className="text-white text-center">
              <p className="text-3xl font-bold">{flightData.arrivalAirport?.code}</p>
              <p className="text-sm mt-2">{flightData.arrivalTime}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="modal-content">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="modal-section">
              <h2 className="text-xl font-bold mb-4 modal-text-strong">Flight Details</h2>
              <div className="modal-grid-3">
                <div className="flex items-center gap-2">
                  <Plane size={18} className="modal-icon" />
                  <span className="modal-text-base">{flightData.airline} - {flightData.flightCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="modal-icon" />
                  <span className="modal-text-base">{flightData.flightDuration}</span>
                </div>
              </div>
            </div>

            {/* Airports */}
            <div className="modal-section">
              <h3 className="modal-section-title">
                <MapPin size={18} className="modal-icon" />
                Airport Information
              </h3>
              <div className="modal-grid-2">
                {/* Departure Airport */}
                <div className="modal-card">
                  <h4 className="modal-text-strong mb-2">Departure Airport</h4>
                  <div className="space-y-1">
                    <p className="modal-text-base">{flightData.originAirport?.name}</p>
                    <p className="modal-text-base">
                      <span className="modal-text-strong">Code: </span>
                      {flightData.originAirport?.code}
                    </p>
                    <p className="modal-text-base">
                      {flightData.originAirport?.city}, {flightData.originAirport?.country}
                    </p>
                  </div>
                </div>
                {/* Arrival Airport */}
                <div className="modal-card">
                  <h4 className="modal-text-strong mb-2">Arrival Airport</h4>
                  <div className="space-y-1">
                    <p className="modal-text-base">{flightData.arrivalAirport?.name}</p>
                    <p className="modal-text-base">
                      <span className="modal-text-strong">Code: </span>
                      {flightData.arrivalAirport?.code}
                    </p>
                    <p className="modal-text-base">
                      {flightData.arrivalAirport?.city}, {flightData.arrivalAirport?.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Segments */}
            {flightData.segments && flightData.segments.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">
                  <Plane size={18} className="modal-icon" />
                  Flight Segments
                </h3>
                <div className="space-y-4">
                  {flightData.segments.map((segment, index) => (
                    <div key={`${segment.flightNumber || index}`} className="modal-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="modal-text-strong">
                            {segment.origin} → {segment.destination}
                          </h4>
                          <p className="modal-text-base text-sm">
                            Flight {segment.flightNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="modal-text-base text-sm">
                            Duration: {Math.floor(segment.duration / 60)}h {segment.duration % 60}m
                          </p>
                          {segment.groundTime > 0 && (
                            <p className="text-sm text-blue-500">
                              Layover: {Math.floor(segment.groundTime / 60)}h {segment.groundTime % 60}m
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 modal-grid-2">
                        <div>
                          <p className="text-sm modal-text-strong">Departure</p>
                          <p className="text-sm modal-text-base">
                            {formatTime(segment.departureTime, segment.departureTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm modal-text-strong">Arrival</p>
                          <p className="text-sm modal-text-base">
                            {formatTime(segment.arrivalTime, segment.arrivalTime)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 modal-grid-2">
                        <div>
                          <p className="text-sm modal-text-base">
                            <span className="modal-text-strong">Baggage:</span> {segment.baggage}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm modal-text-base">
                            <span className="modal-text-strong">Cabin:</span> {segment.cabinBaggage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seat Selection */}
            {flightData.segments && flightData.segments.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">
                  <Armchair size={18} className="modal-icon" />
                  Seat Selection
                </h3>
                {flightData.segments.map((segment, index) => (
                  <div key={`seat-${segment.flightNumber || index}`}>
                    <h4 className="modal-text-strong mb-2">
                      {segment.origin} → {segment.destination}
                    </h4>
                    {renderSeatSelection(segment)}
                  </div>
                ))}
              </div>
            )}

            {/* Meal Selection */}
            {flightData.segments && flightData.segments.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">
                  <Utensils size={18} className="modal-icon" />
                  Meal Selection
                </h3>
                {flightData.segments.map((segment, index) => (
                  <div key={`meal-${segment.flightNumber || index}`}>
                    <h4 className="modal-text-strong mb-2">
                      {segment.origin} → {segment.destination}
                    </h4>
                    {renderMealSelection(segment)}
                  </div>
                ))}
              </div>
            )}

            {/* Baggage Selection */}
            {flightData.segments && flightData.segments.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">
                  <Briefcase size={18} className="modal-icon" />
                  Baggage Selection
                </h3>
                {flightData.segments.map((segment, index) => (
                  <div key={`baggage-${segment.flightNumber || index}`}>
                    <h4 className="modal-text-strong mb-2">
                      {segment.origin} → {segment.destination}
                    </h4>
                    {renderBaggageSelection(segment)}
                  </div>
                ))}
              </div>
            )}

            {/* Refund Status */}
            <div className="modal-section">
              <h3 className="modal-section-title">
                <AlertTriangle size={18} className="modal-icon" />
                Refund Status
              </h3>
              <div className={flightData.isRefundable ? 'modal-status-success' : 'modal-status-error'}>
                {flightData.isRefundable ? 'Refundable' : 'Non-Refundable'}
              </div>
            </div>
            
            {flightData.fareRules && (
              <div className="modal-section">
                <h3 className="modal-section-title">
                  <Info size={18} className="modal-icon" />
                  Fare Rules
                </h3>
                <div 
                  className="modal-info-box"
                  dangerouslySetInnerHTML={{ __html: flightData.fareRules }}
                />
              </div>
            )}

            {/* Important Information */}
            <div className="modal-section">
              <h3 className="modal-section-title">
                <Info size={18} className="modal-icon" />
                Important Information
              </h3>
              <div className="modal-info-box">
                <ul className="space-y-2">
                  <li>• Check-in at least 2 hours before departure for international flights</li>
                  <li>• Valid photo ID required for security verification</li>
                  <li>• Baggage allowance may vary by segment</li>
                  <li>• Fare rules and cancellation policies apply</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightModal;