// components/Itinerary/CityAccordion.jsx
import { DateTime } from 'luxon';
import React from 'react';
import DayAccordion from './DayAccordion';

const CityAccordion = ({ city, inquiryToken, travelersDetails }) => {
  const formatDate = (dateString) => {
    // Convert UTC date to local time and format
    return DateTime.fromISO(dateString)
      .toLocal()
      .toFormat('MM/dd/yyyy');
  };

  return (
    <div className="mb-6 shadow-lg rounded-lg overflow-hidden">
      <div className="w-full p-4 bg-blue-500 text-white flex justify-between items-center">
        <div className="flex flex-col items-start">
          <span className="text-lg font-semibold">
            {city.city}, {city.country}
          </span>
          <span className="text-sm opacity-80">
            {formatDate(city.startDate)} - {formatDate(city.endDate)}
          </span>
        </div>
      </div>

      <div className="border border-t-0 border-gray-200 rounded-b bg-white">
        <div className="p-4 space-y-4">
          {city.days?.map((day, index) => (
            <DayAccordion 
              key={`${day.date}-${index}`}
              day={day} 
              city={city.city}
              inquiryToken={inquiryToken}
              travelersDetails={travelersDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CityAccordion;