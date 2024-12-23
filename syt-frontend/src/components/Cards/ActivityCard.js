import { CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Baby, Clock, Info, MapPin, Trash2, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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

  // Determine icon colors based on theme
  const iconColor = theme.palette.mode === 'dark' 
    ? '#60A5FA'  // Light blue for dark mode
    : '#1D4ED8'; // Darker blue for light mode

  const shortDescription = useMemo(() => {
    const desc = activity?.description || "";
    return desc.length > 100 ? `${desc.substring(0, 100)}...` : desc;
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

  return (
    <div className="common-card-base">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Image Container */}
        <div className="common-image-container">
          <div className="common-image-overlay" />
          <img 
            src={imageUrl}
            alt={activity.activityName || 'Activity'} 
            className="common-image"
            loading="lazy"
            onError={() => setImageLoadFailed(true)}
          />
        </div>
  
        {/* Content Container */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-grow space-y-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-white">
              {activity.activityName || 'Unnamed Activity'}
            </h3>
  
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activity.duration && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Clock size={16} color={iconColor} className="flex-shrink-0" />
                  <span className="text-sm">{activity.duration}</span>
                </div>
              )}
              {activity.departureTime?.time && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Clock size={16} color={iconColor} className="flex-shrink-0" />
                  <span className="text-sm">{activity.departureTime.time}</span>
                </div>
              )}
              {city && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <MapPin size={16} color={iconColor} className="flex-shrink-0" />
                  <span className="text-sm">{city}</span>
                </div>
              )}
              {activity.maxTravelers && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Users size={16} color={iconColor} className="flex-shrink-0" />
                  <span className="text-sm">Max {activity.maxTravelers} travelers</span>
                </div>
              )}
              {activity.minAge && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Baby size={16} color={iconColor} className="flex-shrink-0" />
                  <span className="text-sm">Age {activity.minAge}+ years</span>
                </div>
              )}
            </div>
  
            {/* Description */}
            <div className="flex space-x-2">
              <Info size={16} color={iconColor} className="flex-shrink-0 mt-1" />
              <p className="text-sm text-gray-100 leading-relaxed">
                {shortDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons Container - Right-most side */}
        <div className="flex flex-col justify-center p-4 space-y-2">
          <button 
            onClick={() => dispatch(setSelectedActivity(activity))}
            className="common-button-base common-button-view w-full"
          >
            View Details
          </button>
          <button 
            onClick={handleChangeActivity}
            className="common-button-base common-button-change w-full"
          >
            Change Activity
          </button>
          {showRemove && (
            <button 
              onClick={handleRemoveActivity}
              disabled={isRemoving}
              className="common-button-base common-button-remove w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isRemoving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Remove</span>
                </>
              )}
            </button>
          )}
        </div>
  
        {error && (
          <div className="px-6 pb-6">
            <div className="common-error-base">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;