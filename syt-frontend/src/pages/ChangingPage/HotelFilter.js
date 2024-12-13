import { FilterList, Search, Sort } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Menu, MenuItem,
  Rating,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField, Typography
} from '@mui/material';
import React, { useState } from 'react';

const MenuContent = ({ type, onSort, onFilter, currentSort, filters, priceRange }) => {
  const [sliderValue, setSliderValue] = useState(filters.price);
  const [ratingValue, setRatingValue] = useState(filters.rating);

  const handleSliderChange = (_, newValue) => {
    setSliderValue(newValue);
  };

  const handleSliderChangeCommitted = (_, newValue) => {
    onFilter('price', newValue);
  };

  const handleRatingChange = (_, newValue) => {
    setRatingValue(newValue);
    onFilter('rating', newValue);
  };

  if (type === 'sort') {
    return (
      <Box sx={{ p: 2, width: 280 }}>
        <Stack spacing={2}>
          {[
            { value: 'priceAsc', label: 'Price: Low to High' },
            { value: 'priceDesc', label: 'Price: High to Low' },
            { value: 'ratingDesc', label: 'Rating: High to Low' },
            { value: 'nameAsc', label: 'Name: A to Z' }
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
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Search Hotels</Typography>
          <TextField
            fullWidth
            size="small"
            value={filters.search}
            placeholder="Search by name..."
            onChange={(e) => onFilter('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
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
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Minimum Rating</Typography>
          <Rating
            value={ratingValue}
            onChange={handleRatingChange}
            precision={1}
            sx={{ color: 'primary.main' }}
          />
        </Box>

        <Button 
          variant="outlined"
          onClick={() => onFilter('reset')}
          fullWidth
          size="small"
        >
          Reset Filters
        </Button>
      </Stack>
    </Box>
  );
};

const FilterMenu = ({ onSort, onFilter, currentSort, filters, priceRange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTab, setCurrentTab] = useState('filter');

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
          <FilterList />
        </IconButton>
        <IconButton onClick={handleClickSort}>
          <Sort />
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
};

export default FilterMenu;