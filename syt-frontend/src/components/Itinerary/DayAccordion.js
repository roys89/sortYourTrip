// components/Itinerary/DayAccordion.js
import { Button } from '@mui/material';
import { Plus } from 'lucide-react';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setChangeActivity } from '../../redux/slices/activitySlice';
import ActivityCard from '../Cards/ActivityCard';
import FlightCard from '../Cards/FlightCard';
import HotelCard from '../Cards/HotelCard';
import TransferCard from '../Cards/TransferCard';

const DayAccordion = ({ day, city, inquiryToken, travelersDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { itineraryToken } = useSelector((state) => state.itinerary);

  const formatDate = (dateString) => {
    return DateTime.fromISO(dateString)
      .toLocal()
      .toLocaleString(DateTime.DATE_HUGE);
  };

  const handleAddActivity = () => {
    dispatch(setChangeActivity({
      city,
      date: day.date,
      inquiryToken,
      travelersDetails,
      isNewActivity: true
    }));
    
    navigate('/activities', {
      state: {
        city,
        date: day.date,
        inquiryToken,
        travelersDetails,
        isNewActivity: true
      }
    });
  };

  return (
    <div className="mb-2">
      <button
        className="w-full p-3 bg-gray-200 hover:bg-gray-300 text-gray-800 flex justify-between items-center rounded-t transition duration-150"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium">
            {formatDate(day.date)}
          </span>
        </div>
        <span className="text-xl transform transition-transform duration-200">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border border-t-0 rounded-b bg-white space-y-4">
          {/* Flights Section */}
          {day.flights?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-700">Flights</h3>
              {day.flights.map((flight, index) => (
                <FlightCard 
                  key={`flight-${index}`} 
                  flight={flight} 
                />
              ))}
            </div>
          )}

          {/* Hotels Section */}
          {day.hotels?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-700">Accommodations</h3>
              {day.hotels.map((hotel, index) => (
                <HotelCard 
                  key={`hotel-${index}`} 
                  hotel={hotel}
                  city={city}
                  date={day.date}
                  inquiryToken={inquiryToken}
                  itineraryToken={itineraryToken}
                  travelersDetails={travelersDetails}
                  showChange={true}
                />
              ))}
            </div>
          )}

          {/* Transfers Section */}
          {day.transfers?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-700">Transfers</h3>
              {day.transfers.map((transfer, index) => (
                <TransferCard 
                  key={`transfer-${index}`} 
                  transfer={transfer} 
                />
              ))}
            </div>
          )}

          {/* Activities Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-700">Activities</h3>
            {day.activities?.map((activity, index) => (
              <ActivityCard 
                key={`activity-${index}`}
                activity={activity}
                city={city}
                date={day.date}
                inquiryToken={inquiryToken}
                itineraryToken={itineraryToken}
                travelersDetails={travelersDetails}
                showRemove={true}
              />
            ))}
            
            {/* Add Activity Button - Only show if less than 3 activities */}
            {(!day.activities || day.activities.length < 3) && (
              <Button
                variant="outlined"
                startIcon={<Plus className="w-4 h-4" />}
                onClick={handleAddActivity}
                fullWidth
                sx={{ 
                  mt: 2,
                  py: 1,
                  borderRadius: '8px',
                  textTransform: 'none'
                }}
              >
                Add Activity ({3 - (day.activities?.length || 0)} remaining)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayAccordion;