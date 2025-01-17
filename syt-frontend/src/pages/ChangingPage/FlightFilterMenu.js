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

  const handleSliderChange = (_, newValue) => {
    setSliderValue(newValue);
  };

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
  priceRange, 
  filters, 
  setFilters, 
  currentSort, 
  setCurrentSort,
  anchorEl,
  onClose,
}) => {
  const [currentTab, setCurrentTab] = useState('sort');

  // Helper function to handle filter changes
  const handleFilterChange = (type, value) => {
    if (type === 'reset') {
      // Reset to full range
      setFilters({
        priceRange: [priceRange.min, priceRange.max],
        airlines: [],
        stops: null
      });
      onClose();
      return;
    }

    // For specific filter types
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

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
        onSort={handleSort}
        onFilter={handleFilterChange}
        currentSort={currentSort}
        filters={filters}
        priceRange={priceRange}
      />
    </Menu>
  );
});

export default FlightFilterMenu;