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
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner2 from "../../components/common/LoadingSpinner2";
import { clearAllFlightStates } from "../../redux/slices/flightSlice";
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

// --- NEW: Airline Logo Map ---
// Add more airlines and paths as needed
const airlineLogos = {
  // Updated paths based on provided icons
  'Etihad Airways': '/assets/images/airlines_icon/etihad.png',
  'SpiceJet': '/assets/images/airlines_icon/spicejet.png',
  'Air India': '/assets/images/airlines_icon/airIndia.png',
  // 'Oman Aviation': '/assets/images/airlines/oman.jpg', // Keep old or map to oman.png? Mapping to oman.png
  'Oman Aviation': '/assets/images/airlines_icon/oman.png',
  'Oman Air': '/assets/images/airlines_icon/oman.png', // Map both Oman names
  'AI Express': '/assets/images/airlines/airindiaexpress.jpg', // No specific icon provided, keep old for now
  'Saudi Arabian Airlines': '/assets/images/airlines_icon/saudiarabian.png',
  'Srilankan Airlines': '/assets/images/airlines_icon/srilankan.png',
  'Srilankan': '/assets/images/airlines_icon/srilankan.png', // Map short name too
  'Azerbaijan Airlines': '/assets/images/airlines_icon/azerbaijan.png',
  'Indigo': '/assets/images/airlines_icon/indigo.png',
  'Kuwait Airways': '/assets/images/airlines_icon/kuwait.png',
  'Lufthansa': '/assets/images/airlines_icon/lufthansa.png',
  'Emirates Airlines': '/assets/images/airlines_icon/emirates.png',
  'Emirates': '/assets/images/airlines_icon/emirates.png', // Map short name too
  'Egypt Air': '/assets/images/airlines_icon/egyptAir.png',
  'Turkish Air': '/assets/images/airlines_icon/turkish.png', // Assuming this maps to turkish.png
  'Gulf Air': '/assets/images/airlines_icon/gulf.png',
  'Qatar Airways': '/assets/images/airlines_icon/qatar.png',
  'Uzbekistan Airways': '/assets/images/airlines/uzbekistan.png', // No specific icon provided, keep old for now
  'Ethiopian': '/assets/images/airlines_icon/ethiopian.png',
  // Adding airlines from the provided folder that might not be listed yet
  'Cathay Pacific': '/assets/images/airlines_icon/cathaypecific.png', // Note: filename typo 'cathaypecific'
  'British Airways': '/assets/images/airlines_icon/british.png', 
  'Swiss': '/assets/images/airlines_icon/swiss.png',
  'Kenya Airways': '/assets/images/airlines_icon/kenya.png',
  'Singapore Airlines': '/assets/images/airlines_icon/singapore.png',
  'Vistara': '/assets/images/airlines_icon/vistara.png',
  'Hahn Air': '/assets/images/airlines_icon/hahn.png', // Assuming Hahn Air
  'Japan Airlines': '/assets/images/airlines_icon/jal.png', // Assuming JAL
  'AirAsia': '/assets/images/airlines_icon/airAsia.png', // Assuming AirAsia
  'Air Astana': '/assets/images/airlines_icon/airAstana.png',
  'Flynas': '/assets/images/airlines_icon/flynas.png',
  'Flydubai': '/assets/images/airlines_icon/flydubai.png'
  
  // Add other airlines from availableFilters if needed
};
const DEFAULT_AIRLINE_LOGO = '/assets/images/airlines/take-off-passenger-airplane-runway.jpg'; // Fallback logo
// --- End Airline Logo Map ---

// Updated FlightCard component with theme colors and background shades
const FlightCard = React.memo(({ flight, onViewFlight, existingPrice, viewMode, isLoading }) => {
  const theme = useTheme();

  // Add safety check for flight and segments
  if (!flight || !flight.sg || flight.sg.length === 0) {
    console.warn("Incomplete flight data for card:", flight);
    return <Card sx={{ p: 2, mb: 2, borderRadius: '18px' }}>Incomplete flight data.</Card>;
  }

  const segment = flight.sg[0]; // Use first segment for primary details
  const lastSegment = flight.sg[flight.sg.length - 1]; // Use last segment for destination

  const getTimeDuration = () => {
    // Use reduce safely with default 0 for dr
    const duration = flight.sg.reduce((total, seg) => total + (seg?.dr || 0), 0);
    if (duration === 0) return 'N/A';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    try {
      return new Date(dateTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use 24hr format to match API? Or keep AM/PM? Let's keep 24hr for now.
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return 'Invalid Time';
    }
  };

  const getStops = () => {
    const stops = flight.sg.length - 1;
    return stops === 0 ? 'Non Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`;
  };

  // Get cabin class from data safely
  const cabinClass = cabinClassMap[segment?.cC] || "Economy"; // Default to Economy

  // Calculate price comparison with existing price - using modern trend icons
  const getPriceComparison = () => {
    // Ensure flight price (fF) is a number
    const currentPrice = typeof flight.fF === 'number' ? flight.fF : null;
    const previousPrice = typeof existingPrice === 'number' ? existingPrice : null;

    if (previousPrice === null || currentPrice === null) return null; // Cannot compare if prices are invalid

    if (currentPrice < previousPrice) {
      return {
        icon: <TrendingDownIcon sx={{ color: theme.palette.success.main, fontSize: 24 }} />,
        color: theme.palette.success.main,
        diff: previousPrice - currentPrice
      };
    } else if (currentPrice > previousPrice) {
      return {
        icon: <TrendingUpIcon sx={{ color: theme.palette.error.main, fontSize: 24 }} />,
        color: theme.palette.error.main,
        diff: currentPrice - previousPrice
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

  // --- Get Airline Logo ---
  const airlineName = segment?.al?.alN || 'Unknown Airline';
  const airlineLogoSrc = airlineLogos[airlineName] || airlineLogos[airlineName.split(' ')[0]] || DEFAULT_AIRLINE_LOGO;
  // --- End Get Airline Logo ---

  // --- Extract other details safely ---
  const airlineCode = segment?.al?.alC || '';
  const flightNumber = segment?.al?.fN?.trim() || '';
  const fullFlightCode = `${airlineCode} ${flightNumber}`.trim();
  const isRefundable = flight?.iR === true; // Explicit check

  const originCity = segment?.or?.cN || 'N/A';
  const originAirportCode = segment?.or?.aC || 'N/A';
  const originTime = formatTime(segment?.or?.dT);

  const destinationCity = lastSegment?.ds?.cN || 'N/A';
  const destinationAirportCode = lastSegment?.ds?.aC || 'N/A';
  const destinationTime = formatTime(lastSegment?.ds?.aT);

  const baggageInfo = segment?.bg || 'Info N/A'; // Use 'bg' from segment
  const cabinBaggageInfo = segment?.cBg || 'Info N/A'; // Use 'cBg' from segment

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
        justifyContent: 'center', // Center vertically too
        width: { xs: '100%', md: '20%' },
        borderRight: { xs: 'none', md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
        borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' }
      }}>
        <Box
          component="img"
          // --- Use dynamic logo ---
          src={airlineLogoSrc}
          alt={airlineName}
          onError={(e) => { e.target.onerror = null; e.target.src=DEFAULT_AIRLINE_LOGO }} // Fallback on error
          // --- End Use dynamic logo ---
          sx={{ width: 50, height: 50, borderRadius: '10%', mb: 1, objectFit: 'contain' }}
        />
        <Typography sx={{
          fontWeight: 600,
          fontSize: '0.95rem',
          textAlign: 'center',
          color: theme.palette.text.primary
        }}>
          {/* Use airlineName extracted safely */}
          {airlineName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
          {/* Use fullFlightCode extracted safely */}
          {fullFlightCode}
        </Typography>
        <Typography variant="body2" sx={{
          // Use isRefundable safely
          color: isRefundable ? theme.palette.success.main : theme.palette.error.main,
          fontSize: '0.8rem',
          mt: 1
        }}>
          {isRefundable ? "Partially Refundable" : "Not Refundable"}
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
            {/* Use originTime safely */}
            {originTime}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {/* Use originCity safely */}
            {originCity}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {/* Use originAirportCode safely */}
            {originAirportCode}
          </Typography>
        </Box>

        {/* Duration */}
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {getTimeDuration()}
          </Typography>
          <Box sx={{
            width: { xs: 60, sm: 80, md: 100 }, // Adjusted width slightly
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
            {/* Use destinationTime safely */}
            {destinationTime}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
            {/* Use destinationCity safely */}
            {destinationCity}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {/* Use destinationAirportCode safely */}
            {destinationAirportCode}
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
            mb: 1.5,
            gap: 0.5 // Add small gap
          }}>
            {/* Display comparison icon first */}
            {priceComparison.icon}
            {priceComparison.diff > 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: priceComparison.color,
                  fontWeight: 600
                }}
              >
                {`₹${priceComparison.diff.toLocaleString()} ${flight.fF > existingPrice ? 'more' : 'less'}`}
              </Typography>
            )}
            {priceComparison.diff === 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: priceComparison.color,
                  fontWeight: 600
                }}
              >
                Same price
              </Typography>
            )}
          </Box>
        )}

        {/* Cabin Class */}
        <Chip
          label={cabinClass}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            mb: 1, // Reduced bottom margin
            backgroundColor: alpha(theme.palette.info.main, 0.15), // Use info color
            color: theme.palette.info.dark, // Use info color
            fontWeight: 500,
          }}
        />

        {/* Baggage Info - simplified display */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
           <Chip
            label={`Check-in: ${baggageInfo}`}
            size="small"
            icon={<AirlinesIcon sx={{ fontSize: 14, mr: -0.5 }} />} // Example icon
            sx={{
              height: 20,
              fontSize: '0.7rem',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.text.secondary, // Slightly muted color
            }}
          />
          {cabinBaggageInfo !== 'Info N/A' && ( // Only show if available
             <Chip
              label={`Cabin: ${cabinBaggageInfo}`}
              size="small"
              icon={<AirlinesIcon sx={{ fontSize: 14, mr: -0.5 }} />} // Example icon
              sx={{
                height: 20,
                fontSize: '0.7rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.text.secondary, // Slightly muted color
              }}
            />
          )}
        </Box>

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
            disabled: isLoading,
          }}
        >
          {isLoading ? 'Loading...' : 'Flight Details'}
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
  const dispatch = useDispatch();
  
  // Data states
  const [allFlights, setAllFlights] = useState([]); // Holds the raw, unfiltered flights from API
  
  // --- NEW: Pagination State ---
  const [displayedCount, setDisplayedCount] = useState(20); // Show 20 initially
  const LOAD_INCREMENT = 20; // Load 20 more each time
  // --- END: Pagination State ---

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal and selection state
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectingFlightIndex, setSelectingFlightIndex] = useState(null);
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

  // --- DEBUGGING: Log retrieved state and token --- 
  console.log("FlightsPage location.state:", location.state);
  console.log("FlightsPage retrieved values:", {
    itineraryToken, // From Redux
    oldFlightCode,  // From location.state
    type,           // From location.state
    inquiryToken,   // From location.state
    departureDate   // From location.state
  });
  // --- END DEBUGGING ---

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

  // Function to load ALL flight data at once
  const loadFlights = useCallback(async () => {
    console.log("Loading flights...");

    try {
      // --- Payload Transformation ---
      // Extract required origin/destination fields
      const formattedOrigin = {
        code: origin?.code || '',
        city: origin?.city || ''
      };
      const formattedDestination = {
        code: destination?.code || '',
        city: destination?.city || ''
      };

      // --- Payload Transformation ---
      // Construct travelersDetails payload matching CrmChangeFlightPage.js
      // Derives counts from the first room or defaults
      const firstRoom = travelersDetails?.rooms?.[0];
      const apiTravelersDetails = {
          adults: firstRoom?.adults?.length || 1, // Send count, default 1
          children: firstRoom?.children?.length || 0, // Send count, default 0
          infants: travelersDetails?.infants || 0 // Assuming infants might be top-level or default 0
      };

      // Construct the payload according to the desired structure
      const payload = {
        origin: formattedOrigin,
        destination: formattedDestination,
        departureDate,
        travelersDetails: apiTravelersDetails, // Use the simplified structure
        type: "ONE_WAY", // Use "ONE_WAY" as per example for the search
      };
      // --- End Payload Transformation ---
      
      const response = await fetch(
        `http://localhost:5000/api/itinerary/flights/${inquiryToken}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, 
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify(payload) // Use the transformed payload
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch flights');
      }

      // Process the full response at once
      setTraceId(data?.data?.traceId || null);

      const priceRangeData = data?.data?.priceRange;
      if (priceRangeData) {
        setPriceRange(priceRangeData);
        setFilters(prev => ({
          ...prev,
          priceRange: [priceRangeData.min, priceRangeData.max]
        }));
      }

      const availableFiltersData = data?.data?.availableFilters;
      if (availableFiltersData?.airlines) {
        setAvailableAirlines(availableFiltersData.airlines);
      }

      if (availableFiltersData?.stopCounts) {
        setStopCounts(availableFiltersData.stopCounts);
      }

      // Deduplicate just in case API returns duplicates
      const newFlights = data.data.flights || [];
      const uniqueFlights = Array.from(
        new Map(newFlights.map(flight => [flight.rI, flight])).values()
      );

      setAllFlights(uniqueFlights);

    } catch (error) {
      console.error('Error loading flights:', error);
      setError(error.message);
    } finally {
      // Always stop loading indicator after the single call
      setInitialLoading(false);
    }
  }, [inquiryToken, origin, destination, departureDate, travelersDetails]);

  // Start loading data
  useEffect(() => {
    if (!inquiryToken || !origin || !destination || !departureDate) {
      navigate('/itinerary');
      return;
    }

    loadFlights(); // Call the single load function

  }, [inquiryToken, origin, destination, departureDate, navigate, loadFlights]); // loadFlights dependency

  // Calculate displayed flights using useMemo for performance
  // --- REFACTORED: Step 1 - Filter and Sort ---
  const filteredAndSortedFlights = useMemo(() => {
    console.log("Recalculating filtered and sorted flights...");
    let filtered = [...allFlights];

    // Apply filters (same logic as before)
    if (filters.priceRange && filters.priceRange.length === 2) {
      filtered = filtered.filter(flight =>
        flight.fF >= filters.priceRange[0] && flight.fF <= filters.priceRange[1]
      );
    }
    if (filters.airlines && filters.airlines.length > 0) {
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
    if (filters.durationRange && filters.durationRange.length === 2) {
      filtered = filtered.filter(flight => {
        const flightDuration = flight.sg.reduce((total, seg) => total + (seg?.dr || 0), 0);
        return flightDuration >= filters.durationRange[0] && flightDuration <= filters.durationRange[1];
      });
    }
    if (filters.cabinClasses && filters.cabinClasses.length > 0) {
      filtered = filtered.filter(flight => {
        const cabinClassCode = flight.sg[0].cC;
        const cabinClassName = cabinClassMap[cabinClassCode] || "Economy";
        return filters.cabinClasses.includes(cabinClassName);
      });
    }

    // Apply sorting (mutable sort is okay here as we start with a copy)
    switch (currentSort) {
      case "priceAsc":
        filtered.sort((a, b) => a.fF - b.fF);
        break;
      case "priceDesc":
        filtered.sort((a, b) => b.fF - a.fF);
        break;
      case "durationAsc":
        filtered.sort((a, b) => {
          const aDuration = a.sg.reduce((total, seg) => total + (seg?.dr || 0), 0);
          const bDuration = b.sg.reduce((total, seg) => total + (seg?.dr || 0), 0);
          return aDuration - bDuration;
        });
        break;
      case "recommended":
        // --- Optimization: Pre-calculate min/max values before sorting --- 
        const prices = filtered.map(f => f.fF).filter(p => typeof p === 'number');
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const priceRangeSize = (maxPrice - minPrice) > 0 ? (maxPrice - minPrice) : 1; // Avoid division by zero

        const durations = filtered.map(f => f.sg.reduce((total, seg) => total + (seg?.dr || 0), 0));
        const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
        const durationRangeSize = (maxDuration - minDuration) > 0 ? (maxDuration - minDuration) : 1; // Avoid division by zero

        const stopCountsArray = filtered.map(f => f.sg.length - 1);
        const maxStops = stopCountsArray.length > 0 ? Math.max(...stopCountsArray) : 0;
        // --- End Optimization ---

        filtered.sort((a, b) => {
          // Calculate scores using pre-calculated ranges
          const aPriceScore = typeof a.fF === 'number' ? (a.fF - minPrice) / priceRangeSize : 0.5; 
          const bPriceScore = typeof b.fF === 'number' ? (b.fF - minPrice) / priceRangeSize : 0.5;

          const aDuration = a.sg.reduce((total, seg) => total + (seg?.dr || 0), 0);
          const bDuration = b.sg.reduce((total, seg) => total + (seg?.dr || 0), 0);
          const aDurationScore = (aDuration - minDuration) / durationRangeSize;
          const bDurationScore = (bDuration - minDuration) / durationRangeSize;

          const aStopsCount = a.sg.length - 1;
          const bStopsCount = b.sg.length - 1;
          const aStopsScore = maxStops > 0 ? aStopsCount / maxStops : 0;
          const bStopsScore = maxStops > 0 ? bStopsCount / maxStops : 0;

          // Combined scoring (weights: Price: 40%, Duration: 35%, Stops: 25%)
          const aCombinedScore = (aPriceScore * 0.4) + (aDurationScore * 0.35) + (aStopsScore * 0.25);
          const bCombinedScore = (bPriceScore * 0.4) + (bDurationScore * 0.35) + (bStopsScore * 0.25);

          return aCombinedScore - bCombinedScore;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [allFlights, filters, currentSort]); // Dependencies: re-run only when these change

  // --- REFACTORED: Step 2 - Slice for Display ---
  const displayFlights = useMemo(() => {
    console.log("Slicing flights for display...");
    return filteredAndSortedFlights.slice(0, displayedCount);
  }, [filteredAndSortedFlights, displayedCount]);
  // --- END REFACTOR ---

  const handleViewFlight = async (flight) => {
    if (!traceId || !inquiryToken) {
      console.error("Detail fetch error: Missing context", { traceId, inquiryToken });
      setError("Missing traceId or inquiryToken to fetch details.");
      return;
    }

    setSelectingFlightIndex(flight.rI); // Set loading state for this specific flight
    setError(null);

    try {
      console.log(`Fetching details for flight resultIndex: ${flight.rI}, traceId: ${traceId}`);
      // 1. Call the selectFlight endpoint (like CRM add flow)
      const selectResponse = await axios.post(
        `http://localhost:5000/api/itinerary/flights/${inquiryToken}/select`,
        {
          items: [{ type: "FLIGHT", resultIndex: flight.rI }],
          traceId: traceId,
          flightType: "ONE_WAY" // Assuming ONE_WAY for now, adjust if needed based on 'type' prop
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`, 
            'X-Inquiry-Token': inquiryToken
          }
        }
      );

      console.log("Detailed Flight Data received:", selectResponse.data);

      if (!selectResponse.data.success || !selectResponse.data.data) {
        throw new Error(selectResponse.data.message || "Failed to parse detailed flight data after selection.");
      }

      // Store the DETAILED data and open the modal
      setSelectedFlight(selectResponse.data.data); 
      // Note: The modal will now receive the detailed structure

    } catch (err) {
      console.error("Error fetching flight details:", err);
      const errorMessage = err.response?.data?.details?.error || err.response?.data?.message || err.message || "Error fetching flight details";
      setError(errorMessage); // Show error in UI or use toast
      console.error(`Error fetching details: ${errorMessage}`);
      setSelectedFlight(null); // Clear selection on error
    } finally {
      setSelectingFlightIndex(null); // Reset loading state regardless of outcome
    }
  };

  const handleBackToItinerary = () => {
    dispatch(clearAllFlightStates()); // Clear any redux state if needed
    // Navigate back using URL parameters
    if (itineraryToken && inquiryToken) {
      const params = new URLSearchParams({
        itineraryToken,
        inquiryToken
      });
      navigate(`/itinerary?${params.toString()}`, { 
        state: { origin: 'flights' }
      });
    } else {
      console.warn("Missing itineraryToken or inquiryToken for back navigation. Navigating to home.");
      navigate('/'); // Fallback navigation
    }
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

  // --- NEW: Load More Handler ---
  const handleLoadMore = () => {
    setDisplayedCount(prevCount => {
      const newCount = Math.min(prevCount + LOAD_INCREMENT, filteredAndSortedFlights.length);
      console.log(`Loading more flights, new count: ${newCount} out of ${filteredAndSortedFlights.length}`);
      return newCount;
    });
  };
  // --- END: Load More Handler ---

  // Update error navigation
  if (error) {
    const params = new URLSearchParams({
      itineraryToken,
      inquiryToken,
      error: error.message || 'Failed to load flights'
    });
    navigate(`/itinerary?${params.toString()}`, {
      state: { origin: 'flights' }
    });
    return;
  }

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
            {/* Map over the memoized and SLICED displayFlights */} 
            {displayFlights.map((flight) => (
              <FlightCard
                key={flight.rI}
                flight={flight}
                onViewFlight={handleViewFlight}
                existingPrice={existingFlightPrice}
                viewMode="list"
                isLoading={selectingFlightIndex === flight.rI}
              />
            ))}
          </Box>

          {/* --- NEW: Load More Button --- */}
          {filteredAndSortedFlights.length > displayedCount && (
            <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}> {/* Added margin bottom */}
              <Button
                variant="contained"
                onClick={handleLoadMore}
                sx={{ 
                  borderRadius: '20px', 
                  px: 4, 
                  py: 1.5, // Slightly taller button
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
                    : `0 4px 10px ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark' 
                      ? `0 6px 15px ${alpha(theme.palette.primary.main, 0.4)}`
                      : `0 6px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }
                }}
              >
                Load More Flights ({displayedCount} / {filteredAndSortedFlights.length})
              </Button>
            </Box>
          )}
          {/* --- END: Load More Button --- */}

          {/* Empty state */}
          {filteredAndSortedFlights.length === 0 && !initialLoading && (
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
                {"Try adjusting your filters to see more results."}
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

          {/* End of results - Show only when all are loaded */}
          {displayFlights.length > 0 && displayedCount >= filteredAndSortedFlights.length && !initialLoading && ( 
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

      {/* Detail modal - Pass all necessary context */} 
      {selectedFlight && (
        <FlightDetailModal
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
          itineraryToken={itineraryToken}
          inquiryToken={inquiryToken}
          existingPrice={existingFlightPrice}
          type={type}
          originCityName={origin?.city}
          destinationCityName={destination?.city}
          date={departureDate}
          traceId={traceId}
          oldFlightCode={oldFlightCode}
        />
      )}
    </Container>
  );
};

export default FlightsPage;