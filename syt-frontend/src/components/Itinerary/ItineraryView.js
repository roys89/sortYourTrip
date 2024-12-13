// components/Itinerary/ItineraryView.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import CityAccordion from './CityAccordion';
import PriceSummary from './PriceSummary';

const ItineraryView = () => {
  const { data, loading, error } = useSelector(state => state.itinerary);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No itinerary data available</div>;

  return (
    <div className="container mx-auto p-4">
  <PriceSummary itinerary={data} />
  {data.cities.map((city, index) => {
    return (
      <CityAccordion 
        key={index} 
        city={city} 
        inquiryToken={data.inquiryToken}
        travelersDetails={data.travelersDetails}
      />
    );
  })}
</div>
  );
};

export default ItineraryView;