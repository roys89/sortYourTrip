import { ArrowRight, Clock, Plane, Timer } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { setChangeFlight, setSelectedFlight } from '../../redux/slices/flightSlice';
import './Card.css';

const FlightCard = ({ flight }) => {
  const dispatch = useDispatch();
  const flightData = flight?.flightData;

  if (!flightData) {
    return null;
  }

  const formatTime = (date, time) => {
    return time || 'Not available';
  };

  return (
    <div className="common-card-base">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Main Content */}
          <div className="flex-grow space-y-6">
            {/* Airline Info */}
            <div className="flex items-center space-x-3">
              <Plane size={24} className="text-blue-500" />
              <div>
                <h3 className="text-xl font-bold text-white">
                  {flightData.airline}
                </h3>
                <span className="text-gray-300 text-sm">
                  Flight {flightData.flightCode}
                </span>
              </div>
            </div>

            {/* Flight Segments */}
            {flightData.segments.map((segment, index) => (
              <div key={segment.flightNumber}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Departure */}
                  <div className="space-y-1">
                    <p className="font-semibold text-lg text-white">{segment.origin}</p>
                    <div className="flex items-center space-x-2 text-gray-100">
                      <Timer size={16} className="text-blue-500" />
                      <span>{formatTime(segment.departureTime, new Date(segment.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }))}</span>
                    </div>
                    {index === 0 && (
                      <span className="text-gray-300 text-sm">{flightData.originAirport?.code}</span>
                    )}
                  </div>

                  {/* Flight Duration */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-sm text-gray-300">{`${Math.floor(segment.duration / 60)}h ${segment.duration % 60}m`}</span>
                    <div className="w-full flex items-center justify-center relative">
                      <div className="h-[2px] bg-gray-700 w-full relative">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <Plane size={16} className="text-blue-500 transform rotate-90" />
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-blue-500 absolute right-0 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <span className="text-xs text-gray-300">Flight {segment.flightNumber}</span>
                  </div>

                  {/* Arrival */}
                  <div className="space-y-1 md:text-right">
                    <p className="font-semibold text-lg text-white">{segment.destination}</p>
                    <div className="flex items-center space-x-2 text-gray-100 md:justify-end">
                      <Timer size={16} className="text-blue-500" />
                      <span>{formatTime(segment.arrivalTime, new Date(segment.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }))}</span>
                    </div>
                    {index === flightData.segments.length - 1 && (
                      <span className="text-gray-300 text-sm">{flightData.arrivalAirport?.code}</span>
                    )}
                  </div>
                </div>

                {/* Layover Information */}
                {index < flightData.segments.length - 1 && segment.groundTime && (
                  <div className="flex justify-center my-4">
                    <div className="flex items-center space-x-2 text-gray-300 bg-gray-800 bg-opacity-50 px-4 py-2 rounded-full">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-sm">Layover at {flightData.segments[index + 1].origin}: {Math.floor(segment.groundTime / 60)}h {segment.groundTime % 60}m</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Column - Price and Buttons */}
          <div className="flex flex-col space-y-4 sm:w-auto w-full lg:min-w-[140px]">
           
            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => dispatch(setSelectedFlight(flight))}
                className="common-button-base common-button-view"
              >
                View Details
              </button>
              <button 
                onClick={() => dispatch(setChangeFlight(flight))}
                className="common-button-base common-button-change"
              >
                Change Flight
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;