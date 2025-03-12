import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ExploreIcon from '@mui/icons-material/Explore';
import FilterListIcon from '@mui/icons-material/FilterList';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box, Button, CircularProgress, Container,
  Divider,
  Drawer,
  FormControl, FormControlLabel, IconButton, InputAdornment,
  Paper, Radio, RadioGroup, Slider, Stack, TextField,
  Typography, alpha,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAllActivityStates, setSelectedActivity } from '../../redux/slices/activitySlice';
import ActivityViewModal from './ActivityViewModal';

// Activity card component
const ActivityCard = ({ activity, onViewActivity, viewMode, existingPrice = 0 }) => {
  const theme = useTheme();
  
  // Handle image URL
  const imageUrl = activity.imgURL || '/api/placeholder/400/300';
  
  // Generate a simple rating (for demonstration)
  const formattedRating = activity.rating;
  
  // Calculate price difference
  const currentPrice = activity.amount || 0;
  const priceDifference = currentPrice - existingPrice;
  const priceStatus = priceDifference === 0 ? "same" : priceDifference > 0 ? "increased" : "decreased";

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        cursor: "pointer",
        backgroundColor: "transparent",
        boxShadow: "none",
        "&:hover": {
          transform: "translateY(-4px)",
        },
      }}
      onClick={() => onViewActivity(activity)}
    >
      {/* Image Section */}
      <Box 
        sx={{ 
          position: "relative", 
          height: 220,
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0px 8px 20px rgba(0,0,0,0.2)",
          },
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={activity.title || "Activity"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "8px",
          }}
          onError={(e) => {
            e.target.src = "/api/placeholder/400/300";
          }}
        />
        
        {/* Activity Type Tag */}
        {activity.activityType && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              borderRadius: "4px",
              px: 1,
              py: 0.5,
              fontSize: "0.7rem",
              fontWeight: 500,
            }}
          >
            {activity.activityType}
          </Box>
        )}
      </Box>
      
      {/* Content Section */}
      <Box sx={{ p: 1.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* City name and Rating in same row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          {/* City on left */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ fontSize: "0.75rem" }}
          >
            {activity.city || ""}
          </Typography>
          
          {/* Rating on right */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "4px",
                backgroundColor: formattedRating >= 4.5 ? "#e91e63" : "#f06292",
                color: "white",
                fontWeight: 700,
                fontSize: "0.8rem",
                mr: 0.5,
              }}
            >
              {formattedRating}
            </Box>
          </Box>
        </Box>
        
        {/* Activity Name */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            mb: 1,
            lineHeight: 1.2,
            height: 42,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            fontSize: "0.95rem"
          }}
        >
          {activity.title || "Activity Name"}
        </Typography>
        
        {/* Price Comparison - At the bottom, showing difference */}
        <Box sx={{ mt: "auto" }}>
          {priceStatus !== "same" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: priceStatus === "increased" ? "#f44336" : "#4caf50",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              {priceStatus === "increased" ? (
                <>
                  <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" sx={{ color: "inherit", fontWeight: 600 }}>
                    +{'₹'} {Math.abs(priceDifference).toLocaleString()}
                  </Typography>
                </>
              ) : (
                <>
                  <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" sx={{ color: "inherit", fontWeight: 600 }}>
                    -{'₹'} {Math.abs(priceDifference).toLocaleString()}
                  </Typography>
                </>
              )}
            </Box>
          )}
          {priceStatus === "same" && (
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Same price
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Activity Filter Menu Component
const ActivityFilterMenu = ({ 
  priceRange, 
  filters, 
  onFilterChange, 
  onSortChange, 
  currentSort,
}) => {
  const theme = useTheme();
  const [localPriceRange, setLocalPriceRange] = useState(filters.price || [0, 10000]);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  
  // Update local state when filters prop changes
  useEffect(() => {
    setLocalPriceRange(filters.price || [priceRange.min, priceRange.max]);
    setLocalSearch(filters.search || '');
  }, [filters, priceRange]);

  // Handle price slider change
  const handlePriceChange = (_, newValue) => {
    setLocalPriceRange(newValue);
  };

  // Apply price filter when slider is released
  const handlePriceChangeCommitted = (_, newValue) => {
    onFilterChange('price', newValue);
  };

  // Apply search after typing stops
  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
    const value = e.target.value;
    
    // Debounce the search input
    const timeoutId = setTimeout(() => {
      onFilterChange('search', value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Reset all filters
  const handleResetFilters = () => {
    onFilterChange('reset');
  };

  // Sort options
  const sortOptions = [
    { value: 'priceAsc', label: 'Price: Low to High' },
    { value: 'priceDesc', label: 'Price: High to Low' },
    { value: 'nameAsc', label: 'Name: A to Z' }
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '12px',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Filter Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterListIcon 
          sx={{ color: theme.palette.primary.main, mr: 1 }} 
        />
        <Typography variant="h6" fontWeight={600}>
          Filters
        </Typography>
        <Button 
          variant="text" 
          size="small" 
          onClick={handleResetFilters}
          sx={{ 
            ml: 'auto',
            color: theme.palette.text.secondary,
          }}
        >
          Reset
        </Button>
      </Box>

      {/* Search Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Search Activities
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name..."
          value={localSearch}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />
      </Box>

      {/* Price Range Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Price Range
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            ₹{localPriceRange[0].toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ₹{localPriceRange[1].toLocaleString()}
          </Typography>
        </Box>
        <Slider
          value={localPriceRange}
          onChange={handlePriceChange}
          onChangeCommitted={handlePriceChangeCommitted}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
          min={priceRange.min}
          max={priceRange.max}
          step={Math.max(100, Math.floor((priceRange.max - priceRange.min) / 20))}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Sort Options */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SortIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Sort By
          </Typography>
        </Box>
        <FormControl component="fieldset">
          <RadioGroup
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {sortOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={<Typography variant="body2">{option.label}</Typography>}
                sx={{ my: 0.5 }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
    </Paper>
  );
};

// Main Activities Page Component
const ActivitiesPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const changeActivityFromRedux = useSelector((state) => state.activities.changeActivity);
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // UI States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedViewActivity, setSelectedViewActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [visibleActivities, setVisibleActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter and Sort States
  const [currentSort, setCurrentSort] = useState('priceAsc');
  const [filters, setFilters] = useState({
    search: '',
    price: [0, 0]
  });

  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 0
  });

  const activityData = changeActivityFromRedux || state;

  useEffect(() => {
    if (!activityData?.inquiryToken) {
      navigate('/itinerary');
      return;
    }

    const fetchActivities = async () => {
      try {
        setLoading(true);
        setInitialLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:5000/api/itinerary/activities/${activityData.inquiryToken}/${activityData.city}/${activityData.date}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
              'X-Inquiry-Token': activityData.inquiryToken,
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();

        // Validate the response format
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }

        // Check if data contains required fields
        if (!data.searchId || !Array.isArray(data.data)) {
          throw new Error('Invalid response structure');
        }

        // Extract activities and ensure they're valid
        const uniqueActivities = Array.from(
          new Map(
            data.data
              .filter(item => (
                item && 
                typeof item === 'object' && 
                item.code && 
                item.title && 
                typeof item.amount === 'number'
              ))
              .map(item => [item.code, {
                ...item,
                amount: Number(item.amount) || 0,
                city: activityData.city // Add city to each activity
              }])
          ).values()
        );

        if (uniqueActivities.length === 0) {
          throw new Error('No activities available');
        }
        
        setActivities(uniqueActivities);

        // Calculate price range from valid data
        const prices = uniqueActivities.map(a => Number(a.amount) || 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        setPriceRange({ min: minPrice, max: maxPrice });
        setFilters(prev => ({
          ...prev,
          price: [minPrice, maxPrice]
        }));

        // Set initial visible activities
        setVisibleActivities(uniqueActivities.slice(0, ITEMS_PER_PAGE));
        
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err.message || 'Failed to load activities');
        setActivities([]);
        setVisibleActivities([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    fetchActivities();
  }, [activityData, navigate, ITEMS_PER_PAGE]);

  const handleBackToItinerary = () => {
    dispatch(clearAllActivityStates());
    navigate('/itinerary', {
      state: { itineraryInquiryToken: activityData?.inquiryToken }
    });
  };

  const filteredActivities = useMemo(() => {
    if (!activities.length) return [];
    
    return activities.filter(activity => {
      const matchesSearch = !filters.search || 
        activity.title.toLowerCase().includes(filters.search.toLowerCase());
      
      const price = Number(activity.amount) || 0;
      const minPrice = Number(filters.price[0]) || 0;
      const maxPrice = Number(filters.price[1]) || Infinity;
      
      const matchesPrice = price >= minPrice && price <= maxPrice;
      
      return matchesSearch && matchesPrice;
    }).sort((a, b) => {
      const aPrice = Number(a.amount) || 0;
      const bPrice = Number(b.amount) || 0;
      
      switch (currentSort) {
        case 'priceAsc': return aPrice - bPrice;
        case 'priceDesc': return bPrice - aPrice;
        case 'nameAsc': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
  }, [activities, filters, currentSort]);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = (page + 1) * ITEMS_PER_PAGE;
    setVisibleActivities(filteredActivities.slice(startIndex, endIndex));
  }, [filteredActivities, page, ITEMS_PER_PAGE]);

  const handleFilterChange = useCallback((type, value) => {
    if (type === 'reset') {
      setFilters({
        search: '',
        price: [priceRange.min, priceRange.max]
      });
    } else {
      setFilters(prev => {
        if (type === 'price') {
          return {
            ...prev,
            price: value
          };
        }
        return { ...prev, [type]: value };
      });
    }
    setPage(0);
  }, [priceRange]);

  const handleSortChange = (value) => {
    setCurrentSort(value);
  };

  const handleViewActivity = useCallback((activity) => {
    dispatch(setSelectedActivity(activity));
    setSelectedViewActivity(activity);
    setViewModalOpen(true);
  }, [dispatch]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };
  
  // Format date for display
  const formattedDate = useMemo(() => {
    if (!activityData?.date) return '';
    const date = new Date(activityData.date);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [activityData?.date]);

  if (initialLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          p: 3
        }}
      >
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Finding exciting activities for your journey...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: 5, 
          px: { xs: 2, md: 4 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}
      >
        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            p: 4,
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            backgroundColor: alpha(theme.palette.error.main, 0.05),
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, color: theme.palette.error.main, fontWeight: 600 }}>
            Error Loading Activities
          </Typography>
          <Typography sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleBackToItinerary}
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={{
              borderRadius: '10px',
              padding: '10px 24px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Return to Itinerary
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        pt: { xs: 6, md: 8 },
        pb: 6,
        px: { xs: 2, md: 4 } 
      }}
    >
      {/* Header with Background */}
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
                <ExploreIcon fontSize="small" color="primary" />
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
                  Activities in {activityData?.city}
                </Typography>
                
              </Box>
            </Box>
            
            {/* Mobile Filter Button */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {isMobile && (
                <IconButton 
                  onClick={() => setMobileFilterOpen(true)}
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
                  <FilterListIcon fontSize="small" />
                </IconButton>
              )}
              
              {/* Back Button */}
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
              {activityData?.date && (
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
                  <DateRangeIcon fontSize="small" color="primary" />
                  <Typography variant="caption" fontWeight={500}>
                    {formattedDate}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      {/* Main Content Layout */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3
      }}>
        {/* Filter Panel - Desktop Only */}
        {!isMobile && (
          <Box sx={{ 
            width: { md: '280px', lg: '320px' },
            flexShrink: 0 
          }}>
            <ActivityFilterMenu 
              priceRange={priceRange}
              filters={filters}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              currentSort={currentSort}
            />
          </Box>
        )}

        {/* Activities Area */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Activities Grid - 3 in a row */}
          <Box sx={{ 
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(1, 1fr)",
              sm: "repeat(2, 1fr)", 
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)"
            },
            gap: 2,
            mb: 4
          }}>
            {visibleActivities.map((activity) => (
              <ActivityCard
                key={activity.code}
                activity={activity}
                onViewActivity={handleViewActivity}
                viewMode={viewMode}
                existingPrice={activityData?.existingPrice || 0}
              />
            ))}
          </Box>

          {/* No Results */}
          {filteredActivities.length === 0 && (
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                borderRadius: '16px',
                border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                No activities match your filters
              </Typography>
              <Button 
                startIcon={<FilterListIcon />}
                onClick={() => handleFilterChange('reset')}
                sx={{ mt: 2 }}
              >
                Reset Filters
              </Button>
            </Box>
          )}

          {/* Load More Button with CircularProgress */}
          {visibleActivities.length < filteredActivities.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={handleLoadMore}
                  disabled={loading}
                  endIcon={loading ? null : <NorthEastIcon fontSize="small" />}
                  sx={{
                    borderRadius: '24px',
                    height: 48,
                    minWidth: '240px',
                    fontWeight: 500,
                    textTransform: 'none',
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.2s ease',
                    backgroundColor: theme.palette.mode === 'dark' ? '#d32f2f' : (theme.palette.primary.main, 1), 
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? '#b71c1c' : (theme.palette.secondary.main, 1),
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                      <span>Loading more activities...</span>
                    </Box>
                  ) : (
                    `View More Activities (${filteredActivities.length - visibleActivities.length} more)`
                  )}
                </Button>
              </Box>
            </motion.div>
          )}
        </Box>
      </Box>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{
          sx: {
            width: '85%',
            maxWidth: '320px'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Typography variant="h6" fontWeight={600}>
            Filters & Sort
          </Typography>
          <IconButton onClick={() => setMobileFilterOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          <ActivityFilterMenu 
            priceRange={priceRange}
            filters={filters}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            currentSort={currentSort}
          />
        </Box>
      </Drawer>

      {/* Activity View Modal */}
      <ActivityViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedViewActivity(null);
        }}
        activity={selectedViewActivity}
        inquiryToken={activityData?.inquiryToken}
        city={activityData?.city}
        date={activityData?.date}
      />
    </Container>
  );
};

export default ActivitiesPage;