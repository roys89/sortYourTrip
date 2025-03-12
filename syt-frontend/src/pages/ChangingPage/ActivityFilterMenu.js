import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import {
    alpha,
    Box,
    Button,
    Divider,
    FormControl,
    FormControlLabel,
    InputAdornment,
    Paper,
    Radio,
    RadioGroup,
    Slider,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';

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
    { value: 'ratingDesc', label: 'Rating: High to Low' },
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

export default ActivityFilterMenu;