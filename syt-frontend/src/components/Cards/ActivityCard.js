import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Baby, Clock, Eye, Info, MapPin, Star, Trash2, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setChangeActivity, setSelectedActivity } from '../../redux/slices/activitySlice';
import { fetchItinerary } from '../../redux/slices/itinerarySlice';
import './Card.css';
const PLACEHOLDER_IMAGE = '/assets/images/api/placeholder/activity.png';

const ActivityCard = ({ 
  activity, 
  city, 
  date, 
  inquiryToken, 
  itineraryToken,
  travelersDetails,
  showRemove = false 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [tripAdvisorData, setTripAdvisorData] = useState(null);
  const [isTripAdvisorLoading, setIsTripAdvisorLoading] = useState(false);

  // Apply theme classes directly
  const themeClass = theme.palette.mode === 'light' ? 'light-theme' : '';
  const themeAttr = theme.palette.mode === 'light' ? 'light' : 'dark';

  // Get theme-appropriate colors
  const iconColor = theme.palette.mode === 'dark' 
    ? theme.palette.primary.main  // Use teal from dark theme
    : theme.palette.primary.main; // Use dark green from light theme

  // Fetch TripAdvisor rating when component mounts
  useEffect(() => {
    const fetchTripAdvisorData = async () => {
      if (!activity.activityName || !city) return;
      
      setIsTripAdvisorLoading(true);
      try {
        // Get country from activity if available, otherwise get it from parent component
        // If not available in either, send a default value or exclude it
        const country = activity.country || ''; 
        
        // Only include address if it exists
        const requestBody = {
          name: activity.activityName,
          city,
          country,
          category: 'attractions' // Always use 'attractions' for activities
        };
        
        // Only add address if it exists
        if (activity.address) {
          requestBody.address = activity.address;
        }
        
        const response = await fetch(
          'http://localhost:5000/api/tripadvisor/activity/rating', 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody)
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch TripAdvisor data');
        }
        
        const data = await response.json();
        if (data && data.success) {
          setTripAdvisorData(data.data);
        }
      } catch (err) {
        console.error('Error fetching TripAdvisor data:', err);
      } finally {
        setIsTripAdvisorLoading(false);
      }
    };
    
    fetchTripAdvisorData();
  }, [activity.activityName, activity.country, activity.address, city]);

  const shortDescription = useMemo(() => {
    const desc = activity?.description || "";
    return desc.length > 120 ? `${desc.substring(0, 120)}...` : desc;
  }, [activity?.description]);

  const imageUrl = useMemo(() => {
    if (imageLoadFailed) return PLACEHOLDER_IMAGE;
    if (!activity.images?.length) return PLACEHOLDER_IMAGE;
    const coverImage = activity.images.find(img => img.isCover);
    return coverImage?.variants?.[0]?.url || PLACEHOLDER_IMAGE;
  }, [activity.images, imageLoadFailed]);

  const handleRemoveActivity = async () => {
    if (!itineraryToken) {
      console.error('itineraryToken is missing');
      return;
    }

    try {
      setIsRemoving(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            cityName: city,
            date,
            activityCode: activity.activityCode
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove activity');
      }

      await dispatch(fetchItinerary({ itineraryToken, inquiryToken })).unwrap();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleChangeActivity = () => {
    dispatch(setChangeActivity({
      ...activity,
      city,
      date,
      inquiryToken,
      itineraryToken,
      travelersDetails,
      oldActivityCode: activity.activityCode,
      existingPrice: activity.packageDetails?.amount || 0
    }));

    navigate('/activities', {
      state: {
        city,
        date,
        inquiryToken,
        itineraryToken,
        travelersDetails,
        returnTo: '/itinerary',
        activityCode: activity.activityCode,
        existingPrice: activity.packageDetails?.amount || 0
      }
    });
  };

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }) : '';

  return (
    <div className={`card-wrapper ${themeClass}`} data-theme={themeAttr}>
      {/* Image Container */}
      <div className="card-image-container">
        <div className="card-image-overlay"></div>
        <img 
          src={imageUrl}
          alt={activity.activityName || 'Activity'} 
          className="card-image"
          loading="lazy"
          onError={() => setImageLoadFailed(true)}
        />
        <div className="shine-effect"></div>
        
        {/* Activity type tag */}
        {activity.activityType && (
          <div className="activity-tag">
            <MapPin size={14} color="#fff" />
            <span>{activity.activityType}</span>
          </div>
        )}
      </div>
  
      {/* Content Container */}
      <div className="card-content-wrapper">
        {/* Title and Date */}
        <div className="flex justify-between items-start">
          <h3 
            className="text-xl font-bold"
            style={{ color: theme.palette.mode === 'light' ? '#093923' : '#FFFFFF' }}
          >
            {activity.activityName || 'Unnamed Activity'}
          </h3>
          {formattedDate && (
            <span 
              className="text-sm whitespace-nowrap"
              style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
            >
              {formattedDate}
            </span>
          )}
        </div>
  
        {/* Activity Details */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
          {activity.duration && (
            <div className="flex items-center gap-2">
              <TimerOutlinedIcon   
                size={14} 
                style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
              />
              <span 
                className="text-sm"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                {activity.duration}
              </span>
              hour
            </div>
          )}
          
          {activity.departureTime?.time && (
            <div className="flex items-center gap-2">
              <Clock 
                size={16} 
                style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
              />
              <span 
                className="text-sm"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                {activity.departureTime.time}
              </span>
            </div>
          )}
          
          {city && (
            <div className="flex items-center gap-2">
              <MapPin 
                size={16} 
                style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
              />
              <span 
                className="text-sm"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                {city}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1">
          {activity.maxTravelers && (
            <div className="flex items-center gap-2">
              <Users 
                size={16} 
                style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
              />
              <span 
                className="text-sm"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                Max {activity.maxTravelers}
              </span>
            </div>
          )}
          
          {activity.minAge && (
            <div className="flex items-center gap-2">
              <Baby 
                size={16} 
                style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
              />
              <span 
                className="text-sm"
                style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
              >
                Age {activity.minAge}+
              </span>
            </div>
          )}
        </div>
  
        {/* Description - only if space allows */}
        {shortDescription && shortDescription.length > 0 && (
          <div className="description-container flex gap-2 mt-3">
            <Info 
              size={16} 
              style={{ color: theme.palette.mode === 'light' ? '#093923' : iconColor }}
              className="flex-shrink-0 mt-1"
            />
            <p 
              className="text-sm leading-relaxed"
              style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
            >
              {shortDescription}
            </p>
          </div>
        )}

        {/* TripAdvisor Rating and Action Buttons in the same line */}
        <div className="card-footer">
          {/* TripAdvisor Rating */}
          <div className="card-rating">
            <div className="flex items-center">
              
              {isTripAdvisorLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : tripAdvisorData ? (
                <div className="flex items-center">
                  {/* If we have the rating image URL from TripAdvisor */}
                  {tripAdvisorData.rating_image_url ? (
                    <img 
                      src={tripAdvisorData.rating_image_url} 
                      alt={`${tripAdvisorData.rating} stars`}
                      className="h-4 mr-1"
                    />
                  ) : (
                    // Fallback to star icons if no image URL
                    <>
                      {[1, 2, 3, 4, 5].map((_, index) => {
                        const rating = parseFloat(tripAdvisorData.rating || 0);
                        const isFull = index < Math.floor(rating);
                        const isHalf = !isFull && index === Math.floor(rating) && rating % 1 >= 0.5;
                        
                        return isHalf ? (
                          <div key={index} className="relative" style={{ marginRight: '2px' }}>
                            <Star size={16} fill="transparent" color="#FFC107" />
                            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                              <Star size={16} fill="#FFC107" color="#FFC107" />
                            </div>
                          </div>
                        ) : (
                          <Star 
                            key={index} 
                            size={16} 
                            fill={isFull ? "#FFC107" : "transparent"} 
                            color="#FFC107" 
                            style={{ marginRight: '2px' }}
                          />
                        );
                      })}
                    </>
                  )}
                  <span 
                    className="ml-1 font-bold"
                    style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                  >
                    {tripAdvisorData.rating || '0.0'}
                  </span>
                  {tripAdvisorData.num_reviews && (
                    <span className="ml-1 text-xs opacity-75">
                      ({tripAdvisorData.num_reviews} reviews)
                    </span>
                  )}
                </div>
              ) : (
                // Fallback to hardcoded rating if no TripAdvisor data
                <div className="flex items-center">
                  {/* Full stars */}
                  {[1, 2, 3, 4].map((_, index) => (
                    <Star 
                      key={index} 
                      size={16} 
                      fill="#FFC107" 
                      color="#FFC107" 
                      style={{ marginRight: '2px' }}
                    />
                  ))}
                  {/* Half star - more accurate representation */}
                  <div className="relative" style={{ marginRight: '2px' }}>
                    {/* Empty star as background */}
                    <Star 
                      size={16} 
                      fill="transparent" 
                      color="#FFC107" 
                    />
                    {/* Half-filled star overlaid */}
                    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                      <Star 
                        size={16} 
                        fill="#FFC107" 
                        color="#FFC107" 
                      />
                    </div>
                  </div>
                  <span 
                    className="ml-1 font-bold"
                    style={{ color: theme.palette.mode === 'light' ? '#093923' : '#d1d5db' }}
                  >
                    4.5
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="card-actions">
            <button 
              onClick={() => dispatch(setSelectedActivity(activity))}
              className="premium-button btn-view"
            >
              <div className="btn-icon-container">
                <Eye size={16} />
              </div>
            </button>
            
            <button 
              onClick={handleChangeActivity}
              className="premium-button btn-change"
            >
              <div className="btn-icon-container">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>Change Activity</span>
              </div>
            </button>
            
            {showRemove && (
              <button 
                onClick={handleRemoveActivity}
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
  
        {error && (
          <div className="mt-3 px-3 py-2 rounded bg-red-100 border border-red-300" style={{ color: '#dc2626' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;