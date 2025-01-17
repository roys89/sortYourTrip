import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { Alert, Box, Button, Card, Container, Stack, Typography } from "@mui/material";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { ArrowLeft } from "lucide-react";
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner2 from "../../components/common/LoadingSpinner2";
import FlightDetailModal from "./FlightDetailModal";
import FlightFilterMenu from "./FlightFilterMenu";

const FlightCard = React.memo(({ flight, onViewFlight, existingPrice, viewMode }) => {
  const segment = flight.sg[0];

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
    <Card className={`flight-card w-full hover:shadow-lg transition-shadow duration-300 
      ${viewMode === 'grid' ? 'flight-card-grid' : ''}`}>
      <div className={`p-4 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-col md:flex-row'} justify-between items-start gap-4`}>
        <div className="flex-shrink-0">
          <h3 className="text-lg font-semibold">{segment.al.alN}</h3>
          <p className="text-sm text-gray-600">{`${segment.al.alC} ${segment.al.fN}`}</p>
          {segment.bg && (
            <p className="text-xs text-gray-500 mt-1">Baggage: {segment.bg}</p>
          )}
        </div>

        <div className="flex-grow flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-bold">{formatTime(segment.or.dT)}</p>
            <p className="text-sm">{segment.or.cN}</p>
            <p className="text-xs text-gray-500">{segment.or.aC}</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">{getTimeDuration()}</p>
            <div className="w-32 h-px bg-gray-300 my-2"></div>
            <p className="text-xs text-blue-600">{getStops()}</p>
          </div>

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

const FlightsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itineraryToken } = useSelector((state) => state.itinerary);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allFlights, setAllFlights] = useState([]);
  const [displayedFlights, setDisplayedFlights] = useState([]);
  const [traceId, setTraceId] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalFlights, setTotalFlights] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentMenuType, setCurrentMenuType] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    airlines: [],
    stops: null
  });
  const [currentSort, setCurrentSort] = useState("priceAsc");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

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

  const handleOpenMenu = (event, menuType) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentMenuType(menuType);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const fetchFlights = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      console.log('Fetching flights for page:', pageNum);

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
        const newFlights = responseData.data.flights || [];
        const pagination = responseData.data.pagination || {};

        setAllFlights(prevFlights => {
          if (pageNum === 1) {
            return newFlights;
          }
          return [...prevFlights, ...newFlights];
        });

        setHasMore(pagination.hasMore);
        setTotalFlights(pagination.total);
        setTraceId(responseData.data.traceId);

        if (pageNum === 1 && newFlights.length > 0) {
          const prices = newFlights.map(f => f.pF).filter(Boolean);
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

  useEffect(() => {
    if (!inquiryToken || !origin || !destination || !departureDate) {
      navigate('/itinerary');
      return;
    }

    setPage(1);
    fetchFlights(1);
  }, [inquiryToken, origin, destination, departureDate, navigate, fetchFlights]);

  useEffect(() => {
    let filtered = [...allFlights];

    filtered = filtered.filter(flight => 
      flight.pF >= filters.priceRange[0] && 
      flight.pF <= filters.priceRange[1]
    );

    if (filters.airlines.length > 0) {
      filtered = filtered.filter(flight => 
        filters.airlines.includes(flight.sg[0].al.alN)
      );
    }

    if (filters.stops !== null) {
      filtered = filtered.filter(flight => 
        filters.stops === 0 
          ? flight.sg.length === 1 
          : flight.sg.length - 1 === filters.stops
      );
    }

    switch (currentSort) {
      case "priceAsc":
        filtered.sort((a, b) => a.pF - b.pF);
        break;
      case "priceDesc":
        filtered.sort((a, b) => b.pF - a.pF);
        break;
      case "durationAsc":
        filtered.sort((a, b) => {
          const aDuration = a.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
          const bDuration = b.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
          return aDuration - bDuration;
        });
        break;
      default:
        break;
    }

    setDisplayedFlights(filtered);
  }, [allFlights, filters, currentSort]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFlights(nextPage);
    }
  }, [loading, hasMore, page, fetchFlights]);

  const handleViewFlight = (flight) => {
    setSelectedFlight({
      ...flight,
      traceId,
      cityName: `${origin.city} to ${destination.city}`,
      date: departureDate
    });
  };

  const handleBackToItinerary = () => {
    navigate('/itinerary', {
      state: { itineraryInquiryToken: inquiryToken }
    });
  };

  if (loading && allFlights.length === 0) {
    return (
      <div className="loading-container flex-center">
        <LoadingSpinner2 message="Finding available flights..." />
      </div>
    );
  }

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
    <Container maxWidth="xl" className="flights-page mt-16">
      <Box className="activity-header">
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          sx={{ mb: 3 }}
        >
          <div>
            <Typography variant="h4" component="h1" gutterBottom>
              Flights from {origin.city} to {destination.city}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {new Date(departureDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </div>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={handleBackToItinerary}
              variant="outlined"
            >
              Back to Itinerary
            </Button>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newValue) => newValue && setViewMode(newValue)}
                  size="small"
                >
                  <ToggleButton value="list">
                    <ViewListIcon />
                  </ToggleButton>
                  <ToggleButton value="grid">
                    <ViewModuleIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListIcon />}
                onClick={(e) => handleOpenMenu(e, 'filter')}
              >
                Filter
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<SortIcon />}
                onClick={(e) => handleOpenMenu(e, 'sort')}
              >
                Sort
              </Button>

              <FlightFilterMenu
                priceRange={priceRange}
                filters={filters}
                setFilters={setFilters}
                currentSort={currentSort}
                setCurrentSort={setCurrentSort}
                anchorEl={menuAnchorEl}
                onClose={handleCloseMenu}
                currentTab={currentMenuType}
              />
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <div className={`flights-grid grid ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
        {displayedFlights.map((flight) => (
          <FlightCard
            key={flight.rI}
            flight={flight}
            onViewFlight={handleViewFlight}
            existingPrice={existingFlightPrice}
            viewMode={viewMode}
          />
        ))}
      </div>

      {displayedFlights.length === 0 && (
        <div className="text-center py-8">
          <Typography variant="h6">No flights found matching your criteria</Typography>
        </div>
      )}

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

      {selectedFlight && (
        <FlightDetailModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
          itineraryToken={itineraryToken}
          inquiryToken={inquiryToken}
          existingPrice={existingFlightPrice}
          type={type}
          originCityName={origin.city}
          destinationCityName={destination.city}
          date={departureDate}
          traceId={traceId}
        />
      )}
    </Container>
  );
};

export default FlightsPage;