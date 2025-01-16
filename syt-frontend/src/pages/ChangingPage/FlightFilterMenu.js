import {
  AttachMoney,
  QueryBuilder
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Menu,
  MenuItem,
  Slider,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const MenuContent = React.memo(({ type, onSort, onFilter, currentSort, filters, priceRange }) => {
  const [sliderValue, setSliderValue] = useState(filters.priceRange);

  // Handle slider change with local state
  const handleSliderChange = (_, newValue) => {
    setSliderValue(newValue);
  };

  // Only update parent state when sliding is complete
  const handleSliderChangeCommitted = (_, newValue) => {
    onFilter('priceRange', newValue);
  };

  useEffect(() => {
    setSliderValue(filters.priceRange);
  }, [filters.priceRange]);

  if (type === 'sort') {
    return (
      <Box sx={{ p: 2, width: 280 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Sort Flights By</Typography>
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
            sx={{ height: 40 }}
          >
            {option.icon}
            <span className="ml-2">{option.label}</span>
          </MenuItem>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, width: 280 }}>
      <Stack spacing={3}>
        {/* Airline Filter */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Airlines</Typography>
          <FormGroup>
            {[
              { name: 'Air India', code: 'AI' },
              { name: 'Indigo', code: '6E' },
              { name: 'Emirates', code: 'EK' },
              { name: 'Qatar Airways', code: 'QR' }
            ].map((airline) => (
              <FormControlLabel
                key={airline.code}
                control={
                  <Checkbox
                    checked={filters.airlines.includes(airline.name)}
                    onChange={() => {
                      const currentAirlines = filters.airlines;
                      const newAirlines = currentAirlines.includes(airline.name)
                        ? currentAirlines.filter(a => a !== airline.name)
                        : [...currentAirlines, airline.name];
                      
                      onFilter('airlines', newAirlines);
                    }}
                  />
                }
                label={airline.name}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Stops Filter */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Stops</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {[0, 1, 2].map((stops) => (
              <Button
                key={stops}
                variant={filters.stops === stops ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                onClick={() => onFilter('stops', filters.stops === stops ? null : stops)}
              >
                {stops === 0 ? 'Non-Stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Price Range */}
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
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
            disableSwap
          />
        </Box>

        {/* Reset Button */}
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

const FlightFilterMenu = React.memo(({ 
  onSort, 
  onFilter, 
  currentSort, 
  filters, 
  priceRange 
}) => {
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

  // Helper function to handle filter changes
  const handleFilterChange = (type, value) => {
    if (type === 'reset') {
      // Reset to full range
      onFilter({
        priceRange: [priceRange.min, priceRange.max],
        airlines: [],
        stops: null
      });
      return;
    }

    // For specific filter types
    onFilter(type, value);
  };

  return (
    <Box>
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
          onSort={(value) => { 
            onSort(value); 
            handleClose(); 
          }}
          onFilter={(type, value) => { 
            handleFilterChange(type, value); 
            if (type === 'reset') handleClose(); 
          }}
          currentSort={currentSort}
          filters={filters}
          priceRange={priceRange}
        />
      </Menu>
    </Box>
  );
});

export default FlightFilterMenu;