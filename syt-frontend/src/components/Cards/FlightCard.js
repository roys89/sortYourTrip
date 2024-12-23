import { ArrowRight, Plane, Timer } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { setChangeFlight, setSelectedFlight } from '../../redux/slices/flightSlice';

const FlightCard = ({ flight }) => {
  const dispatch = useDispatch();
  const { flightData } = flight;

  const formatTime = (date, time) => {
    return time || 'Not available';
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-gray-700/50">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Main Content */}
          <div className="flex-grow space-y-6">
            {/* Airline Info */}
            <div className="flex items-center space-x-3">
              <Plane size={24} className="text-blue-300" />
              <div>
                <h3 className="text-xl font-bold text-white">
                  {flightData.airline}
                </h3>
                <span className="text-gray-300 text-sm">
                  Flight {flightData.flightCode}
                </span>
              </div>
            </div>

            {/* Flight Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Departure */}
              <div className="space-y-1">
                <p className="font-semibold text-lg text-white">{flightData.origin}</p>
                <div className="flex items-center space-x-2 text-gray-100">
                  <Timer size={16} className="text-blue-300" />
                  <span>{formatTime(flightData.departureDate, flightData.departureTime)}</span>
                </div>
              </div>

              {/* Flight Duration */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-sm text-gray-300">{flightData.flightDuration}</span>
                <div className="w-full flex items-center justify-center relative">
                  <div className="h-[2px] bg-gray-700 w-full relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Plane size={16} className="text-blue-300 transform rotate-90" />
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-blue-300 absolute right-0 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Arrival */}
              <div className="space-y-1 md:text-right">
                <p className="font-semibold text-lg text-white">{flightData.destination}</p>
                <div className="flex items-center space-x-2 text-gray-100 md:justify-end">
                  <Timer size={16} className="text-blue-300" />
                  <span>{formatTime(flightData.departureDate, flightData.arrivalTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Price and Buttons */}
          <div className="flex flex-col space-y-4 sm:w-auto w-full lg:min-w-[140px]">
            {/* Price */}
            {flightData.price && (
              <div className="text-center lg:text-right">
                <span className="text-lg font-semibold text-blue-300">
                  INR {flightData.price.toLocaleString()}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => dispatch(setSelectedFlight(flight))}
                className="w-full px-4 py-2 bg-blue-500/80 hover:bg-blue-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 backdrop-blur-sm"
              >
                View Details
              </button>
              <button 
                onClick={() => dispatch(setChangeFlight(flight))}
                className="w-full px-4 py-2 bg-green-500/80 hover:bg-green-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 backdrop-blur-sm"
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