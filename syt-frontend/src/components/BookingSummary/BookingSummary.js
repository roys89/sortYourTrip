import { useTheme } from '@mui/material';
import {
  Activity,
  Calendar,
  Car,
  ChevronDown,
  Hotel,
  MapPin,
  Plane,
  Receipt,
  Users
} from 'lucide-react';
import React, { useState } from 'react';

const BookingSummary = ({ itinerary }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState('');
  const [visibleActivities, setVisibleActivities] = useState(2);
  const [visibleFlights, setVisibleFlights] = useState(2);
  const [visibleTransfers, setVisibleTransfers] = useState(2);
  const [visibleHotels, setVisibleHotels] = useState(2);

  // Safe number formatting helper
  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('en-IN') || '0';
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // Safely get all activities across all cities
  const getAllActivities = () => {
    return itinerary?.cities?.flatMap(city =>
      city.days?.flatMap(day =>
        (day.activities || [])
          .filter(a => a.activityType === "online")
          .map(activity => ({ ...activity, date: day.date }))
      )
    ) || [];
  };

  // Safely get all flights across all cities
  const getAllFlights = () => {
    return itinerary?.cities?.flatMap(city =>
      city.days?.flatMap(day => day.flights || [])
    ) || [];
  };

  // Safely get all transfers across all cities
  const getAllTransfers = () => {
    return itinerary?.cities?.flatMap(city =>
      city.days?.flatMap(day => day.transfers || [])
    ) || [];
  };

  // Safely get all hotels across all cities
  const getAllHotels = () => {
    return itinerary?.cities?.flatMap(city =>
      city.days?.flatMap(day => {
        if (!day.hotels) return [];
        return day.hotels.map(hotelEntry => {
          if (hotelEntry.success && hotelEntry.data?.hotelDetails) {
            return hotelEntry.data.hotelDetails;
          }
          return null;
        }).filter(Boolean);
      })
    ) || [];
  };

  // Get trip dates
  const getTripDates = () => {
    if (!itinerary?.cities || itinerary.cities.length === 0) return null;
    
    const firstCity = itinerary.cities[0];
    const lastCity = itinerary.cities[itinerary.cities.length - 1];
    
    return {
      start: firstCity.startDate,
      end: lastCity.endDate
    };
  };
  
  // Calculate trip duration
  const getTripDuration = () => {
    const dates = getTripDates();
    if (!dates) return 0;
    
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Reusable accordion section renderer with smooth animations
  const renderAccordionSection = (
    icon, 
    title, 
    itemCount, 
    sectionKey, 
    renderItems, 
    displayItems, 
    hasMoreItems, 
    setVisibleItems
  ) => {
    const isExpanded = expanded === sectionKey;

    return (
      <div className="mb-5">
        <div 
          className="rounded-xl p-3 cursor-pointer transition-colors duration-200 hover:bg-opacity-80"
          style={{ 
            backgroundColor: 
              theme.palette.mode === "dark"
                ? `rgba(${theme.palette.primary.main}, 0.3)`
                : "rgba(251, 203, 173, 0.3)"
          }}
          onClick={() => setExpanded(isExpanded ? '' : sectionKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {React.cloneElement(icon, { 
                className: "w-5 h-5", 
                style: { color: theme.palette.primary.main } 
              })}
              <span className="font-medium">{title} ({itemCount})</span>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>

        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded 
              ? 'max-h-[1000px] opacity-100 mt-3 visible' 
              : 'max-h-0 opacity-0 mt-0 invisible'
          }`}
        >
          {isExpanded && (
            <div className="space-y-2 transition-opacity duration-300">
              {renderItems(displayItems)}
              {hasMoreItems && (
                <button
                  onClick={() => setVisibleItems(itemCount)}
                  className="w-full py-2 text-sm bg-gray-50 rounded-xl flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors"
                  style={{ color: theme.palette.primary.main }}
                >
                  View All {itemCount} Items
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Updated section rendering methods
  const renderActivitiesSection = () => {
    const allActivities = getAllActivities();
    const displayActivities = allActivities.slice(0, visibleActivities);
    const hasMoreActivities = allActivities.length > visibleActivities;

    return renderAccordionSection(
      <Activity />,
      'Activities',
      allActivities.length,
      'activities',
      (items) => items.map((activity, index) => (
        <div key={index} className="rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">{activity.activityName}</div>
              <div className="text-xs text-gray-500">{formatDate(activity.date)}</div>
            </div>
          </div>
        </div>
      )),
      displayActivities,
      hasMoreActivities,
      setVisibleActivities
    );
  };

  const renderFlightsSection = () => {
    const allFlights = getAllFlights();
    const displayFlights = allFlights.slice(0, visibleFlights);
    const hasMoreFlights = allFlights.length > visibleFlights;

    return renderAccordionSection(
      <Plane />,
      'Flights',
      allFlights.length,
      'flights',
      (items) => items.map((flight, index) => (
        <div key={index} className="rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">
                {flight.flightData?.airline} - {flight.flightData?.flightCode}
              </div>
              <div className="text-xs text-gray-500">
                {flight.flightData?.origin} to {flight.flightData?.destination}
              </div>
            </div>
          </div>
        </div>
      )),
      displayFlights,
      hasMoreFlights,
      setVisibleFlights
    );
  };

  const renderTransfersSection = () => {
    const allTransfers = getAllTransfers();
    const displayTransfers = allTransfers.slice(0, visibleTransfers);
    const hasMoreTransfers = allTransfers.length > visibleTransfers;

    return renderAccordionSection(
      <Car />,
      'Transfers',
      allTransfers.length,
      'transfers',
      (items) => items.map((transfer, index) => (
        <div key={index} className="rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">
                {transfer.type?.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-gray-500">
                {transfer.details?.origin?.display_address} to {transfer.details?.destination?.display_address}
              </div>
            </div>
          </div>
        </div>
      )),
      displayTransfers,
      hasMoreTransfers,
      setVisibleTransfers
    );
  };

  const renderHotelsSection = () => {
    const allHotels = getAllHotels();
    const displayHotels = allHotels.slice(0, visibleHotels);
    const hasMoreHotels = allHotels.length > visibleHotels;

    return renderAccordionSection(
      <Hotel />,
      'Hotels',
      allHotels.length,
      'hotels',
      (items) => items.map((hotel, index) => (
        <div key={index} className="rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">{hotel?.name || 'Unknown Hotel'}</div>
              <div className="text-xs text-gray-500">
                {[
                  hotel?.address?.line1,
                  hotel?.address?.city?.name,
                  hotel?.address?.country?.name
                ].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )),
      displayHotels,
      hasMoreHotels,
      setVisibleHotels
    );
  };

  // Trip overview section
 // Trip overview section
const renderTripOverview = () => {
  const dates = getTripDates();
  if (!dates) return null;
  
  return (
    <div className="rounded-xl mb-5 overflow-hidden">
      <div 
        className="p-3"
        style={{ 
          backgroundColor: 
            theme.palette.mode === "dark"
              ? `rgba(${theme.palette.primary.main}, 0.3)`
              : "rgba(251, 203, 173, 0.3)"
        }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: theme.palette.primary.main }} />
          <span className="font-medium">Trip Overview</span>
        </div>
      </div>
      
      <div className="p-4"
        style={{ 
          backgroundColor: 
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[50]
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500 w-4 h-4" />
            <span className="text-sm text-gray-600">Duration</span>
          </div>
          <span className="text-sm font-medium">{getTripDuration()} Days</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="text-gray-500 w-4 h-4" />
            <span className="text-sm text-gray-600">Travelers</span>
          </div>
          <span className="text-sm font-medium">
            {itinerary?.travelersDetails?.rooms?.reduce((total, room) => {
              const adults = room.adults?.length || 0;
              const children = room.children?.length || 0;
              return total + adults + children;
            }, 0) || 0}
          </span>
        </div>
        
        <div className="border-t border-gray-100 mt-3 pt-3">
          <div className="text-sm text-gray-600 mb-2">Destinations</div>
          {itinerary?.cities?.map((city, index) => (
            <div key={index} className="flex items-start gap-2 mb-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.palette.primary.main }} />
              <div>
                <div className="font-medium text-sm">{city.city}, {city.country}</div>
                <div className="text-xs text-gray-500">
                  {formatDate(city.startDate)} - {formatDate(city.endDate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

  const renderPriceSummary = () => (
    <div className="rounded-xl overflow-hidden">
      <div style={{ backgroundColor: theme.palette.primary.main }} className="text-white p-3 flex items-center gap-2">
        <Receipt className="w-5 h-5" />
        <span className="font-medium">Price Summary</span>
      </div>
      
      <div className="p-4 bg-white">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Subtotal</span>
          <span className="font-medium">₹{formatNumber(itinerary?.priceTotals?.subtotal)}</span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            TCS ({itinerary?.priceTotals?.tcsRate || 0}%)
          </span>
          <span className="text-sm text-gray-600">₹{formatNumber(itinerary?.priceTotals?.tcsAmount)}</span>
        </div>

        <div className="border-t border-gray-200 my-3"></div>

        <div className="flex justify-between items-center bg-gray-50 p-3 -mx-4 -mb-4 mt-2 border-t border-gray-200">
          <span className="font-medium">Total Amount</span>
          <span className="text-lg font-semibold" style={{ color: theme.palette.primary.main }}>
            ₹{formatNumber(itinerary?.priceTotals?.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );

  if (!itinerary) {
    return (
      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
        <div className="animate-pulse flex flex-col items-center justify-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-20">
      <div style={{ backgroundColor: theme.palette.primary.main }} className="text-white p-3 flex items-center gap-2">
        <Receipt className="w-5 h-5" />
        <h2 className="text-lg font-medium">Booking Summary</h2>
      </div>

      <div className="p-4">
        {renderTripOverview()}
        {renderActivitiesSection()}
        {renderFlightsSection()}
        {renderTransfersSection()}
        {renderHotelsSection()}
        {renderPriceSummary()}
      </div>
    </div>
  );
};

export default BookingSummary;