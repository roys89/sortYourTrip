import { useTheme } from '@mui/material/styles';
import {
  Briefcase,
  Clock,
  Eye,
  Plane
} from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openSeatModal, setSelectedFlight } from '../../redux/slices/flightSlice';
import './Card.css';

// Map of airline names to image paths
const AIRLINE_IMAGES = {
  'SpiceJet': '/assets/images/airlines/spicejet.jpg',
  'Air India': '/assets/images/airlines/airindia.jpg',
  'Oman Aviation': '/assets/images/airlines/oman.jpg',
  'AI Express': '/assets/images/airlines/airindiaexpress.jpg',
  'Saudi Arabian Airlines': '/assets/images/airlines/saudia.jpg',
  'ETIHAD AIRWAYS': '/assets/images/airlines/etihad.jpg',
  'Srilankan Airlines': '/assets/images/airlines/srilankan.jpg',
  'Azerbaijan Airlines': '/assets/images/airlines/azerbaijan.jpg',
  'Indigo': '/assets/images/airlines/indigo.jpg',
  'Kuwait Airways': '/assets/images/airlines/kuwait.jpg',
  'Lufthansa': '/assets/images/airlines/lufthansa.jpg',
  'Emirates Airlines': '/assets/images/airlines/emirates.jpg'
};

// Default image if airline not in map
const DEFAULT_AIRLINE_IMAGE = '/api/placeholder/400/300';

// Flight path images
const FLIGHT_PATH_IMAGES = {
  light: '/assets/images/light_flight.png',
  dark: '/assets/images/dark_flight.png'
};

const FlightCard = ({ 
  flight, 
  inquiryToken,
  itineraryToken,
  travelersDetails,
  showChange = false,
  showTimelineIcon = false
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const flightData = flight?.flightData;

  // Apply theme classes directly
  const themeClass = theme.palette.mode === 'light' ? 'light-theme' : '';
  const themeAttr = theme.palette.mode === 'light' ? 'light' : 'dark';



  if (!flightData) return null;

  const formatTime = (time) => {
    if (!time) return 'Not available';
    const dateTime = new Date(time);
    return dateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatDate = (time) => {
    if (!time) return 'Not available';
    const dateTime = new Date(time);
    return dateTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAirlineImage = () => {
    // Check if the airline name exists in our mapping
    return AIRLINE_IMAGES[flightData.airline] || DEFAULT_AIRLINE_IMAGE;
  };

  const handleViewDetails = () => {
    dispatch(setSelectedFlight(flight));
  };

  const handleChangeFlight = () => {
    navigate('/flights', { 
      state: {
        type: flightData.type,
        origin: flightData.originAirport,
        destination: flightData.arrivalAirport,
        departureDate: flightData.departureDate,
        inquiryToken,
        itineraryToken,
        travelersDetails,
        oldFlightCode: flightData.flightCode,
        existingFlightPrice: flightData.fareDetails?.finalFare
      }
    });
  };

  const handleChooseSeats = () => {
    const flightWithFullSeatMap = {
      ...flight,
      flightData: {
        ...flightData,
        // Keep the original seatMap
        seatMap: flightData.seatMap,
        // If seats are already selected, include them
        selectedSeats: flightData.selectedSeats || null
      }
    };
  
    dispatch(openSeatModal({ 
      ...flightWithFullSeatMap,
      inquiryToken,
      itineraryToken,
      travelersDetails
    }));
  };

  const hasAvailableSeats = flightData.seatMap?.some(segment => 
    segment.rows.some(row => 
      row.seats.some(seat => !seat.isBooked)
    )
  );

  const renderTimelineIcon = () => {
    if (!showTimelineIcon) return null;
    
    return (
      <>
        <div className="timeline-line"></div>
        <div className="timeline-icon">
          <Plane size={22} />
        </div>
        <div className="timeline-label">Flight</div>
      </>
    );
  };

  // Get only the first segment for simplicity
  const mainSegment = flightData.segments[0];

  // Get current theme mode flight path image
  const flightPathImage = theme.palette.mode === 'light' 
    ? FLIGHT_PATH_IMAGES.light 
    : FLIGHT_PATH_IMAGES.dark;

  return (
    // Removed padding-left from timeline-container style
    <div className={`card-wrapper ${themeClass}`} data-theme={themeAttr}>
      {renderTimelineIcon()}
      
      <div className="card-wrapper">
        {/* Flight Image */}
        <div className="card-image-container">
          
          <img 
            src={getAirlineImage()} 
            alt={`${flightData.airline} flight`}
            className="card-image" 
          />
          <div className="shine-effect"></div>
          
          {/* Flight badge */}
          <div className="flight-badge">
            <Plane size={14} />
            <span>{flightData.flightCode}</span>
          </div>
        </div>

        {/* Content */}
        <div className="card-content-wrapper">
          {/* Airline and Date */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 
                className="text-xl font-bold"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
              >
                {flightData.airline}
              </h3>
            </div>
            
            {flightData.departureDate && (
              <div 
                className="text-sm whitespace-nowrap"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                {new Date(flightData.departureDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>

          {/* Flight Route - Exact match to reference image */}
          <div className="travel-info">
            <div className="travel-route">
              {/* Origin */}
              <div className="travel-endpoint">
                <div 
                  className="endpoint-city"
                  style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
                >
                  {mainSegment.origin}
                </div>
                <div 
                  className="endpoint-time"
                  style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                >
                  {formatTime(mainSegment.departureTime)}
                </div>
                <div 
                  className="endpoint-date"
                  style={{ color: theme.palette.mode === 'light' ? '#477667' : '#9ca3af' }}
                >
                  {new Date(mainSegment.departureTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Duration */}
              <div className="travel-duration">
                <div 
                  className="duration-text"
                  style={{ color: theme.palette.mode === 'light' ? '#477667' : '#9ca3af' }}
                >
                  {`${Math.floor(mainSegment.duration / 60)}h ${mainSegment.duration % 60}m`}
                </div>
                <div className="flight-path-container">
                  <img 
                    src={flightPathImage}
                    alt="Flight path"
                    className="flight-path-image"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="travel-endpoint">
                <div 
                  className="endpoint-city"
                  style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
                >
                  {mainSegment.destination}
                </div>
                <div 
                  className="endpoint-time"
                  style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                >
                  {formatTime(mainSegment.arrivalTime)}
                </div>
                <div 
                  className="endpoint-date"
                  style={{ color: theme.palette.mode === 'light' ? '#477667' : '#9ca3af' }}
                >
                  {new Date(mainSegment.arrivalTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Baggage Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-end">
            <div className="flex items-center gap-2">
              <Briefcase 
                size={14} 
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#3cd0be' }}
              />
              <span 
                className="text-xs"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                Check-in: {mainSegment.baggage}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Briefcase 
                size={14} 
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#3cd0be' }}
              />
              <span 
                className="text-xs"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                Cabin: {mainSegment.cabinBaggage}
              </span>
            </div>
            
            {flightData.segments.length > 1 && (
              <div className="flex items-center gap-2">
                <Clock 
                  size={14} 
                  style={{ color: theme.palette.mode === 'light' ? '#093923' : '#3cd0be' }}
                />
                <span 
                  className="text-xs"
                  style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                >
                  {flightData.segments.length - 1} {flightData.segments.length - 1 === 1 ? 'Layover' : 'Layovers'}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="card-actions justify-end">
            <button 
              onClick={handleViewDetails}
              className="premium-button btn-view"
            >
              <div className="btn-icon-container">
                <Eye size={16} />
              </div>
            </button>
            
            {hasAvailableSeats && (
              <button 
                onClick={handleChooseSeats}
                className="premium-button btn-view"
              >
                <div className="btn-icon-container">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 9h-6.5a3.5 3.5 0 0 0 0 7h.5" />
                    <path d="M16 16v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{flightData.isSeatSelected ? 'Change Seats' : 'Choose Seats'}</span>
                </div>
              </button>
            )}
            
            {showChange && (
              <button 
                onClick={handleChangeFlight}
                className="premium-button btn-change"
              >
                <div className="btn-icon-container">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <span>Change Flight</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;