import { Briefcase, Calendar, Clock, MapPin, Plane, Users, X } from 'lucide-react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../redux/slices/flightSlice';

const FlightModal = () => {
  const dispatch = useDispatch();
  const { selectedFlight, isModalOpen } = useSelector(state => state.flights);

  if (!isModalOpen || !selectedFlight) return null;

  const { flightData } = selectedFlight;

  const renderAirportDetails = (airport, type) => {
    if (!airport) return null;
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">{type}:</p>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">{airport.name}</p>
          <div className="flex gap-2 text-sm text-gray-600">
            <span className="font-medium">Code:</span>
            <span>{airport.code}</span>
          </div>
          <div className="flex gap-2 text-sm text-gray-600">
            <span>{airport.city},</span>
            <span>{airport.country}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 pb-4">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Close Button */}
        <button 
          onClick={() => dispatch(closeModal())}
          className="absolute right-4 top-4 z-50 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X size={24} className="text-gray-500 hover:text-gray-700" />
        </button>

        {/* Flight Banner */}
        <div className="flex-shrink-0">
          <div className="relative h-72 w-full rounded-t-xl overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute inset-0 flex items-center justify-center">
              <Plane size={120} className="text-white/20 transform rotate-45" />
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-12">
              <div className="text-white text-center">
                <p className="text-3xl font-bold">{flightData.originAirport?.code}</p>
                <p className="text-sm mt-2">{flightData.departureTime}</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-0.5 bg-white/20 relative">
                  <Plane size={24} className="text-white absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 rotate-45" />
                </div>
              </div>
              <div className="text-white text-center">
                <p className="text-3xl font-bold">{flightData.arrivalAirport?.code}</p>
                <p className="text-sm mt-2">{flightData.arrivalTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-bold mb-4">Flight Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Plane size={18} className="text-blue-500" />
                  <span>{flightData.airline} - {flightData.flightCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  <span>{flightData.flightDuration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">${flightData.price}</span>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="border-b pb-4">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Departure</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Date: {flightData.departureDate}</p>
                    <p>Time: {flightData.departureTime}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Arrival</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Time: {flightData.arrivalTime}</p>
                    {flightData.landingTime && (
                      <p>Landing: {new Date(flightData.landingTime).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Airports */}
            <div className="border-b pb-4">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" />
                Airport Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderAirportDetails(flightData.originAirport, 'Departure Airport')}
                {renderAirportDetails(flightData.arrivalAirport, 'Arrival Airport')}
              </div>
            </div>

            {/* Transport Details */}
            {flightData.transportDetails && (
              <div className="border-b pb-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-500" />
                  Transport Details
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Comfort Level: {flightData.transportDetails.comfort}</p>
                  {flightData.transportDetails.amenities && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                      <ul className="grid grid-cols-2 gap-2">
                        {flightData.transportDetails.amenities.map((amenity, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{amenity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Travelers */}
            {flightData.travelers && flightData.travelers.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Travelers
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {flightData.travelers.map((traveler, index) => (
                    <div key={index} className="space-y-1 text-sm text-gray-600">
                      <p>Adults: {traveler.adults}</p>
                      {traveler.children > 0 && <p>Children: {traveler.children}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightModal;