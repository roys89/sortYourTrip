import {
  AttachMoney,
  FilterList,
  QueryBuilder,
  SortByAlpha
} from '@mui/icons-material';
import {
  Button,
  Checkbox,
  Drawer,
  FormControlLabel,
  FormGroup,
  Menu,
  MenuItem,
  Slider,
  Typography
} from '@mui/material';
import React, { useState } from 'react';

const FlightFilterMenu = ({ 
  priceRange, 
  filters, 
  setFilters, 
  currentSort, 
  setCurrentSort 
}) => {
  // State for drawer and menus
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  // Sorting options
  const sortOptions = [
    { 
      value: 'priceAsc', 
      label: 'Price: Low to High', 
      icon: <AttachMoney /> 
    },
    { 
      value: 'priceDesc', 
      label: 'Price: High to Low', 
      icon: <AttachMoney /> 
    },
    { 
      value: 'durationAsc', 
      label: 'Duration: Shortest First', 
      icon: <QueryBuilder /> 
    }
  ];

  // Handle price range change
  const handlePriceChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      priceRange: newValue
    }));
  };

  // Handle airline filter
  const handleAirlineFilter = (airlineName) => {
    setFilters(prev => {
      const currentAirlines = prev.airlines;
      const newAirlines = currentAirlines.includes(airlineName)
        ? currentAirlines.filter(a => a !== airlineName)
        : [...currentAirlines, airlineName];
      
      return {
        ...prev,
        airlines: newAirlines
      };
    });
  };

  // Handle stops filter
  const handleStopsFilter = (stops) => {
    setFilters(prev => ({
      ...prev,
      stops: prev.stops === stops ? null : stops
    }));
  };

  // Render price filter
  const renderPriceFilter = () => (
    <div className="p-4">
      <Typography gutterBottom>Price Range</Typography>
      <Slider
        value={filters.priceRange}
        onChange={handlePriceChange}
        valueLabelDisplay="auto"
        min={priceRange.min}
        max={priceRange.max}
        valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
      />
      <div className="flex justify-between">
        <Typography variant="body2">
          Min: ₹{filters.priceRange[0].toLocaleString()}
        </Typography>
        <Typography variant="body2">
          Max: ₹{filters.priceRange[1].toLocaleString()}
        </Typography>
      </div>
    </div>
  );

  // Render airline filter
  const renderAirlineFilter = () => (
    <div className="p-4">
      <Typography gutterBottom>Airlines</Typography>
      <FormGroup>
        {[
          { name: 'Air India', code: 'AI' },
          { name: 'Indigo', code: '6E' },
          { name: 'Emirates', code: 'EK' },
          { name: 'Qatar Airways', code: 'QR' },
          // Add more airlines as needed
        ].map((airline) => (
          <FormControlLabel
            key={airline.code}
            control={
              <Checkbox
                checked={filters.airlines.includes(airline.name)}
                onChange={() => handleAirlineFilter(airline.name)}
              />
            }
            label={airline.name}
          />
        ))}
      </FormGroup>
    </div>
  );

  // Render stops filter
  const renderStopsFilter = () => (
    <div className="p-4">
      <Typography gutterBottom>Stops</Typography>
      <div className="flex space-x-2">
        {[0, 1, 2].map((stops) => (
          <Button
            key={stops}
            variant={filters.stops === stops ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleStopsFilter(stops)}
          >
            {stops === 0 ? 'Non-Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
          </Button>
        ))}
      </div>
    </div>
  );

  // Render sort menu
  const renderSortMenu = () => (
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
          <span className="ml-2">{option.label}</span>
        </MenuItem>
      ))}
    </Menu>
  );

  return (
    <div className="flight-filter-container mb-4">
      <div className="flex justify-between items-center">
        {/* Filter Button */}
        <Button
          startIcon={<FilterList />}
          variant="outlined"
          onClick={() => setDrawerOpen(true)}
        >
          Filters
        </Button>

        {/* Sort Button */}
        <Button
          startIcon={<SortByAlpha />}
          variant="outlined"
          onClick={(e) => setSortAnchorEl(e.currentTarget)}
        >
          Sort
        </Button>

        {renderSortMenu()}
      </div>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="w-80 p-4">
          <Typography variant="h6" className="mb-4">
            Filter Flights
          </Typography>

          {renderPriceFilter()}
          {renderAirlineFilter()}
          {renderStopsFilter()}

          <div className="mt-4 flex justify-between">
            <Button 
              variant="outlined" 
              onClick={() => {
                setFilters({
                  priceRange: [priceRange.min, priceRange.max],
                  airlines: [],
                  stops: null
                });
              }}
            >
              Reset Filters
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setDrawerOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default FlightFilterMenu;