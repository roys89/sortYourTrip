import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import {
  Box, Button, Card, CircularProgress, Container,
  Grid, IconButton, InputAdornment, Menu, MenuItem, Slider, Stack, Tab, Tabs,
  TextField, Typography
} from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAllActivityStates, setSelectedActivity } from '../../redux/slices/activitySlice';
import './Activities.css';
import ActivityViewModal from './ActivityViewModal';

const MenuContent = React.memo(({ type, onSort, onFilter, currentSort, filters, priceRange }) => {
  const [sliderValue, setSliderValue] = useState(filters.amount);

  // Handle slider change with local state
  const handleSliderChange = (_, newValue) => {
    setSliderValue(newValue);
  };

  // Only update parent state when sliding is complete
  const handleSliderChangeCommitted = (_, newValue) => {
    onFilter('amount', newValue);
  };

  useEffect(() => {
    setSliderValue(filters.amount);
  }, [filters.amount]);

  if (type === 'sort') {
    return (
      <Box sx={{ p: 2, width: 280 }}>
        <Stack spacing={2}>
          {[
            { value: 'priceAsc', label: 'Price: Low to High' },
            { value: 'priceDesc', label: 'Price: High to Low' },
            { value: 'titleAsc', label: 'Name: A to Z' }
          ].map(option => (
            <MenuItem 
              key={option.value}
              onClick={() => onSort(option.value)}
              selected={currentSort === option.value}
              sx={{ height: 40 }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, width: 280 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Search Activities</Typography>
          <TextField
            fullWidth
            size="small"
            value={filters.search}
            placeholder="Search by name..."
            onChange={(e) => onFilter('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Price Range (₹{priceRange.min.toLocaleString()} - ₹{priceRange.max.toLocaleString()})
          </Typography>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            min={priceRange.min}
            max={priceRange.max}
            step={100}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
            disableSwap
          />
        </Box>

        <Button 
          size="small" 
          onClick={() => onFilter('reset')}
          variant="outlined"
          fullWidth
        >
          Reset Filters
        </Button>
      </Stack>
    </Box>
  );
});

const FilterMenu = React.memo(({ onSort, onFilter, currentSort, filters, priceRange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTab, setCurrentTab] = useState('sort');

  const handleClose = () => setAnchorEl(null);

  const handleClickFilter = (event) => {
    setAnchorEl(event.currentTarget);
    setCurrentTab('filter');
  };

  const handleClickSort = (event) => {
    setAnchorEl(event.currentTarget);
    setCurrentTab('sort');
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton onClick={handleClickFilter}>
          <FilterListIcon />
        </IconButton>
        <IconButton onClick={handleClickSort}>
          <SortIcon />
        </IconButton>
      </Stack>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 280 }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, tab) => setCurrentTab(tab)}
            sx={{ minHeight: 48 }}
          >
            <Tab label="Filter" value="filter" />
            <Tab label="Sort" value="sort" />
          </Tabs>
        </Box>
        <MenuContent 
          type={currentTab}
          onSort={(value) => { onSort(value); handleClose(); }}
          onFilter={(type, value) => { onFilter(type, value); if (type === 'reset') handleClose(); }}
          currentSort={currentSort}
          filters={filters}
          priceRange={priceRange}
        />
      </Menu>
    </Box>
  );
});



const ActivityCard = React.memo(({ activity, onViewActivity, viewMode }) => (
  <Card className={`activity-card ${viewMode === 'grid' ? 'activity-card-grid' : ''}`}>
    <Box className={`activity-image-container ${viewMode === 'grid' ? 'activity-image-container-grid' : ''}`}>
      <img
        src={activity.imgURL || '/api/placeholder/400/300'}
        alt={activity.title}
        className="activity-image"
        loading="lazy"
        onError={(e) => { e.target.src = '/api/placeholder/400/300'; }}
      />
    </Box>
    
    <Box className="activity-content">
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" gutterBottom>{activity.title}</Typography>
        {activity.duration && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Duration: {activity.duration}
          </Typography>
        )}
        {activity.shortDesc && (
          <Typography variant="body2" color="text.secondary">
            {activity.shortDesc}
          </Typography>
        )}
      </Box>
      
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mt: 'auto' }}
      >
        <Typography variant="h6" color="primary">
          {`${activity.currency || '₹'} ${activity.amount.toLocaleString()}`}
        </Typography>
        <Button variant="contained" onClick={() => onViewActivity(activity)}>
          View Activity
        </Button>
      </Stack>
    </Box>
  </Card>
));

const ActivitiesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const changeActivityFromRedux = useSelector((state) => state.activities.changeActivity);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedViewActivity, setSelectedViewActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [visibleActivities, setVisibleActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState('priceAsc');
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    search: '',
    amount: [0, 0]
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
        setError(null);

        const response = await fetch(
          `http://localhost:5000/api/itinerary/activities/${activityData.inquiryToken}/${activityData.city}/${activityData.date}`
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
                amount: Number(item.amount) || 0 // Ensure amount is a number
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
          amount: [minPrice, maxPrice]
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
      const minPrice = Number(filters.amount[0]) || 0;
      const maxPrice = Number(filters.amount[1]) || Infinity;
      
      const matchesPrice = price >= minPrice && price <= maxPrice;
      
      return matchesSearch && matchesPrice;
    }).sort((a, b) => {
      const aPrice = Number(a.amount) || 0;
      const bPrice = Number(b.amount) || 0;
      
      switch (sortType) {
        case 'priceAsc': return aPrice - bPrice;
        case 'priceDesc': return bPrice - aPrice;
        case 'titleAsc': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
  }, [activities, filters, sortType]);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = (page + 1) * ITEMS_PER_PAGE;
    setVisibleActivities(filteredActivities.slice(startIndex, endIndex));
  }, [filteredActivities, page, ITEMS_PER_PAGE]);

  const handleFilterChange = useCallback((type, value) => {
    if (type === 'reset') {
      setFilters({
        search: '',
        amount: [priceRange.min, priceRange.max]
      });
    } else {
      setFilters(prev => {
        if (type === 'amount') {
          const [min, max] = value;
          return {
            ...prev,
            amount: [
              Math.max(min, priceRange.min),
              Math.min(max, priceRange.max)
            ]
          };
        }
        return { ...prev, [type]: value };
      });
    }
    setPage(0);
  }, [priceRange]);

  const handleViewActivity = useCallback((activity) => {
    const enrichedActivity = {
      ...activity,
      inquiryToken: activityData.inquiryToken,
      itineraryToken: activityData.itineraryToken,  // Add this
      date: activityData.date,
      city: activityData.city,
      oldActivityCode: activityData.activityCode,
      travelersDetails: activityData.travelersDetails,
      existingPrice: activityData.existingPrice
    };
    
    dispatch(setSelectedActivity(enrichedActivity));
    setSelectedViewActivity(enrichedActivity);
    setViewModalOpen(true);
  }, [activityData, dispatch]);
  if (error) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button variant="contained" onClick={handleBackToItinerary}>
          Return to Itinerary
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="activities-page">
      <Box className="activity-header">
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          sx={{ mb: 3 }}
        >
          <div>
            <Typography variant="h4" component="h1" gutterBottom>
              Available Activities
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {activityData?.city} - {new Date(activityData?.date).toLocaleDateString()}
            </Typography>
          </div>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToItinerary}
              variant="outlined"
            >
              Back to Itinerary
            </Button>

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
            <FilterMenu 
              onSort={setSortType}
              onFilter={handleFilterChange}
              currentSort={sortType}
              filters={filters}
              priceRange={priceRange}
            />
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : visibleActivities.length > 0 ? (
          <>
            {visibleActivities.map((activity) => (
              <Grid item xs={12} md={viewMode === 'grid' ? 6 : 12} key={activity.code}>
                <ActivityCard
                  activity={activity}
                  onViewActivity={handleViewActivity}
                  viewMode={viewMode}
                />
              </Grid>
            ))}
            {visibleActivities.length < filteredActivities.length && (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setPage(prev => prev + 1)}
                  className="load-more-button"
                >
                  Load More ({filteredActivities.length - visibleActivities.length} more)
                </Button>
              </Grid>
            )}
          </>
        ) : (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No activities found matching your filters
            </Typography>
          </Grid>
        )}
      </Grid>

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