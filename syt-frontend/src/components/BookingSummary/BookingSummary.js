import {
  Activity,
  Car,
  ChevronDown,
  Hotel,
  Plane,
  Receipt
} from 'lucide-react';
import React, { useState } from 'react';

const BookingSummary = ({ itinerary }) => {
  const [expanded, setExpanded] = useState('activities');
  const [visibleActivities, setVisibleActivities] = useState(2);
  const [visibleFlights, setVisibleFlights] = useState(2);
  const [visibleTransfers, setVisibleTransfers] = useState(2);
  const [visibleHotels, setVisibleHotels] = useState(2);

  // Safe number formatting helper
  const formatNumber = (value) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('en-IN') || '0';
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

  const renderActivitiesSection = () => {
    const allActivities = getAllActivities();
    const displayActivities = allActivities.slice(0, visibleActivities);
    const hasMoreActivities = allActivities.length > visibleActivities;

    return (
      <div className="mb-6">
        <div 
          className="bg-white/30 rounded-lg p-4 cursor-pointer"
          onClick={() => setExpanded(expanded === 'activities' ? '' : 'activities')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              <span className="font-medium">Activities ({allActivities.length})</span>
            </div>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${expanded === 'activities' ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {expanded === 'activities' && (
          <div className="mt-4 space-y-4">
            {displayActivities.map((activity, index) => (
              <div key={index} className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{activity.activityName}</div>
                    <div className="text-sm text-gray-600">{activity.date}</div>
                  </div>
                                    
                </div>
              </div>
            ))}
            {hasMoreActivities && (
              <button
                onClick={() => setVisibleActivities(allActivities.length)}
                className="w-full text-blue-600 py-2 hover:text-blue-700 flex items-center justify-center gap-2"
              >
                View All {allActivities.length} Activities
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFlightsSection = () => {
    const allFlights = getAllFlights();
    const displayFlights = allFlights.slice(0, visibleFlights);
    const hasMoreFlights = allFlights.length > visibleFlights;

    return (
      <div className="mb-6">
        <div 
          className="bg-white/30 rounded-lg p-4 cursor-pointer"
          onClick={() => setExpanded(expanded === 'flights' ? '' : 'flights')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-6 h-6" />
              <span className="font-medium">Flights ({allFlights.length})</span>
            </div>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${expanded === 'flights' ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {expanded === 'flights' && (
          <div className="mt-4 space-y-4">
            {displayFlights.map((flight, index) => (
              <div key={index} className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {flight.flightData?.airline} - {flight.flightData?.flightCode}
                    </div>
                    <div className="text-sm text-gray-600">
                      {flight.flightData?.origin} to {flight.flightData?.destination}
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
            {hasMoreFlights && (
              <button
                onClick={() => setVisibleFlights(allFlights.length)}
                className="w-full text-blue-600 py-2 hover:text-blue-700 flex items-center justify-center gap-2"
              >
                View All {allFlights.length} Flights
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTransfersSection = () => {
    const allTransfers = getAllTransfers();
    const displayTransfers = allTransfers.slice(0, visibleTransfers);
    const hasMoreTransfers = allTransfers.length > visibleTransfers;

    return (
      <div className="mb-6">
        <div 
          className="bg-white/30 rounded-lg p-4 cursor-pointer"
          onClick={() => setExpanded(expanded === 'transfers' ? '' : 'transfers')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-6 h-6" />
              <span className="font-medium">Transfers ({allTransfers.length})</span>
            </div>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${expanded === 'transfers' ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {expanded === 'transfers' && (
          <div className="mt-4 space-y-4">
            {displayTransfers.map((transfer, index) => (
              <div key={index} className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {transfer.type?.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transfer.details?.origin?.display_address} to {transfer.details?.destination?.display_address}
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
            {hasMoreTransfers && (
              <button
                onClick={() => setVisibleTransfers(allTransfers.length)}
                className="w-full text-blue-600 py-2 hover:text-blue-700 flex items-center justify-center gap-2"
              >
                View All {allTransfers.length} Transfers
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHotelsSection = () => {
    const allHotels = getAllHotels();
    const displayHotels = allHotels.slice(0, visibleHotels);
    const hasMoreHotels = allHotels.length > visibleHotels;

    return (
      <div className="mb-6">
        <div 
          className="bg-white/30 rounded-lg p-4 cursor-pointer"
          onClick={() => setExpanded(expanded === 'hotels' ? '' : 'hotels')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hotel className="w-6 h-6" />
              <span className="font-medium">Hotels ({allHotels.length})</span>
            </div>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${expanded === 'hotels' ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {expanded === 'hotels' && (
          <div className="mt-4 space-y-4">
            {displayHotels.map((hotel, index) => (
              <div key={index} className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{hotel?.name || 'Unknown Hotel'}</div>
                    <div className="text-sm text-gray-600">
                      {[
                        hotel?.address?.line1,
                        hotel?.address?.city?.name,
                        hotel?.address?.country?.name
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {hasMoreHotels && (
              <button
                onClick={() => setVisibleHotels(allHotels.length)}
                className="w-full text-blue-600 py-2 hover:text-blue-700 flex items-center justify-center gap-2"
              >
                View All {allHotels.length} Hotels
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPriceSummary = () => (
    <div className="bg-white/30 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Price Summary</h3>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Activities Total</span>
          <span className="text-gray-600">₹{formatNumber(itinerary?.priceTotals?.activities)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Hotels Total</span>
          <span className="text-gray-600">₹{formatNumber(itinerary?.priceTotals?.hotels)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Flights Total</span>
          <span className="text-gray-600">₹{formatNumber(itinerary?.priceTotals?.flights)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Transfers Total</span>
          <span className="text-gray-600">₹{formatNumber(itinerary?.priceTotals?.transfers)}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 my-4"></div>

      <div className="flex justify-between mb-2">
        <span>Subtotal</span>
        <span>₹{formatNumber(itinerary?.priceTotals?.subtotal)}</span>
      </div>

      <div className="flex justify-between mb-2">
        <span className="text-gray-600">
          TCS ({itinerary?.priceTotals?.tcsRate || 0}%)
        </span>
        <span className="text-gray-600">₹{formatNumber(itinerary?.priceTotals?.tcsAmount)}</span>
      </div>

      <div className="border-t border-gray-200 my-4"></div>

      <div className="flex justify-between font-medium">
        <span className="text-lg">Total</span>
        <span className="text-lg text-blue-600">₹{formatNumber(itinerary?.priceTotals?.grandTotal)}</span>
      </div>
    </div>
  );

  if (!itinerary) {
    return (
      <div className="bg-white/40 backdrop-blur rounded-lg p-4 text-center">
        Loading booking summary...
      </div>
    );
  }

  return (
    <div className="bg-white/40 backdrop-blur rounded-lg p-4 md:p-6 shadow">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="w-8 h-8" />
        <h2 className="text-2xl font-medium">Booking Summary</h2>
      </div>

      {renderActivitiesSection()}
      {renderFlightsSection()}
      {renderTransfersSection()}
      {renderHotelsSection()}
      {renderPriceSummary()}
    </div>
  );
};

export default BookingSummary;