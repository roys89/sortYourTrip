import {
    AccessTime,
    Brightness3,
    Brightness5,
    Brightness6,
    FilterList,
    FlightTakeoff,
    GridView,
    LocalOffer,
    LuggageOutlined,
    Sort,
    ViewAgenda,
    WbSunny
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    Checkbox,
    Chip,
    Divider,
    Drawer,
    FormControlLabel,
    FormGroup,
    Menu,
    MenuItem,
    Slider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

// FlightCard Component
const FlightCard = ({ flight, onViewFlight, existingPrice, gridView }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const segment = flight.sg[0];

  const cardStyle = {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(66, 66, 66, 0.85)' 
      : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
    borderRadius: '12px',
    border: `1px solid ${theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)'}`,
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(66, 66, 66, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
    }
  };

  const getTimeDuration = () => {
    const duration = flight.sg.reduce((total, seg) => total + (seg.dr || 0), 0);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStops = () => {
    const stops = flight.sg.length - 1;
    if (stops === 0) return 'Direct Flight';
    return `${stops} Stop${stops > 1 ? 's' : ''}`;
  };

  const getPriceChangeStyle = () => {
    if (!existingPrice) return {};
    const difference = flight.pF - existingPrice;
    return {
      color: difference > 0 ? theme.palette.error.main : theme.palette.success.main,
      fontWeight: 600
    };
  };

  return (
    <Card 
      sx={cardStyle} 
      className={`${gridView ? 'md:w-[calc(50%-1rem)]' : 'w-full'} mb-4`}
    >
      <Box className="p-4">
        <Stack spacing={2}>
          {/* Header: Airline & Price */}
          <Box className="flex justify-between items-start">
            <Stack spacing={0.5}>
              <Typography variant="h6" color="primary">
                {segment.al.alN}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {`${segment.al.alC} ${segment.al.fN}`}
              </Typography>
              {segment.bg && (
                <Chip 
                  icon={<LuggageOutlined />}
                  size="small" 
                  label={segment.bg}
                  color="primary" 
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
            </Stack>
            
            <Stack alignItems="flex-end">
              <Typography variant="h5" color="primary">
                ₹{flight.pF.toLocaleString()}
              </Typography>
              {existingPrice && (
                <Typography variant="body2" sx={getPriceChangeStyle()}>
                  {flight.pF > existingPrice ? '↑' : '↓'} 
                  ₹{Math.abs(flight.pF - existingPrice).toLocaleString()}
                </Typography>
              )}
              {flight.fareIdentifier && (
                <Chip
                  size="small"
                  label={flight.fareIdentifier.name}
                  sx={{ 
                    mt: 1,
                    backgroundColor: flight.fareIdentifier.colorCode,
                    color: '#fff'
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Flight Details */}
          <Box className="flex justify-between items-center">
            {/* Departure */}
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="h6">
                {new Date(segment.or.dT).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
              <Typography variant="body2">{segment.or.cN}</Typography>
              <Typography variant="caption" color="text.secondary">
                {segment.or.aC}
              </Typography>
            </Stack>

            {/* Duration & Stops */}
            <Stack alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {getTimeDuration()}
              </Typography>
              <Box className="relative w-24 flex items-center">
                <Box className="w-full h-px bg-gray-300" />
                <FlightTakeoff 
                  sx={{ 
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(90deg)',
                    color: theme.palette.primary.main,
                    fontSize: 20
                  }} 
                />
              </Box>
              <Chip
                size="small"
                label={getStops()}
                color={flight.sg.length === 1 ? 'success' : 'primary'}
                variant="outlined"
              />
            </Stack>

            {/* Arrival */}
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="h6">
                {new Date(flight.sg[flight.sg.length - 1].ds.aT).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
              <Typography variant="body2">
                {flight.sg[flight.sg.length - 1].ds.cN}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {flight.sg[flight.sg.length - 1].ds.aC}
              </Typography>
            </Stack>
          </Box>

          {/* Action Button */}
          <Box className="flex justify-end">
            <Button 
              variant="contained" 
              onClick={() => onViewFlight(flight)}
              sx={{ 
                minWidth: 150,
                background: theme.palette.button.main,
                '&:hover': {
                  background: theme.palette.button.hoverGradient,
                  animation: theme.palette.button.hoverAnimation
                }
              }}
            >
              Select Flight
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};

// Enhanced Filter Menu Component
const EnhancedFilterMenu = ({ 
  priceRange, 
  filters, 
  setFilters, 
  currentSort, 
  setCurrentSort,
  airlines,
  fareTypes 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  const timeFilters = [
    { key: 'early', label: 'Early Morning', icon: <WbSunny />, time: '00:00 - 06:00' },
    { key: 'morning', label: 'Morning', icon: <Brightness5 />, time: '06:00 - 12:00' },
    { key: 'afternoon', label: 'Afternoon', icon: <Brightness6 />, time: '12:00 - 18:00' },
    { key: 'night', label: 'Night', icon: <Brightness3 />, time: '18:00 - 24:00' }
  ];

  const sortOptions = [
    { value: 'priceAsc', label: 'Price: Low to High', icon: <LocalOffer /> },
    { value: 'priceDesc', label: 'Price: High to Low', icon: <LocalOffer /> },
    { value: 'durationAsc', label: 'Duration: Shortest First', icon: <AccessTime /> },
    { value: 'departureAsc', label: 'Departure: Earliest', icon: <FlightTakeoff /> }
  ];

  const handlePriceChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      priceRange: newValue
    }));
  };

  const handleTimeFilter = (timeKey) => {
    setFilters(prev => ({
      ...prev,
      departureTime: {
        ...prev.departureTime,
        [timeKey]: !prev.departureTime[timeKey]
      }
    }));
  };

  const handleStopsFilter = (stops) => {
    setFilters(prev => ({
      ...prev,
      stops: prev.stops === stops ? null : stops
    }));
  };

  const handleAirlineFilter = (airline) => {
    setFilters(prev => {
      const currentAirlines = prev.airlines;
      const newAirlines = currentAirlines.includes(airline.name)
        ? currentAirlines.filter(a => a !== airline.name)
        : [...currentAirlines, airline.name];
      
      return {
        ...prev,
        airlines: newAirlines
      };
    });
  };

  const handleFareTypeFilter = (fareType) => {
    setFilters(prev => {
      const currentFares = prev.fareTypes;
      const newFares = currentFares.includes(fareType.name)
        ? currentFares.filter(f => f !== fareType.name)
        : [...currentFares, fareType.name];
      
      return {
        ...prev,
        fareTypes: newFares
      };
    });
  };

  const drawerContent = (
    <Box sx={{ width: isMobile ? '100vw' : 400, p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h6">Filter Flights</Typography>

        {/* Price Range */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Price Range</Typography>
          <Slider
            value={filters.priceRange}
            onChange={handlePriceChange}
            valueLabelDisplay="auto"
            min={priceRange.min}
            max={priceRange.max}
            valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
          />
          <Box className="flex justify-between mt-2">
            <Typography variant="caption">
              ₹{filters.priceRange[0].toLocaleString()}
            </Typography>
            <Typography variant="caption">
              ₹{filters.priceRange[1].toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Stops */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Stops</Typography>
          <ToggleButtonGroup 
            exclusive
            value={filters.stops}
            onChange={(e, value) => handleStopsFilter(value)}
            fullWidth
          >
            <ToggleButton value={0}>Non-stop</ToggleButton>
            <ToggleButton value={1}>1 Stop</ToggleButton>
            <ToggleButton value={2}>2+ Stops</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* Departure Time */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Departure Time</Typography>
          <FormGroup>
            {timeFilters.map(({ key, label, icon, time }) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={filters.departureTime[key]}
                    onChange={() => handleTimeFilter(key)}
                    icon={icon}
                    checkedIcon={icon}
                  />
                }
                label={`${label} (${time})`}
              />
            ))}
          </FormGroup>
        </Box>

        <Divider />

        {/* Airlines */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Airlines</Typography>
          <FormGroup>
            {airlines.map((airline) => (
              <FormControlLabel
                key={airline.code}
                control={
                  <Checkbox
                    checked={filters.airlines.includes(airline.name)}
                    onChange={() => handleAirlineFilter(airline)}
                  />
                }
                label={`${airline.name} (${airline.count})`}
              />
            ))}
          </FormGroup>
        </Box>

        <Divider />

        {/* Fare Types */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Fare Types</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {fareTypes.map((fare) => (
              <Chip
                key={fare.code}
                label={`${fare.name} (${fare.count})`}
                onClick={() => handleFareTypeFilter(fare)}
                color={filters.fareTypes.includes(fare.name) ? 'primary' : 'default'}
                variant={filters.fareTypes.includes(fare.name) ? 'filled' : 'outlined'}
                sx={{
                  '&.MuiChip-filled': {
                    backgroundColor: fare.colorCode,
                    color: '#fff'
                  }
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Actions */}
        <Box className="flex justify-between mt-4">
          <Button 
            variant="outlined" 
            onClick={() => {
              setFilters({
                priceRange: [priceRange.min, priceRange.max],
                airlines: [],
                stops: null,
                fareTypes: [],
                departureTime: {
                  early: false,
                  morning: false,
                  afternoon: false,
                  night: false
                }
              });
            }}
          >
            Reset All
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setDrawerOpen(false)}
          >
            Apply
            </Button>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Box className="flight-filter-container mb-6">
      <Stack 
        direction="row" 
        spacing={2} 
        alignItems="center" 
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
      >
        {/* Filter Button & Active Filters */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button
            startIcon={<FilterList />}
            variant="outlined"
            onClick={() => setDrawerOpen(true)}
            color="primary"
          >
            Filters
          </Button>

          {/* Active Filter Chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {filters.stops !== null && (
              <Chip
                label={`${filters.stops === 0 ? 'Non-stop' : `${filters.stops} Stop${filters.stops > 1 ? 's' : ''}`}`}
                onDelete={() => handleStopsFilter(null)}
                color="primary"
                size="small"
              />
            )}

            {filters.airlines.map(airline => (
              <Chip
                key={airline}
                label={airline}
                onDelete={() => handleAirlineFilter({ name: airline })}
                color="primary"
                size="small"
              />
            ))}

            {filters.fareTypes.map(fare => (
              <Chip
                key={fare}
                label={fare}
                onDelete={() => handleFareTypeFilter({ name: fare })}
                color="primary"
                size="small"
              />
            ))}

            {Object.entries(filters.departureTime)
              .filter(([_, isActive]) => isActive)
              .map(([key]) => (
                <Chip
                  key={key}
                  label={timeFilters.find(t => t.key === key)?.label}
                  onDelete={() => handleTimeFilter(key)}
                  color="primary"
                  size="small"
                />
              ))}
          </Stack>
        </Stack>

        {/* Sort Controls */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            startIcon={<Sort />}
            onClick={(e) => setSortAnchorEl(e.currentTarget)}
            variant="outlined"
            color="primary"
          >
            {sortOptions.find(opt => opt.value === currentSort)?.label || 'Sort'}
          </Button>

          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => setSortAnchorEl(null)}
          >
            {sortOptions.map((option) => (
              <MenuItem
                key={option.value}
                onClick={() => {
                  setCurrentSort(option.value);
                  setSortAnchorEl(null);
                }}
                selected={currentSort === option.value}
              >
                {option.icon}
                <Typography sx={{ ml: 1 }}>{option.label}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Stack>

      {/* Filter Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            backgroundImage: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

// Flights Container Component
const FlightsContainer = ({ flights, onViewFlight, existingPrice }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [gridView, setGridView] = useState(!isMobile);

  return (
    <Box className="mb-4">
      {!isMobile && (
        <Box className="flex justify-end mb-4">
          <ToggleButtonGroup
            value={gridView}
            exclusive
            onChange={(_, value) => value !== null && setGridView(value)}
            size="small"
          >
            <ToggleButton value={true}>
              <GridView />
            </ToggleButton>
            <ToggleButton value={false}>
              <ViewAgenda />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <Stack 
        direction={gridView ? 'row' : 'column'} 
        flexWrap="wrap" 
        gap={3}
        sx={{
          justifyContent: gridView ? 'space-between' : 'flex-start'
        }}
      >
        {flights.map(flight => (
          <FlightCard
            key={flight.rI}
            flight={flight}
            onViewFlight={onViewFlight}
            existingPrice={existingPrice}
            gridView={gridView}
          />
        ))}
      </Stack>
    </Box>
  );
};

export { EnhancedFilterMenu, FlightCard, FlightsContainer };
