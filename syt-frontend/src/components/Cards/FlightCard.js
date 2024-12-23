import { useTheme } from '@mui/material/styles';
import { ArrowRight, Plane, Timer } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { setChangeFlight, setSelectedFlight } from '../../redux/slices/flightSlice';
import './Card.css';

const FlightCard = ({ flight }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { flightData } = flight;

  // Determine icon colors based on theme
  const iconColor = theme.palette.mode === 'dark' 
    ? '#60A5FA'  // Light blue for dark mode
    : '#1D4ED8'; // Darker blue for light mode

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
              <Plane size={24} color={iconColor} />
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
                <p className="font-semibold text-lg text-white">
                  {flightData.origin}
                </p>
                <div className="flex items-center space-x-2 text-gray-100">
                  <Timer size={16} color={iconColor} />
                  <span>{formatTime(flightData.departureDate, flightData.departureTime)}</span>
                </div>
              </div>

              {/* Flight Duration */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-sm text-gray-300">{flightData.flightDuration}</span>
                <div className="w-full flex items-center justify-center relative">
                  <div className="h-[2px] bg-gray-700 w-full relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Plane size={16} color={iconColor} className="transform rotate-90" />
                    </div>
                  </div>
                  <ArrowRight size={16} color={iconColor} className="absolute right-0 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Arrival */}
              <div className="space-y-1 md:text-right">
                <p className="font-semibold text-lg text-white">
                  {flightData.destination}
                </p>
                <div className="flex items-center space-x-2 text-gray-100 md:justify-end">
                  <Timer size={16} color={iconColor} />
                  <span>{formatTime(flightData.departureDate, flightData.arrivalTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Price and Buttons */}
          <div className="flex flex-col space-y-4 sm:w-auto w-full lg:min-w-[140px]">
         

            {/* Action Buttons - Vertically Stacked */}
            <div className="flex flex-col space-y-2 w-full">
              <button 
                onClick={() => dispatch(setSelectedFlight(flight))}
                className="common-button-base common-button-view w-full"
              >
                View Details
              </button>
              <button 
                onClick={() => dispatch(setChangeFlight(flight))}
                className="common-button-base common-button-change w-full"
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