import AirlinesIcon from '@mui/icons-material/Airlines';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Badge,
  Box, Button, Card,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Slider,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner2 from "../../components/common/LoadingSpinner2";
import FlightDetailModal from "./FlightDetailModal";
import { FlightFilterMenu } from "./FlightFilterMenu";
// Map cabin class codes to names
const cabinClassMap = {
  1: "Economy",
  2: "Economy", 
  3: "Premium Economy",
  4: "Business",
  5: "Premium Business",
  6: "First"
};

// Updated FlightCard component with theme colors and background shades
const FlightCard = React.memo(({ flight, onViewFlight, existingPrice, viewMode }) => {
  const segment = flight.sg[0];
  const theme = useTheme();

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
      hour12: false
    });
  };

  const getStops = () => {
    const stops = flight.sg.length - 1;
    return stops === 0 ? 'Non Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`;
  };

  // Get cabin class from data
  const cabinClass = cabinClassMap[segment.cC] || "Economy";

  // Calculate price comparison with existing price - using modern trend icons
  const getPriceComparison = () => {
    if (!existingPrice) return null;
    
    if (flight.pF < existingPrice) {
      return { 
        icon: <TrendingDownIcon sx={{ color: theme.palette.success.main, fontSize: 24 }} />,
        color: theme.palette.success.main,
        diff: existingPrice - flight.pF
      };
    } else if (flight.pF > existingPrice) {
      return { 
        icon: <TrendingUpIcon sx={{ color: theme.palette.error.main, fontSize: 24 }} />,
        color: theme.palette.error.main,
        diff: flight.pF - existingPrice
      };
    } else {
      return { 
        icon: <TrendingFlatIcon sx={{ color: theme.palette.info.main, fontSize: 24 }} />,
        color: theme.palette.info.main,
        diff: 0
      };
    }
  };

  const priceComparison = getPriceComparison();

  return (
    <Card 
      sx={{
        width: '100%',
        height: '100%',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: '18px',
        boxShadow: 'none',
        overflow: 'hidden',
        mb: 2,
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' 
            ? `0 4px 10px ${alpha(theme.palette.primary.main, 0.2)}` 
            : `0 4px 10px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Airline Logo and Name */}
      <Box sx={{ 
        p: 2.5, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        width: { xs: '100%', md: '20%' },
        borderRight: { xs: 'none', md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
        borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' }
      }}>
        <Box 
          component="img"
          src="/assets/images/spicejet.png"
          alt={segment.al.alN}
          sx={{ width: 50, height: 50, borderRadius: '10%', mb: 1 }}
        />
        <Typography sx={{ 
          fontWeight: 600, 
          fontSize: '0.95rem', 
          textAlign: 'center',
          color: theme.palette.text.primary
        }}>
          {segment.al.alN}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
          {segment.al.alC} {segment.al.fN.trim()}
        </Typography>
        <Typography variant="body2" sx={{ 
          color: flight.iR ? theme.palette.success.main : theme.palette.error.main, 
          fontSize: '0.8rem', 
          mt: 1 
        }}>
          {flight.iR ? "Partially Refundable" : "Not Refundable"}
        </Typography>
      </Box>
      
      {/* Flight Details */}
      <Box sx={{ 
        p: 2.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: { xs: '100%', md: '50%' },
        borderRight: { xs: 'none', md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
        borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' }
      }}>
        {/* Departure */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            {formatTime(segment.or.dT)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {segment.or.cN}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {segment.or.aC}
          </Typography>
        </Box>

        {/* Duration */}
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {getTimeDuration()}
          </Typography>
          <Box sx={{ 
            width: { xs: 80, sm: 100, md: 120 }, 
            height: 1,
            backgroundColor: alpha(theme.palette.divider, 0.5),
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: -4,
              top: -3,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.divider, 0.8),
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -4,
              top: -3,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.divider, 0.8),
            },
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {getStops()}
          </Typography>
        </Box>

        {/* Arrival */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            {formatTime(flight.sg[flight.sg.length - 1].ds.aT)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {flight.sg[flight.sg.length - 1].ds.cN}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {flight.sg[flight.sg.length - 1].ds.aC}
          </Typography>
        </Box>
      </Box>

      {/* Price and Button - with updated inline price comparison */}
      <Box sx={{ 
        p: 2.5, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        width: { xs: '100%', md: '30%' },
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        borderLeft: { md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
      }}>
        {/* Price comparison section with icon and amount in same row */}
        {priceComparison && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 1.5
          }}>
            
            {priceComparison.diff > 0 && (
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 1,
                  color: priceComparison.color,
                  fontWeight: 600
                }}
              >
                {`₹${priceComparison.diff.toLocaleString()} ${flight.pF > existingPrice ? 'more' : 'less'}`}
              </Typography>
            )}
            {priceComparison.diff === 0 && (
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 1,
                  color: priceComparison.color,
                  fontWeight: 600
                }}
              >
                Same price
              </Typography>
            )}
            {priceComparison.icon}
          </Box>
        )}
        
        <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.primary }}>
          {cabinClass}
        </Typography>
        
        {segment.bg && (
          <Chip
            label={`Baggage: ${segment.bg}`}
            size="small"
            sx={{ 
              height: 20, 
              fontSize: '0.7rem',
              mb: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.text.primary,
            }}
          />
        )}
        
        <Button 
          variant="outlined" 
          onClick={() => onViewFlight(flight)}
          sx={{
            borderRadius: 24,
            textTransform: 'none',
            px: 3,
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            '&:hover': {
              borderColor: theme.palette.primary.dark,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          Flight Details
        </Button>
      </Box>
    </Card>
  );
});

// Individual filter card components with updated low shaded background
const FilterCard = ({ title, children }) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        // Updated to a lower opacity shade
        bgcolor: alpha(theme.palette.background.paper, 0.4),
        // Add a subtle shadow
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.05)}`,
      }}
    >
      <Typography variant="subtitle1" sx={{ 
        fontWeight: 600, 
        mb: 2,
        color: theme.palette.text.primary
      }}>
        {title}
      </Typography>
      {children}
    </Card>
  );
};

// FlightFilterSidebar Component with theme colors
const FlightFilterSidebar = React.memo(({ 
  priceRange, 
  filters, 
  setFilters, 
  availableAirlines = [],
  stopCounts = {},
  cabinClasses = [],
  onReset
}) => {
  const theme = useTheme();
  
  const handleStopChange = (stop) => {
    const newFilters = { ...filters };
    newFilters.stops = filters.stops === stop ? null : stop;
    setFilters(newFilters);
  };

  const handlePriceChange = (_, newValue) => {
    const newFilters = { ...filters };
    newFilters.priceRange = newValue;
    setFilters(newFilters);
  };

  const handleAirlineChange = (airline) => {
    const newAirlines = filters.airlines?.includes(airline)
      ? filters.airlines.filter(a => a !== airline)
      : [...(filters.airlines || []), airline];
      
    const newFilters = {
      ...filters,
      airlines: newAirlines
    };
    setFilters(newFilters);
  };

  // Add cabin class filter functionality
  const handleCabinClassChange = (cabinClass) => {
    const newCabinClasses = filters.cabinClasses?.includes(cabinClass)
      ? filters.cabinClasses.filter(c => c !== cabinClass)
      : [...(filters.cabinClasses || []), cabinClass];
      
    const newFilters = {
      ...filters,
      cabinClasses: newCabinClasses
    };
    setFilters(newFilters);
  };

  // Add duration filter functionality
  const handleDurationChange = (_, newValue) => {
    const newFilters = { ...filters };
    newFilters.durationRange = newValue;
    setFilters(newFilters);
  };

  const formatPrice = price => `₹${price.toLocaleString()}`;
  
  // Format duration for display
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Default cabin classes if not provided
  const cabinClassesForDisplay = cabinClasses.length > 0
    ? cabinClasses
    : ['Economy', 'Premium Economy', 'Business', 'First'];

  return (
    <Box sx={{ width: 320 }}>
      {/* Filter header with reset button - updated with background */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        borderRadius: 2,
        // Added light green background with low opacity
        bgcolor: alpha(theme.palette.primary.main, 0.05),
      }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>Filter by</Typography>
        <Button 
          variant="text" 
          sx={{ 
            textTransform: 'none', 
            color: theme.palette.primary.main 
          }}
          onClick={onReset}
        >
          Reset
        </Button>
      </Box>

      {/* Stop Filter */}
      <FilterCard title="Stop">
        <FormGroup>
          {[0, 1, 2].map((stop) => {
            const count = stopCounts && stopCounts[stop] ? stopCounts[stop] : null;
            
            return (
              <FormControlLabel
                key={stop}
                control={
                  <Checkbox
                    checked={filters.stops === stop}
                    onChange={() => handleStopChange(stop)}
                    size="small"
                    sx={{
                      color: alpha(theme.palette.primary.main, 0.6),
                      '&.Mui-checked': {
                        color: theme.palette.primary.main
                      }
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                      {stop === 0 ? 'Direct' : `${stop} Stop${stop > 1 ? 's' : ''}`}
                    </Typography>
                    {count && (
                      <Typography variant="body2" color="text.secondary">
                        ({count})
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ width: '100%', ml: 0, mb: 0.5 }}
              />
            );
          })}
        </FormGroup>
      </FilterCard>

      {/* Price Filter */}
      <FilterCard title="Price">
        <Box sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">{formatPrice(filters.priceRange[0])}</Typography>
            <Typography variant="caption" color="text.secondary">{formatPrice(filters.priceRange[1])}</Typography>
          </Box>
          
          <Slider
            value={filters.priceRange}
            onChange={handlePriceChange}
            min={priceRange.min}
            max={priceRange.max}
            sx={{ 
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                bgcolor: 'white',
                border: '2px solid',
                borderColor: theme.palette.primary.main,
              },
              '& .MuiSlider-track': {
                backgroundColor: theme.palette.primary.main
              },
              '& .MuiSlider-rail': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          />
        </Box>
      </FilterCard>

      {/* NEW: Cabin Class Filter */}
      <FilterCard title="Cabin Class">
        <FormGroup>
          {cabinClassesForDisplay.map((cabinClass) => (
            <FormControlLabel
              key={cabinClass}
              control={
                <Checkbox
                  checked={filters.cabinClasses?.includes(cabinClass)}
                  onChange={() => handleCabinClassChange(cabinClass)}
                  size="small"
                  sx={{
                    color: alpha(theme.palette.primary.main, 0.6),
                    '&.Mui-checked': {
                      color: theme.palette.primary.main
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>{cabinClass}</Typography>
              }
              sx={{ width: '100%', ml: 0, mb: 0.5 }}
            />
          ))}
        </FormGroup>
      </FilterCard>

      {/* Airlines Filter */}
      <FilterCard title="Airlines">
        <FormGroup>
          {availableAirlines.map((airline) => (
            <FormControlLabel
              key={airline}
              control={
                <Checkbox
                  checked={filters.airlines?.includes(airline)}
                  onChange={() => handleAirlineChange(airline)}
                  size="small"
                  sx={{
                    color: alpha(theme.palette.primary.main, 0.6),
                    '&.Mui-checked': {
                      color: theme.palette.primary.main
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>{airline}</Typography>
              }
              sx={{ width: '100%', ml: 0, mb: 0.5 }}
            />
          ))}
        </FormGroup>
      </FilterCard>

      {/* Duration Filter */}
      <FilterCard title="Duration">
        <Box sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(filters.durationRange?.[0] || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(filters.durationRange?.[1] || 1440)}
            </Typography>
          </Box>
          
          <Slider
            value={filters.durationRange || [0, 1440]}
            onChange={handleDurationChange}
            min={0}
            max={1440}
            sx={{ 
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                bgcolor: 'white',
                border: '2px solid',
                borderColor: theme.palette.primary.main,
              },
              '& .MuiSlider-track': {
                backgroundColor: theme.palette.primary.main
              },
              '& .MuiSlider-rail': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          />
        </Box>
      </FilterCard>
    </Box>
  );
});

const FlightsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { itineraryToken } = useSelector((state) => state.itinerary);
  
  // Background loading state
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const loadingTimeoutRef = useRef(null);
  
  // Data states
  const [allFlights, setAllFlights] = useState([]); // ALL flights data loaded from backend
  const [filteredFlights, setFilteredFlights] = useState([]); // Flights after applying filters
  const [displayedFlights, setDisplayedFlights] = useState([]); // Flights currently shown in UI
  
  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(20); // How many to show initially
  const [loadStep] = useState(100); // How many more to show when "Load More" is clicked
  
  // Modal and selection state
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [traceId, setTraceId] = useState(null);

  // UI state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentMenuType, setCurrentMenuType] = useState(null);
  const [activeTabValue, setActiveTabValue] = useState(0);
  
  // Filter state - applied to ALL loaded flights
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    airlines: [],
    stops: null,
    durationRange: [0, 1440], // Default to 0-24 hours
    cabinClasses: [] // Added new cabin class filter
  });
  
  // Initial sort is now "recommended" instead of "priceAsc"
  const [currentSort, setCurrentSort] = useState("recommended");
  
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [availableAirlines, setAvailableAirlines] = useState([]);
  const [stopCounts, setStopCounts] = useState({});
  
  const { 
    origin, destination, departureDate, inquiryToken,
    travelersDetails, oldFlightCode, existingFlightPrice, type
  } = location.state || {};

  // List of available cabin classes
  const cabinClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

  // Handle menu open/close
  const handleOpenMenu = (event, menuType) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentMenuType(menuType);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  // IMPORTANT: Function to load ALL flight data in the background one chunk at a time
  const loadNextChunk = useCallback(async (chunkIndex, allLoadedFlights = []) => {
    console.log(`Loading chunk ${chunkIndex}`);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/itinerary/flights/${inquiryToken}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify({
            origin, destination, departureDate, type,
            oldFlightCode, existingFlightPrice, travelersDetails,
            chunkIndex: chunkIndex,
            chunkSize: 100
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch flights');
      }
      
      console.log(`Chunk ${chunkIndex} loaded:`, {
        newFlights: data.data.flights.length,
        totalFromApi: data.data.pagination.total,
        hasMore: data.data.pagination.hasMore
      });
      
      // Get current flights from this chunk
      const newFlights = data.data.flights || [];
      
      // Update total count on first chunk
      if (chunkIndex === 0) {
        console.log(`Total flights from API: ${data.data.pagination.total}`);
        
        // Set initial metadata
        setTraceId(data.data.traceId);
        
        if (data.data.priceRange) {
          setPriceRange(data.data.priceRange);
          setFilters(prev => ({
            ...prev,
            priceRange: [data.data.priceRange.min, data.data.priceRange.max]
          }));
        }
        
        if (data.data.availableFilters?.airlines) {
          setAvailableAirlines(data.data.availableFilters.airlines);
        }

        if (data.data.availableFilters?.stopCounts) {
          setStopCounts(data.data.availableFilters.stopCounts);
        }
        
        // Allow the UI to render
        setInitialLoading(false);
      }
      
      // Combine with already loaded flights (deduplicating by flight ID)
      const combinedFlights = [...allLoadedFlights, ...newFlights];
      const uniqueFlights = Array.from(
        new Map(combinedFlights.map(flight => [flight.rI, flight])).values()
      );
      
      // Update all flights
      setAllFlights(uniqueFlights);
      
      // Check if we need to load more
      const hasMore = data.data.pagination.hasMore;
      console.log(`Has more chunks: ${hasMore}`);
      
      // If we have more data, schedule loading the next chunk
      if (hasMore) {
        // Add a small delay to avoid overwhelming the server
        loadingTimeoutRef.current = setTimeout(() => {
          loadNextChunk(chunkIndex + 1, uniqueFlights);
        }, 300);
      } else {
        console.log('All data loaded!');
        setIsLoadingAll(false);
      }
    } catch (error) {
      console.error('Error loading chunk:', error);
      
      // Don't show error if we already have some data
      if (allLoadedFlights.length === 0) {
        setError(error.message);
        setInitialLoading(false);
      }
      
      setIsLoadingAll(false);
    }
  }, [
    inquiryToken, origin, destination, departureDate, 
    type, oldFlightCode, existingFlightPrice, travelersDetails
  ]);

  // Start loading data
  useEffect(() => {
    if (!inquiryToken || !origin || !destination || !departureDate) {
      navigate('/itinerary');
      return;
    }
    
    // Start with chunk 0
    loadNextChunk(0);
    
    // Cleanup timeouts on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [inquiryToken, origin, destination, departureDate, navigate, loadNextChunk]);

  // Apply filters to ALL loaded flights whenever filters or all flights change
  // With updated recommended sorting algorithm
  useEffect(() => {
    // Skip if we don't have any flights yet
    if (allFlights.length === 0) return;
    
    console.log(`Applying filters to ${allFlights.length} flights...`);
    
    let filtered = [...allFlights];
    
    // Apply price filter
    if (filters.priceRange && filters.priceRange.length === 2) {
      filtered = filtered.filter(flight => 
        flight.pF >= filters.priceRange[0] && flight.pF <= filters.priceRange[1]
      );
      console.log(`After price filter: ${filtered.length} flights`);
    }
    
    // Apply airline filter
    if (filters.airlines && filters.airlines.length > 0) {
      filtered = filtered.filter(flight => 
        filters.airlines.includes(flight.sg[0].al.alN)
      );
      console.log(`After airline filter: ${filtered.length} flights`);
    }
    
    // Apply stops filter
    if (filters.stops !== null) {
      filtered = filtered.filter(flight => 
        filters.stops === 0 
          ? flight.sg.length === 1 
          : flight.sg.length - 1 === filters.stops
      );
      console.log(`After stops filter: ${filtered.length} flights`);
    }
    
    // Apply duration filter
    if (filters.durationRange && filters.durationRange.length === 2) {
      filtered = filtered.filter(flight => {
        const flightDuration = flight.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
        return flightDuration >= filters.durationRange[0] && flightDuration <= filters.durationRange[1];
      });
      console.log(`After duration filter: ${filtered.length} flights`);
    }
    
    // Apply cabin class filter
    if (filters.cabinClasses && filters.cabinClasses.length > 0) {
      filtered = filtered.filter(flight => {
        const cabinClassCode = flight.sg[0].cC; // Get cabin class code
        const cabinClassName = cabinClassMap[cabinClassCode] || "Economy"; // Map to name
        return filters.cabinClasses.includes(cabinClassName);
      });
      console.log(`After cabin class filter: ${filtered.length} flights`);
    }
    
    // Apply sorting
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
      case "recommended":
        // Balanced sort considering price, duration, and stops
        filtered.sort((a, b) => {
          // Calculate normalized scores for price (0-1 scale, lower is better)
          const maxPrice = Math.max(...filtered.map(f => f.pF));
          const minPrice = Math.min(...filtered.map(f => f.pF));
          const priceRangeSize = maxPrice - minPrice;
          const aPriceScore = priceRangeSize > 0 ? (a.pF - minPrice) / priceRangeSize : 0;
          const bPriceScore = priceRangeSize > 0 ? (b.pF - minPrice) / priceRangeSize : 0;
          
          // Calculate normalized scores for duration (0-1 scale, lower is better)
          const aDuration = a.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
          const bDuration = b.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
          const maxDuration = Math.max(...filtered.map(f => 
            f.sg.reduce((total, seg) => total + (seg.dr || 0), 0)
          ));
          const minDuration = Math.min(...filtered.map(f => 
            f.sg.reduce((total, seg) => total + (seg.dr || 0), 0)
          ));
          const durationRangeSize = maxDuration - minDuration;
          const aDurationScore = durationRangeSize > 0 ? (aDuration - minDuration) / durationRangeSize : 0;
          const bDurationScore = durationRangeSize > 0 ? (bDuration - minDuration) / durationRangeSize : 0;
          
          // Calculate normalized scores for stops (0-1 scale, lower is better)
          const aStopsCount = a.sg.length - 1;
          const bStopsCount = b.sg.length - 1;
          const maxStops = Math.max(...filtered.map(f => f.sg.length - 1));
          const aStopsScore = maxStops > 0 ? aStopsCount / maxStops : 0;
          const bStopsScore = maxStops > 0 ? bStopsCount / maxStops : 0;
          
          // Calculate combined score with weights
          // Price: 40%, Duration: 35%, Stops: 25%
          const aCombinedScore = (aPriceScore * 0.4) + (aDurationScore * 0.35) + (aStopsScore * 0.25);
          const bCombinedScore = (bPriceScore * 0.4) + (bDurationScore * 0.35) + (bStopsScore * 0.25);
          
          // Sort by combined score (lower is better)
          return aCombinedScore - bCombinedScore;
        });
        break;
      default:
        break;
    }
    
    // Update filtered flights
    setFilteredFlights(filtered);
    
    // Reset visible count when filters change
    setVisibleCount(100);
  }, [allFlights, filters, currentSort]);

  // Update displayed flights based on visibleCount and filteredFlights
  useEffect(() => {
    setDisplayedFlights(filteredFlights.slice(0, visibleCount));
  }, [filteredFlights, visibleCount]);

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

  // Load more handler - just increase the visible count
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + loadStep, filteredFlights.length));
  };

  // Filter change handler
  const handleFilterChange = (newFilters) => {
    console.log('Applying new filters:', newFilters);
    setFilters(newFilters);
  };

  // Sort change handler
  const handleSortChange = (newSort) => {
    console.log('Applying new sort:', newSort);
    setCurrentSort(newSort);
  };

  const handleResetFilters = () => {
    setFilters({
      priceRange: [priceRange.min, priceRange.max],
      airlines: [],
      stops: null,
      durationRange: [0, 1440],
      cabinClasses: []
    });
  };

  // Handle tab change - updated for recommended sorting
  const handleTabChange = (event, newValue) => {
    setActiveTabValue(newValue);
    // Apply different sorting based on tab
    if (newValue === 0) {
      // Recommended - balanced sort algorithm
      setCurrentSort("recommended");
    } else if (newValue === 1) {
      // Cheapest
      setCurrentSort("priceAsc");
    } else if (newValue === 2) {
      // Fastest
      setCurrentSort("durationAsc");
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (initialLoading) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 3
      }}>
        <LoadingSpinner2 message="Finding available flights..." />
      </Box>
    );
  }

  if (error && allFlights.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ 
        mt: 5, 
        px: { xs: 2, md: 4 },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%', 
            maxWidth: 600,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: 'inherit' }}>Error Loading Flights</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'inherit' }}>{error}</Typography>
          <Button 
            variant="contained" 
            onClick={handleBackToItinerary}
            startIcon={<ArrowLeft size={16} />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              }
            }}
          >
            Return to Itinerary
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 8 }, pb: 6, px: { xs: 2, md: 4 } }}>
      {/* NEW Header with Background - Matches Activities Page */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            mb: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: theme.palette.mode === "dark" 
              ? "0 10px 40px rgba(0,0,0,0.2)" 
              : "0 10px 40px rgba(0,0,0,0.05)"
          }}
        >
          {/* Header with gradient background */}
          <Box 
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1.5,
              px: 2.5,
              backgroundColor: theme.palette.mode === "dark" 
                ? alpha(theme.palette.primary.main, 0.1)
                : "rgba(255, 138, 66, 0.1)",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <AirlinesIcon  fontSize="small" color="primary" />
              </Box>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: "Montserrat", 
                    fontWeight: 600, 
                    color: theme.palette.text.primary,
                    fontSize: "1.5rem",
                    lineHeight: 1.2,
                  }}
                >
                  Flights from {origin?.city || ''} to {destination?.city || ''}
                </Typography>
              </Box>
            </Box>
            
            {/* Back Button */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton 
                onClick={handleBackToItinerary}
                sx={{
                  color: theme.palette.text.secondary,
                  width: 32,
                  height: 32,
                  backgroundColor: alpha(theme.palette.divider, 0.1),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.divider, 0.2),
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Content with date information */}
          <Box sx={{ py: 1.5, px: 2.5, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
            <Stack 
              direction={{ xs: "column", md: "row" }} 
              spacing={2} 
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              {departureDate && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  backgroundColor: theme.palette.mode === "dark" 
                    ? alpha(theme.palette.primary.main, 0.08)
                    : "rgba(251, 203, 173, 0.3)",
                  borderRadius: '30px',
                  py: 0.5,
                  px: 1.5,
                }}>
                  <Calendar size={16} color={theme.palette.primary.main} />
                  <Typography variant="caption" fontWeight={500}>
                    {formatDate(departureDate)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left sidebar with filters - visible on larger screens */}
        <Box 
          sx={{ 
            display: { xs: 'none', md: 'block' },
            flexShrink: 0
          }}
        >
          <FlightFilterSidebar 
            priceRange={priceRange}
            filters={filters}
            setFilters={setFilters}
            availableAirlines={availableAirlines}
            stopCounts={stopCounts}
            cabinClasses={cabinClasses}
            onReset={handleResetFilters}
          />
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1 }}>
          {/* Removed the filter active indicator and reset all button */}
          
          {/* Sort/Filter Tabs - removed price displays */}
          <Card 
            elevation={0}
            sx={{ 
              mb: 3, 
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', width: '100%' }}>
              <Tabs 
                value={activeTabValue} 
                onChange={handleTabChange} 
                sx={{ 
                  flex: 1,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ py: 1.5, width: '100%', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Recommended</Typography>
                    </Box>
                  } 
                  sx={{
                    bgcolor: activeTabValue === 0 ? 'white' : 'transparent',
                    borderRadius: activeTabValue === 0 ? 1 : 0,
                    minHeight: '100%',
                    flex: 1
                  }}
                />
                <Tab 
                  label={
                    <Box sx={{ py: 1.5, width: '100%', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Cheapest</Typography>
                    </Box>
                  } 
                  sx={{
                    bgcolor: activeTabValue === 1 ? 'white' : 'transparent',
                    borderRadius: activeTabValue === 1 ? 1 : 0,
                    minHeight: '100%',
                    flex: 1
                  }}
                />
                <Tab 
                  label={
                    <Box sx={{ py: 1.5, width: '100%', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Fastest</Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: activeTabValue === 2 ? 'white' : 'transparent',
                    borderRadius: activeTabValue === 2 ? 1 : 0,
                    minHeight: '100%',
                    flex: 1
                  }}
                />
              </Tabs>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                px: 2,
                bgcolor: 'white',
                borderRadius: 1,
                ml: 2,
                cursor: 'pointer'
              }}
              onClick={(e) => handleOpenMenu(e, 'sort')}
              >
                <Typography variant="body2" sx={{ mr: 1, color: theme.palette.text.primary }}>Sort by</Typography>
                <SortIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
              </Box>
            </Box>
          </Card>

          {/* Flight cards */}
          <Box>
            {displayedFlights.map((flight) => (
              <FlightCard
                key={flight.rI}
                flight={flight}
                onViewFlight={handleViewFlight}
                existingPrice={existingFlightPrice}
                viewMode="list"
              />
            ))}
          </Box>

          {/* Empty state */}
          {filteredFlights.length === 0 && !initialLoading && (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 3,
              borderRadius: '24px',
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary }} gutterBottom>
                No flights found matching your criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                {isLoadingAll ? 
                  "More flights are still loading. Try adjusting your filters or check back later." :
                  "Try adjusting your filters to see more results."}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleResetFilters}
                sx={{
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                Reset Filters
              </Button>
            </Box>
          )}

          {/* Load more button - Only show if there are more filtered flights to display */}
          {displayedFlights.length > 0 && displayedFlights.length < filteredFlights.length && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                onClick={handleLoadMore}
                sx={{
                  borderRadius: '24px',
                  height: 48,
                  minWidth: '240px',
                  fontWeight: 500,
                  textTransform: 'none',
                  backgroundColor: theme.palette.primary.main,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Load More Flights
              </Button>
            </Box>
          )}

          {/* End of results - removed flight count */}
          {displayedFlights.length > 0 && displayedFlights.length === filteredFlights.length && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                mt: 4, 
                pt: 2,
                color: 'text.secondary',
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="body2">
                End of results
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Filter menu for mobile - this uses the existing FlightFilterMenu component */}
      <Badge 
        color="error" 
        variant="dot" 
        invisible={!(filters.airlines.length > 0 || 
                   filters.stops !== null || 
                   filters.priceRange[0] > priceRange.min || 
                   filters.priceRange[1] < priceRange.max ||
                   (filters.durationRange && (filters.durationRange[0] > 0 || filters.durationRange[1] < 1440)) ||
                   filters.cabinClasses.length > 0)}
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          display: { xs: 'block', md: 'none' },
          zIndex: 1000
        }}
      >
        <Button
          variant="contained"
          startIcon={<FilterListIcon />}
          onClick={(e) => handleOpenMenu(e, 'filter')}
          sx={{
            borderRadius: '50%',
            width: 56,
            height: 56,
            minWidth: 56,
            backgroundColor: theme.palette.primary.main,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        />
      </Badge>

      <FlightFilterMenu
        priceRange={priceRange}
        filters={filters}
        setFilters={handleFilterChange}
        currentSort={currentSort}
        setCurrentSort={handleSortChange}
        anchorEl={menuAnchorEl}
        onClose={handleCloseMenu}
        currentTab={currentMenuType}
        availableAirlines={availableAirlines}
        stopCounts={stopCounts}
        cabinClasses={cabinClasses}
      />

      {/* Detail modal */}
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