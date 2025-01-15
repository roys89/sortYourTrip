import {
  Alert,
  Button,
  Card,
  Container,
  Stack,
  Typography
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import LoadingSpinner2 from "../../components/common/LoadingSpinner2";
import FlightDetailModal from "./FlightDetailModal";
import FlightFilterMenu from "./FlightFilterMenu";

// FlightCard Component
const FlightCard = React.memo(({ 
  flight, 
  onViewFlight, 
  existingPrice 
}) => {
  const segment = flight.sg[0]; // First segment
  
  const getTimeDuration = () => {
    const duration = flight.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStops = () => {
    const stops = flight.sg.length - 1;
    return stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`;
  };

  return (
    <Card className="flight-card w-full hover:shadow-lg transition-shadow duration-300">
      <div className="p-4 flex flex-col md:flex-row justify-between items-start gap-4">
        {/* Airline Info */}
        <div className="flex-shrink-0">
          <h3 className="text-lg font-semibold">{segment.al.alN}</h3>
          <p className="text-sm text-gray-600">{`${segment.al.alC} ${segment.al.fN}`}</p>
          {segment.bg && (
            <p className="text-xs text-gray-500 mt-1">Baggage: {segment.bg}</p>
          )}
        </div>

        {/* Flight Details */}
        <div className="flex-grow flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Departure */}
          <div className="text-center">
            <p className="text-xl font-bold">{formatTime(segment.or.dT)}</p>
            <p className="text-sm">{segment.or.cN}</p>
            <p className="text-xs text-gray-500">{segment.or.aC}</p>
          </div>

          {/* Duration/Stops */}
          <div className="text-center">
            <p className="text-sm text-gray-600">{getTimeDuration()}</p>
            <div className="w-32 h-px bg-gray-300 my-2"></div>
            <p className="text-xs text-blue-600">{getStops()}</p>
          </div>

          {/* Arrival */}
          <div className="text-center">
            <p className="text-xl font-bold">
              {formatTime(flight.sg[flight.sg.length - 1].ds.aT)}
            </p>
            <p className="text-sm">{flight.sg[flight.sg.length - 1].ds.cN}</p>
            <p className="text-xs text-gray-500">
              {flight.sg[flight.sg.length - 1].ds.aC}
            </p>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-bold text-blue-600">₹{flight.pF}</p>
          {existingPrice && (
            <p className={`text-xs ${flight.pF > existingPrice ? 'text-red-500' : 'text-green-500'}`}>
              {flight.pF > existingPrice ? '↑' : '↓'} 
              ₹{Math.abs(flight.pF - existingPrice)}
            </p>
          )}
          <Button 
            variant="contained" 
            onClick={() => onViewFlight(flight)}
            className="mt-2"
          >
            Select Flight
          </Button>
        </div>
      </div>
    </Card>
  );
});

// Main FlightsPage Component
const FlightsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itineraryToken } = useSelector((state) => state.itinerary);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allFlights, setAllFlights] = useState([]);
  const [displayedFlights, setDisplayedFlights] = useState([]);
  const [traceId, setTraceId] = useState(null);
  
  // Modal State
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFlights, setTotalFlights] = useState(0);

  // Filters and Sorting
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    airlines: [],
    stops: null
  });
  const [currentSort, setCurrentSort] = useState("priceAsc");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  // Get state from navigation
  const { 
    origin, 
    destination, 
    departureDate,
    inquiryToken,
    travelersDetails,
    oldFlightCode,
    existingFlightPrice,
    type
  } = location.state || {};

  // Fetch Flights
  const fetchFlights = useCallback(async (pageNum) => {
    try {
      setLoading(true);
  
      const response = await fetch(
        `http://localhost:5000/api/itinerary/flights/${inquiryToken}?page=${pageNum}&limit=20`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify({
            origin,
            destination, 
            departureDate,
            type,
            oldFlightCode,
            existingFlightPrice,
            travelersDetails
          })
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }
  
      const responseData = await response.json();
      
      if (responseData.success) {
        const flights = responseData.data.flights || [];
        const pagination = responseData.data.pagination || {};

        // Update flights state
        setAllFlights((prevFlights) => 
          pageNum === 1 ? flights : [...prevFlights, ...flights]
        );

        // Set pagination details
        setHasMore(pagination.hasMore || false);
        setTotalFlights(pagination.total || flights.length);
        setTraceId(responseData.data.traceId);

        // Set initial price range on first page
        if (pageNum === 1 && flights.length > 0) {
          const prices = flights.map(f => f.pF).filter(Boolean);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange({ min: minPrice, max: maxPrice });
          setFilters(prev => ({
            ...prev,
            priceRange: [minPrice, maxPrice]
          }));
        }
      } else {
        throw new Error(responseData.message || 'Failed to fetch flights');
      }
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    inquiryToken, 
    origin, 
    destination, 
    departureDate, 
    type,
    oldFlightCode,
    existingFlightPrice,
    travelersDetails
  ]);

  // Filtering and Sorting Effect
  useEffect(() => {
    let filtered = [...allFlights];

    // Price Filter
    filtered = filtered.filter(flight => 
      flight.pF >= filters.priceRange[0] && 
      flight.pF <= filters.priceRange[1]
    );

    // Airline Filter
    if (filters.airlines.length > 0) {
      filtered = filtered.filter(flight => 
        filters.airlines.includes(flight.sg[0].al.alN)
      );
    }

    // Stops Filter
    if (filters.stops !== null) {
      filtered = filtered.filter(flight => 
        filters.stops === 0 
          ? flight.sg.length === 1 
          : flight.sg.length - 1 === filters.stops
      );
    }

    // Sorting
    let sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (currentSort) {
        case "priceAsc": return a.pF - b.pF;
        case "priceDesc": return b.pF - a.pF;
        case "durationAsc": {
          const aDuration = a.sg.reduce((total, seg) => total + seg.dr, 0);
          const bDuration = b.sg.reduce((total, seg) => total + seg.dr, 0);
          return aDuration - bDuration;
        }
        default: return 0;
      }
    });

    setDisplayedFlights(sorted);
  }, [allFlights, filters, currentSort]);

  // Initial Load
  useEffect(() => {
    if (!inquiryToken || !origin || !destination || !departureDate) {
      navigate('/itinerary');
      return;
    }

    setPage(1);
    fetchFlights(1);
  }, [inquiryToken, origin, destination, departureDate, navigate, fetchFlights]);

  // Load More Handler
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFlights(nextPage);
    }
  }, [loading, hasMore, page, fetchFlights]);

  // View Flight Handler
  const handleViewFlight = (flight) => {
    setSelectedFlight({
      ...flight,
      traceId,
      cityName: `${origin.city} to ${destination.city}`,
      date: departureDate
    });
  };

  // Back to Itinerary Handler
  const handleBackToItinerary = () => {
    navigate('/itinerary', {
      state: { itineraryInquiryToken: inquiryToken }
    });
  };

  // Loading State
  if (loading && allFlights.length === 0) {
    return (
      <div className="loading-container flex-center">
        <LoadingSpinner2 message="Finding available flights..." />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <Container className="error-container">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleBackToItinerary}>
          Return to Itinerary
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="flights-page">
      {/* Header */}
      <Stack spacing={2} className="mb-6">
        <Button
          variant="outlined"
          startIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={handleBackToItinerary}
          className="w-fit"
        >
          Back to Itinerary
        </Button>

        <Typography variant="h4" component="h1">
          Flights from {origin.city} to {destination.city}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {new Date(departureDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>
      </Stack>

      {/* Filter and Sorting */}
      <FlightFilterMenu
        priceRange={priceRange}
        filters={filters}
        setFilters={setFilters}
        currentSort={currentSort}
        setCurrentSort={setCurrentSort}
      />

      {/* Flights Grid */}
      <div className="flights-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {displayedFlights.map((flight) => (
          <FlightCard
            key={flight.rI}
            flight={flight}
            onViewFlight={handleViewFlight}
            existingPrice={existingFlightPrice}
          />
        ))}
      </div>

      {/* No Flights Found */}
      {displayedFlights.length === 0 && (
        <div className="text-center py-8">
          <Typography variant="h6">No flights found matching your criteria</Typography>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loading}
            fullWidth
          >
            {loading ? "Loading..." : `Load More Flights (${allFlights.length} of ${totalFlights})`}
          </Button>
        </div>
      )}

      {/* Flight Detail Modal */}
      {selectedFlight && (
        <FlightDetailModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
          itineraryToken={itineraryToken}
          inquiryToken={inquiryToken}
          existingPrice={existingFlightPrice}
        />
      )}
    </Container>
  );
};

export default FlightsPage;