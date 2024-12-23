import { CircularProgress } from '@mui/material';
import { Baby, Clock, Info, MapPin, Trash2, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setChangeActivity, setSelectedActivity } from '../../redux/slices/activitySlice';
import { fetchItinerary } from '../../redux/slices/itinerarySlice';

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
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const displayPrice = useMemo(() => {
    if (activity?.packageDetails?.amount !== undefined && activity?.packageDetails?.currency) {
      return `${activity.packageDetails.currency} ${activity.packageDetails.amount.toLocaleString()}`;
    }
    return "Price on request";
  }, [activity?.packageDetails?.amount, activity?.packageDetails?.currency]);

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
    <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-gray-700/50">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Image Container */}
        <div className="w-full lg:w-80 h-48 lg:h-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <img 
            src={imageUrl}
            alt={activity.activityName || 'Activity'} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading="lazy"
            onError={() => setImageLoadFailed(true)}
          />
        </div>
  
        {/* Content Container */}
        <div className="flex-1 p-6 flex flex-col bg-gray-900/40">
          <div className="flex-grow space-y-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-white leading-tight">
              {activity.activityName || 'Unnamed Activity'}
            </h3>
  
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activity.duration && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Clock size={16} className="text-blue-300 flex-shrink-0" />
                  <span className="text-sm">{activity.duration}</span>
                </div>
              )}
              {activity.departureTime?.time && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Clock size={16} className="text-blue-300 flex-shrink-0" />
                  <span className="text-sm">{activity.departureTime.time}</span>
                </div>
              )}
              {city && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <MapPin size={16} className="text-blue-300 flex-shrink-0" />
                  <span className="text-sm">{city}</span>
                </div>
              )}
              {activity.maxTravelers && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Users size={16} className="text-blue-300 flex-shrink-0" />
                  <span className="text-sm">Max {activity.maxTravelers} travelers</span>
                </div>
              )}
              {activity.minAge && (
                <div className="flex items-center space-x-2 text-gray-100">
                  <Baby size={16} className="text-blue-300 flex-shrink-0" />
                  <span className="text-sm">Age {activity.minAge}+ years</span>
                </div>
              )}
            </div>
  
            {/* Description */}
            <div className="flex space-x-2">
              <Info size={16} className="text-blue-300 flex-shrink-0 mt-1" />
              <p className="text-sm text-gray-100 leading-relaxed">
                {shortDescription}
              </p>
            </div>
          </div>
  
          {/* Price and Actions */}
          <div className="pt-4 mt-4 border-t border-gray-400/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <span className="text-lg font-semibold text-blue-300 whitespace-nowrap">
                {displayPrice}
              </span>
  
              <div className="flex flex-col w-full sm:w-auto sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  onClick={() => dispatch(setSelectedActivity(activity))}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-500/80 hover:bg-blue-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 backdrop-blur-sm"
                >
                  View Details
                </button>
                <button 
                  onClick={handleChangeActivity}
                  className="w-full sm:w-auto px-4 py-2 bg-green-500/80 hover:bg-green-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 backdrop-blur-sm"
                >
                  Change Activity
                </button>
                {showRemove && (
                  <button 
                    onClick={handleRemoveActivity}
                    disabled={isRemoving}
                    className="w-full sm:w-auto px-4 py-2 bg-red-500/80 hover:bg-red-600/90 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap backdrop-blur-sm"
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
            </div>
          </div>
        </div>
      </div>
  
      {error && (
        <div className="px-6 pb-6">
          <div className="p-3 bg-red-900/30 text-red-200 rounded-lg text-sm border border-red-700/50">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};


export default ActivityCard;

