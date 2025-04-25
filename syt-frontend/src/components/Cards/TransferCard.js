import { CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Clock, Eye, Info, MapPin, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchItinerary } from '../../redux/slices/itinerarySlice';
import { setChangeTransfer, setSelectedTransfer } from '../../redux/slices/transferSlice';
import './Card.css';

const PLACEHOLDER_IMAGE = '/assets/images/api/placeholder/400/320';

const truncateAddress = (address, maxLength = 40) => {
  return address && address.length > maxLength 
    ? `${address.slice(0, maxLength)}...`
    : address;
};

const TransferCard = ({ 
  transfer, 
  itineraryToken, 
  inquiryToken, 
  city,
  date,
  showRemove = false 
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);

  // Apply theme classes directly
  const themeClass = theme.palette.mode === 'light' ? 'light-theme' : '';
  const themeAttr = theme.palette.mode === 'light' ? 'light' : 'dark';

  // Determine icon colors based on theme
  const iconColor = theme.palette.mode === 'dark' 
    ? theme.palette.primary.main  // Teal in dark mode
    : theme.palette.primary.main; // Dark green in light mode

  const formatTransferType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const handleRemoveTransfer = async () => {
    if (!itineraryToken || !inquiryToken || !city || !date || !transfer.details.quotation_id) {
      setError("Cannot remove transfer: Missing required information.");
      console.error("Missing data for remove transfer:", { 
        itineraryToken, 
        inquiryToken, 
        city, 
        date, 
        quotation_id: transfer.details.quotation_id 
      });
      return;
    }

    setIsRemoving(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/itinerary/${itineraryToken}/transfer`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            cityName: city,
            date: date,
            quotation_id: transfer.details.quotation_id
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove transfer');
      }

      await dispatch(fetchItinerary({ itineraryToken, inquiryToken })).unwrap();

    } catch (error) {
      console.error('Error removing transfer:', error);
      setError(`Error removing transfer: ${error.message}`);
    } finally {
      setIsRemoving(false);
    }
  };

  const vehicle = transfer.details.selectedQuote?.quote?.vehicle;

  return (
    <div className={`card-wrapper ${themeClass}`} data-theme={themeAttr}>
      {/* Image Container */}
      <div className="card-image-container">
        <div className="card-image-overlay"></div>
        <img 
          src={vehicle?.vehicleImages?.ve_im_url || PLACEHOLDER_IMAGE}
          alt={vehicle?.ve_similar_types || 'Transfer vehicle'}
          className="card-image"
        />
        <div className="shine-effect"></div>
        
        {/* Duration tag */}
        {transfer.details.duration && (
          <div className="activity-tag">
            <Clock size={14} color="#fff" />
            <span>{transfer.details.duration} min</span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="card-content-wrapper">
        {/* Title and Vehicle Info */}
        <div className="flex justify-between items-center">
          <h3 
            className="text-xl font-bold"
            style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
          >
            {formatTransferType(transfer.type)}
          </h3>
          
          {/* Show pickup date and time from selectedQuote data */}
          {transfer.details.selectedQuote?.routeDetails?.pickup_date && (
            <div 
              className="text-sm whitespace-nowrap"
              style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
            >
              {new Date(transfer.details.selectedQuote.routeDetails.pickup_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })} {' '}
              {new Date(transfer.details.selectedQuote.routeDetails.pickup_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          )}
          {/* Fallback to date if pickup_date is not available */}
          {!transfer.details.selectedQuote?.routeDetails?.pickup_date && transfer.details.date && (
            <div 
              className="text-sm whitespace-nowrap"
              style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
            >
              {new Date(transfer.details.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
        
        {/* Vehicle type */}
        {vehicle?.ve_class && (
          <div 
            className="text-sm"
            style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
          >
            {vehicle?.ve_class} - {vehicle?.ve_similar_types}
          </div>
        )}

     {/* Transfer Route with origin-destination - horizontal layout */}
     <div className="mt-3 flex justify-between items-center gap-6">
          {/* Origin */}
          <div className="flex items-start gap-2">
            <div style={{ marginTop: "2px" }}>
              <div 
                style={{ 
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  backgroundColor: theme.palette.mode === 'light' ? '#093923' : '#2A9D8F'
                }}
              ></div>
            </div>
            <div>
              <div 
                className="text-sm font-medium"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
              >
                From:
              </div>
              <div 
                className="text-sm"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                {truncateAddress(transfer.details.origin?.display_address, 25)}
              </div>
            </div>
          </div>
          
          {/* Connection Arrow */}
          <div className="flex items-center">
            <div 
              style={{ 
                width: "40px", 
                height: "2px", 
                backgroundColor: theme.palette.mode === 'light' ? '#093923' : '#2A9D8F'
              }}
            ></div>
            <div 
              style={{ 
                width: "0", 
                height: "0", 
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: `8px solid ${theme.palette.mode === 'light' ? '#093923' : '#2A9D8F'}`
              }}
            ></div>
          </div>
          
          {/* Destination */}
          <div className="flex items-start gap-2">
            <div style={{ marginTop: "2px" }}>
              <div 
                style={{ 
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  backgroundColor: theme.palette.mode === 'light' ? '#d32f2f' : '#E63946'
                }}
              ></div>
            </div>
            <div>
              <div 
                className="text-sm font-medium"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
              >
                To:
              </div>
              <div 
                className="text-sm"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                {truncateAddress(transfer.details.destination?.display_address, 25)}
              </div>
            </div>
          </div>
        </div>

        {/* Journey Details and Action Buttons in one row */}
        <div className="card-footer">
  {/* Journey Details */}
  <div className="card-details">
    <div className="flex items-center gap-4">
      {transfer.details.distance && (
        <div className="flex items-center gap-2">
          <MapPin 
            size={16} 
            style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
          />
          <span 
            className="text-sm"
            style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
          >
            {transfer.details.distance}
          </span>
        </div>
      )}
      
      {transfer.details.serviceLevel && (
        <div className="flex items-center gap-2">
          <Info 
            size={16} 
            style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
          />
          <span 
            className="text-sm"
            style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
          >
            {transfer.details.serviceLevel}
          </span>
        </div>
      )}
    </div>
  </div>

  {/* Action Buttons */}
  <div className="card-actions">
    <button 
      onClick={() => dispatch(setSelectedTransfer(transfer))}
      className="premium-button btn-view"
    >
      <div className="btn-icon-container">
        <Eye size={16} />
      </div>
    </button>
    
    <button 
      onClick={() => dispatch(setChangeTransfer(transfer))}
      className="premium-button btn-change"
    >
      <div className="btn-icon-container">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        <span>Change Transfer</span>
      </div>
    </button>
    
    {showRemove && (
      <button 
        onClick={handleRemoveTransfer}
        disabled={isRemoving}
        className="premium-button btn-remove"
      >
        {isRemoving ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <div className="btn-icon-container">
            <Trash2 size={16} />
          </div>
        )}
      </button>
    )}
  </div>
</div>

      </div>
      
      {error && (
        <div className="mt-3 px-3 py-2 rounded bg-red-100 border border-red-300" style={{ color: '#dc2626' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default TransferCard;