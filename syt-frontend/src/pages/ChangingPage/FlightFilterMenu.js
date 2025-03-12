import {
  AttachMoney,
  ExpandMore,
  QueryBuilder
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Menu,
  MenuItem,
  Slider,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const MenuContent = React.memo(({ 
  type, 
  onSort, 
  onFilter, 
  currentSort, 
  filters, 
  priceRange,
  currentTab,
  availableAirlines = [],
  stopCounts = {},
  cabinClasses = []
}) => {
  const theme = useTheme();
  const [sliderValue, setSliderValue] = useState(filters.priceRange);
  const [localAirlines, setLocalAirlines] = useState(filters.airlines || []);
  const [localStops, setLocalStops] = useState(filters.stops);
  const [localCabinClasses, setLocalCabinClasses] = useState(filters.cabinClasses || []);

  // Reset local state when filters change from parent
  useEffect(() => {
    setSliderValue(filters.priceRange);
    setLocalAirlines(filters.airlines || []);
    setLocalStops(filters.stops);
    setLocalCabinClasses(filters.cabinClasses || []);
  }, [filters, currentTab]);

  const handleSliderChange = (_, newValue) => {
    setSliderValue(newValue);
  };

  const handleSliderChangeCommitted = (_, newValue) => {
    const updatedFilters = {
      ...filters,
      priceRange: newValue
    };
    onFilter(updatedFilters);
  };

  const handleAirlineChange = (airlineName) => {
    const newAirlines = localAirlines.includes(airlineName)
      ? localAirlines.filter(a => a !== airlineName)
      : [...localAirlines, airlineName];
    
    setLocalAirlines(newAirlines);
    
    const updatedFilters = {
      ...filters,
      airlines: newAirlines
    };
    onFilter(updatedFilters);
  };

  const handleStopsChange = (stops) => {
    const newStops = localStops === stops ? null : stops;
    setLocalStops(newStops);
    
    const updatedFilters = {
      ...filters,
      stops: newStops
    };
    onFilter(updatedFilters);
  };

  const handleCabinClassChange = (cabinClass) => {
    const newCabinClasses = localCabinClasses.includes(cabinClass)
      ? localCabinClasses.filter(c => c !== cabinClass)
      : [...localCabinClasses, cabinClass];
    
    setLocalCabinClasses(newCabinClasses);
    
    const updatedFilters = {
      ...filters,
      cabinClasses: newCabinClasses
    };
    onFilter(updatedFilters);
  };

  const handleReset = () => {
    // Reset all filters to default
    onFilter({
      priceRange: [priceRange.min, priceRange.max],
      airlines: [],
      stops: null,
      cabinClasses: []
    });
  };

  if (type === 'sort') {
    return (
      <Box sx={{ p: 2, width: 280 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary }}>Sort Flights By</Typography>
        {[
          { 
            value: 'priceAsc', 
            label: 'Price: Low to High',
            icon: <AttachMoney fontSize="small" />
          },
          { 
            value: 'priceDesc', 
            label: 'Price: High to Low',
            icon: <AttachMoney fontSize="small" />
          },
          { 
            value: 'durationAsc', 
            label: 'Duration: Shortest First',
            icon: <QueryBuilder fontSize="small" />
          }
        ].map(option => (
          <MenuItem 
            key={option.value}
            onClick={() => onSort(option.value)}
            selected={currentSort === option.value}
            sx={{ 
              height: 40,
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              },
              '&.Mui-selected:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
              }
            }}
          >
            {option.icon}
            <Typography sx={{ ml: 1.5 }}>{option.label}</Typography>
          </MenuItem>
        ))}
      </Box>
    );
  }

  // Get airlines list from props
  const airlinesForDisplay = availableAirlines.length > 0 
    ? availableAirlines
    : ['Air India', 'Indigo', 'Emirates', 'Etihad Airways', 'Qatar Airways'];

  // Default cabin classes if not provided
  const cabinClassesForDisplay = cabinClasses.length > 0
    ? cabinClasses
    : ['Economy', 'Premium Economy', 'Business', 'First'];

  // Format price for display
  const formatPrice = price => `₹${price.toLocaleString()}`;

  return (
    <Box sx={{ p: 0, width: 280 }}>
      <Stack spacing={0}>
        {/* Price Range Section */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>Price Range</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatPrice(sliderValue[0])} - {formatPrice(sliderValue[1])}
            </Typography>
          </Stack>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            min={priceRange.min}
            max={priceRange.max}
            valueLabelDisplay="auto"
            valueLabelFormat={formatPrice}
            disableSwap
            sx={{ 
              '& .MuiSlider-thumb': { 
                width: 16, 
                height: 16,
                backgroundColor: theme.palette.primary.main
              },
              '& .MuiSlider-track': {
                backgroundColor: theme.palette.primary.main
              },
              '& .MuiSlider-rail': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">Min: {formatPrice(priceRange.min)}</Typography>
            <Typography variant="caption" color="text.secondary">Max: {formatPrice(priceRange.max)}</Typography>
          </Box>
        </Box>

        {/* Stops Section */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.text.primary }}>Stops</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {[0, 1, 2].map((stops) => {
              const count = stopCounts && stopCounts[stops] ? stopCounts[stops] : null;
              
              return (
                <Button
                  key={stops}
                  variant={localStops === stops ? 'contained' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => handleStopsChange(stops)}
                  sx={{ 
                    minWidth: 'unset', 
                    flex: 1, 
                    mx: 0.5, 
                    px: 1,
                    fontSize: '0.75rem',
                    position: 'relative',
                    paddingBottom: count ? '1.5rem' : undefined,
                    ...(localStops === stops ? {
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.9)
                      }
                    } : {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderColor: theme.palette.primary.main
                      }
                    })
                  }}
                >
                  {stops === 0 ? 'Non-Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
                  
                  {count && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        position: 'absolute',
                        bottom: '0.25rem',
                        left: 0,
                        right: 0,
                        color: localStops === stops ? 'white' : 'text.secondary',
                        fontSize: '0.6rem'
                      }}
                    >
                      ({count})
                    </Typography>
                  )}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* NEW: Cabin Class Section */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.text.primary }}>Cabin Class</Typography>
          <FormGroup>
            {cabinClassesForDisplay.map((cabinClass) => (
              <FormControlLabel
                key={cabinClass}
                control={
                  <Checkbox
                    checked={localCabinClasses.includes(cabinClass)}
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
                sx={{ mb: 0.5 }}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Airlines Section */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.text.primary }}>Airlines</Typography>
          <FormGroup>
            {airlinesForDisplay.map((airlineName) => (
              <FormControlLabel
                key={airlineName}
                control={
                  <Checkbox
                    checked={localAirlines.includes(airlineName)}
                    onChange={() => handleAirlineChange(airlineName)}
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
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>{airlineName}</Typography>
                }
                sx={{ mb: 0.5 }}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Reset button section */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Button 
            size="small" 
            onClick={handleReset}
            variant="outlined"
            fullWidth
            sx={{ 
              textTransform: 'none',
              borderColor: alpha(theme.palette.primary.main, 0.5),
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: theme.palette.primary.main
              }
            }}
          >
            Reset Filters
          </Button>
        </Box>
      </Stack>
    </Box>
  );
});

const FlightFilterMenu = React.memo(({ 
  priceRange, 
  filters, 
  setFilters, 
  currentSort, 
  setCurrentSort,
  anchorEl,
  onClose,
  currentTab: propCurrentTab,
  availableAirlines,
  stopCounts,
  cabinClasses
}) => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(propCurrentTab || 'filter');
  
  // Update tab when props change
  useEffect(() => {
    if (propCurrentTab) {
      setCurrentTab(propCurrentTab);
    }
  }, [propCurrentTab]);

  // Filter change handler
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Sort change handler
  const handleSort = (value) => {
    setCurrentSort(value);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: 280,
          borderRadius: 2,
          overflow: 'hidden',
          mt: 1,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: alpha(theme.palette.divider, 0.2), px: 1, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, tab) => setCurrentTab(tab)}
          sx={{ 
            minHeight: 48,
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main
            }
          }}
          variant="fullWidth"
        >
          <Tab 
            label="Filter" 
            value="filter" 
            sx={{ 
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: currentTab === 'filter' ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.7),
              '&.Mui-selected': {
                color: theme.palette.primary.main
              }
            }}
          />
          <Tab 
            label="Sort" 
            value="sort" 
            sx={{ 
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: currentTab === 'sort' ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.7),
              '&.Mui-selected': {
                color: theme.palette.primary.main
              }
            }}
          />
        </Tabs>
      </Box>
      <MenuContent 
        type={currentTab}
        onSort={handleSort}
        onFilter={handleFilterChange}
        currentSort={currentSort}
        filters={filters}
        priceRange={priceRange}
        currentTab={currentTab}
        availableAirlines={availableAirlines}
        stopCounts={stopCounts}
        cabinClasses={cabinClasses}
      />
    </Menu>
  );
});

// New Sidebar Filter Component based on the design
const FlightFilterSidebar = React.memo(({ 
  priceRange, 
  filters, 
  setFilters, 
  availableAirlines = [],
  stopCounts = {},
  cabinClasses = []
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState({
    stops: true,
    price: true,
    airlines: true,
    duration: true,
    cabinClass: true
  });
  
  const handleExpandToggle = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const handleReset = () => {
    setFilters({
      priceRange: [priceRange.min, priceRange.max],
      airlines: [],
      stops: null,
      durationRange: [0, 1440], // 24 hours in minutes
      cabinClasses: []
    });
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

  // Render a filter section with expandable accordion      
  const FilterSection = ({ title, children, sectionKey }) => (
    <Accordion 
      expanded={expanded[sectionKey]} 
      onChange={() => handleExpandToggle(sectionKey)}
      disableGutters
      elevation={0}
      sx={{ 
        mb: 1,
        border: 'none', 
        borderRadius: 0,
        '&:before': { display: 'none' },
        backgroundColor: 'transparent'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore sx={{ color: theme.palette.primary.main }} />}
        sx={{ 
          padding: 0,
          minHeight: 48,
          '& .MuiAccordionSummary-content': {
            margin: 0
          }
        }}
      >
        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0, mt: 1 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Card 
      elevation={0}
      sx={{ 
        p: 3, 
        mr: 3, 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>Filter by</Typography>
        <Button 
          variant="text" 
          sx={{ 
            textTransform: 'none', 
            color: theme.palette.primary.main 
          }}
          onClick={handleReset}
        >
          Reset
        </Button>
      </Box>

      {/* Stop Filter */}
      <FilterSection title="Stop" sectionKey="stops">
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
      </FilterSection>

      <Divider sx={{ my: 1, borderColor: alpha(theme.palette.divider, 0.1) }} />

      {/* Price Filter */}
      <FilterSection title="Price" sectionKey="price">
        <Box sx={{ px: 1, mt: 1 }}>
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
      </FilterSection>

      <Divider sx={{ my: 1, borderColor: alpha(theme.palette.divider, 0.1) }} />

      {/* NEW: Cabin Class Filter */}
      <FilterSection title="Cabin Class" sectionKey="cabinClass">
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
      </FilterSection>

      <Divider sx={{ my: 1, borderColor: alpha(theme.palette.divider, 0.1) }} />

      {/* Airlines Filter */}
      <FilterSection title="Airlines" sectionKey="airlines">
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
      </FilterSection>

      <Divider sx={{ my: 1, borderColor: alpha(theme.palette.divider, 0.1) }} />

      {/* Duration Filter */}
      <FilterSection title="Duration" sectionKey="duration">
        <Box sx={{ px: 1, mt: 1 }}>
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
      </FilterSection>
    </Card>
  );
});

export { FlightFilterMenu, FlightFilterSidebar };
