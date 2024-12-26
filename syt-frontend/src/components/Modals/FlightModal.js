import {
  AlertTriangle,
  Clock,
  Info,
  MapPin, Plane, X
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
    return time || 'Not available';
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
            <div className="modal-section">
              <h3 className="modal-section-title">
                <Plane size={18} className="modal-icon" />
                Flight Segments
              </h3>
              <div className="space-y-4">
                {flightData.segments.map((segment, index) => (
                  <div key={segment.flightNumber} className="modal-card">
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
                          {formatTime(segment.departureTime, new Date(segment.departureTime).toLocaleTimeString())}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm modal-text-strong">Arrival</p>
                        <p className="text-sm modal-text-base">
                          {formatTime(segment.arrivalTime, new Date(segment.arrivalTime).toLocaleTimeString())}
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

            {/* Fare Details */}
            {/* <div className="modal-section">
              <h3 className="modal-section-title">
                <CreditCard size={18} className="modal-icon" />
                Fare Details
              </h3>
              <div className="modal-card">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="modal-text-base">Base Fare:</span>
                    <span className="modal-text-strong">₹{flightData.fareDetails.baseFare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="modal-text-base">Tax & Surcharges:</span>
                    <span className="modal-text-strong">₹{flightData.fareDetails.taxAndSurcharge.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-semibold">
                    <span className="modal-text-strong">Total Fare:</span>
                    <span className="modal-price">₹{flightData.fareDetails.finalFare.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div> */}

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

            {/* Important Information */}
            <div className="modal-section">
              <h3 className="modal-section-title">
                <Info size={18} className="modal-icon" />
                Important Information
              </h3>
              <div className="modal-info-box">
                <ul className="space-y-2">
                  <li>• Check-in at least 2 hours before departure for domestic flights</li>
                  <li>• Valid photo ID required for security verification</li>
                  <li>• Baggage allowance may vary by segment</li>
                  <li>• Fare rules and cancellation policies apply</li>
                </ul>
              </div>
            </div>

            {/* Fare Rules */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightModal;