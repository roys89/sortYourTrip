import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { DateTime } from 'luxon';
import React from 'react';
import './CityAccordion.css';
import DayAccordion from './DayAccordion';

const CityAccordion = ({ city, inquiryToken, travelersDetails }) => {
  const formatDate = (dateString) => {
    return DateTime.fromISO(dateString)
      .toLocal()
      .toFormat('dd MMM, yyyy');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="city-accordion"
    >
      <div className="city-header">
        <div className="city-info">
          <div className="city-icon">
            <MapPin size={24} className="text-blue-400" />
          </div>
          <div className="city-details">
            <h3 className="city-name">
              {city.city}, {city.country}
            </h3>
            <p className="city-dates">
              {formatDate(city.startDate)} - {formatDate(city.endDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="city-content">
        <div className="days-container">
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
    </motion.div>
  );
};

export default CityAccordion;