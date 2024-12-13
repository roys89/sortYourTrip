import { Alert, Box, Button, Card, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchItinerary } from '../../redux/slices/itinerarySlice';
import HotelDetailModal from './HotelDetailModal';
import FilterMenu from './HotelFilter';
import './Hotels.css';
// HotelCard Component
const HotelCard = React.memo(({ hotel, onViewHotel }) => {
  const imageUrl = hotel.images?.url || '/api/placeholder/400/300';
  const starCount = parseInt(hotel.category?.toString() || '0', 10);
  const lowestRate = hotel.rates?.reduce((min, rate) => 
    rate.price < min.price ? rate : min
  , hotel.rates[0]);
  
  const displayPrice = lowestRate ? 
    `${lowestRate.currency} ${lowestRate.price.toLocaleString()}` : 
    'Price on request';

  return (
    <Card className="hotel-card">
      <div className="flex flex-col md:flex-row">
        <div className="hotel-image-container">
          <img 
            src={imageUrl}
            alt={hotel.name || 'Hotel'}
            className="hotel-image"
            onError={(e) => { e.target.src = '/api/placeholder/400/300'; }}
          />
        </div>
        
        <div className="hotel-content">
          <div>
            <Typography variant="h6" className="mb-2">{hotel.name || 'Hotel Name'}</Typography>
            <div className="star-rating">
              {[...Array(starCount)].map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              {hotel.address || 'Address not available'}
            </Typography>
            {hotel.rates?.[0]?.boarding_details && (
              <Typography variant="body2" className="boarding-details">
                {hotel.rates[0].boarding_details.join(', ')}
              </Typography>
            )}
          </div>
          
          <div className="price-container">
            <Typography variant="caption" className="starting-price">Starting from</Typography>
            <Typography variant="h6" className="price-amount">
              {displayPrice}
            </Typography>
            <Typography variant="caption" className="boarding-details">
              {lowestRate?.boarding_details?.join(', ')}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => onViewHotel(hotel)}
            >
              View Hotel
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

// Main HotelsPage Component
const HotelsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { itineraryToken } = useSelector((state) => state.itinerary);
  
  // States for hotels
  const [allHotels, setAllHotels] = useState([]); // Raw hotels from API
  const [filteredHotels, setFilteredHotels] = useState([]); // Hotels after filters
  const [displayedHotels, setDisplayedHotels] = useState([]); // Hotels after sorting
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalHotels, setTotalHotels] = useState(0);

  // Modal and replacement states
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    price: [0, 1000000],
    rating: 0
  });
  const [currentSort, setCurrentSort] = useState('priceAsc');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });

  const { city, date, inquiryToken, oldHotelCode } = location.state || {};

  const handleBackToItinerary = () => {
    navigate('/itinerary', {
      state: { itineraryInquiryToken: inquiryToken }
    });
  };

  const fetchHotels = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      console.log('Fetching page:', pageNum);

      const response = await fetch(
        `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${city}/${date}?page=${pageNum}`,
        {
          headers: {
            'X-Inquiry-Token': inquiryToken
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }

      const data = await response.json();
      if (data?.data?.hotels && Array.isArray(data.data.hotels)) {
        const newHotels = data.data.hotels;
        console.log('New hotels received:', newHotels.length);
        
        setAllHotels(prevHotels => {
          if (pageNum === 1) return newHotels;
          const combinedHotels = [...prevHotels, ...newHotels];
          console.log('Combined total hotels:', combinedHotels.length);
          return combinedHotels;
        });

        setHasMore(data.data.hasMore);
        setTotalHotels(data.data.total);

        // Set price range only on initial load
        if (pageNum === 1) {
          const allPrices = data.data.hotels.flatMap(hotel => 
            hotel.rates?.map(rate => rate.price) || []
          ).filter(Boolean);
          
          if (allPrices.length > 0) {
            const minPrice = Math.min(...allPrices);
            const maxPrice = Math.max(...allPrices);
            setPriceRange({ min: minPrice, max: maxPrice });
            setFilters(prev => ({
              ...prev,
              price: [minPrice, maxPrice]
            }));
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (pageNum === 1) setInitialLoading(false);
    }
  }, [inquiryToken, city, date]);

  // Apply filters and sorting
  useEffect(() => {
    console.log('Running filter effect, all hotels:', allHotels.length);
    
    // Start with all hotels
    let filtered = [...allHotels];
    console.log('Initial hotels for filtering:', filtered.length);

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(hotel => 
        hotel.name?.toLowerCase().includes(searchTerm) ||
        hotel.address?.toLowerCase().includes(searchTerm)
      );
      console.log('After search filter:', filtered.length);
    }

    // Apply price filter
    filtered = filtered.filter(hotel => {
      const lowestRate = hotel.rates?.reduce((min, rate) => 
        rate.price < min.price ? rate : min
      , hotel.rates[0])?.price || 0;
      return lowestRate >= filters.price[0] && lowestRate <= filters.price[1];
    });
    console.log('After price filter:', filtered.length);

    // Apply rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(hotel => 
        parseInt(hotel.category?.toString() || '0', 10) >= filters.rating
      );
      console.log('After rating filter:', filtered.length);
    }

    setFilteredHotels(filtered);

    // Apply sorting
    let sorted = [...filtered];
    sorted.sort((a, b) => {
      const aPrice = a.rates?.reduce((min, rate) => 
        rate.price < min.price ? rate : min
      , a.rates[0])?.price || 0;
      const bPrice = b.rates?.reduce((min, rate) => 
        rate.price < min.price ? rate : min
      , b.rates[0])?.price || 0;
      
      switch (currentSort) {
        case 'priceAsc':
          return aPrice - bPrice;
        case 'priceDesc':
          return bPrice - aPrice;
        case 'ratingDesc':
          return (parseInt(b.category?.toString() || '0', 10)) - 
                 (parseInt(a.category?.toString() || '0', 10));
        case 'nameAsc':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    console.log('After sorting:', sorted.length);
    setDisplayedHotels(sorted);
  }, [allHotels, filters, currentSort]);

  // Initial load
  useEffect(() => {
    if (!inquiryToken || !city || !date) {
      navigate('/itinerary');
      return;
    }
    setPage(1);
    fetchHotels(1);
  }, [inquiryToken, city, date, navigate, fetchHotels]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      console.log('Loading more hotels, next page:', page + 1);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHotels(nextPage);
    }
  }, [loading, hasMore, page, fetchHotels]);

  const handleFilter = (type, value) => {
    if (type === 'reset') {
      setFilters({
        search: '',
        price: [priceRange.min, priceRange.max],
        rating: 0
      });
    } else {
      setFilters(prev => ({
        ...prev,
        [type]: value
      }));
    }
  };

  const handleSort = (value) => {
    setCurrentSort(value);
  };

  const handleAddHotel = async (hotel) => {
    try {
      setIsReplacing(true);
      setError(null);
  
      const recheckResponse = await fetch(
        `http://localhost:5000/api/itinerary/hotel-recheck/${hotel.hotel_code}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken || '',
          },
          body: JSON.stringify({
            searchId: hotel.search_id,
            checkIn: date,
            groupCode: hotel.selectedRate.group_code,
            rateKey: hotel.selectedRate.rate_key,
            cityName: city
          })
        }
      );
  
      if (!recheckResponse.ok) {
        const errorData = await recheckResponse.json();
        throw new Error(errorData.message || 'Failed to recheck hotel rate');
      }
  
      const recheckData = await recheckResponse.json();
      const recheckRate = recheckData.hotel?.rate;
      const originalRate = hotel.selectedRate;
  
      const existingPrice = location.state?.existingHotelPrice || 0;
      const isRateChanged = !!recheckRate && recheckRate.price !== originalRate.price;
      const recheckPriceDifference = !!recheckRate ? recheckRate.price - originalRate.price : 0;
      const itineraryPriceDifference = (recheckRate?.price || originalRate.price) - existingPrice;
  
      const newHotelDetails = {
        hotelCode: hotel.hotel_code,
        name: hotel.name,
        address: hotel.address,
        category: hotel.category,
        description: hotel.description,
        images: [{
          url: hotel.images?.url || null,
          variants: [{
            url: hotel.images?.url || null
          }]
        }],
        rate: {
          ...recheckRate,
          rooms: hotel.selectedRate.rooms,
          boarding_details: hotel.selectedRate.boarding_details,
          cancellation_policy: hotel.selectedRate.cancellation_policy,
        },
        rate_status: recheckRate?.rate_type === 'bookable' ? 'BOOKABLE' : 'NOT_BOOKABLE',
        is_rate_changed: isRateChanged,
        recheck_price_difference: recheckPriceDifference,
        price_difference: itineraryPriceDifference,
        search_id: hotel.search_id,
        hotel_details: {
          geolocation: hotel.geolocation,
          facilities: hotel.facilities?.split(';').map(f => f.trim()) || [],
          category: hotel.category?.toString(),
        }
      };
  
      const response = await fetch(
        `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify({
            cityName: city,
            date,
            oldHotelCode,
            newHotelDetails
          })
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to replace hotel');
      }
  
      await dispatch(fetchItinerary({
        itineraryToken,
        inquiryToken
      })).unwrap();
  
      navigate('/itinerary', {
        state: { 
          itineraryInquiryToken: inquiryToken
        }
      });
  
    } catch (error) {
      setError(error.message);
    } finally {
      setIsReplacing(false);
    }
  };

  if (initialLoading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container className="error-container">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="contained"
          onClick={handleBackToItinerary}
        >
          Return to Itinerary
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="hotels-page">
      <div className="hotels-header">
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleBackToItinerary}
            className="back-button"
          >
            Back to Itinerary
          </Button>
          
          <Typography variant="h4" component="h1">
            Available Hotels in {city}
          </Typography>

          <div className="filter-menu-container">
            <FilterMenu
              onSort={handleSort}
              onFilter={handleFilter}
              currentSort={currentSort}
              filters={filters}
              priceRange={priceRange}
            />
          </div>

          {totalHotels > 0 && (
            <Typography variant="body2" color="text.secondary">
              Showing {displayedHotels.length} of {totalHotels} hotels
            </Typography>
          )}
        </Stack>
      </div>

      <div className="hotels-grid">
        {displayedHotels.map((hotel) => (
          <HotelCard
            key={`${hotel.hotel_code}-${hotel.search_id}`}
            hotel={hotel}
            onViewHotel={(hotel) => setSelectedHotel(hotel)}
          />
        ))}
      </div>

      {hasMore && allHotels.length < totalHotels && !loading && (
        <div className="text-center">
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loading}
            className="load-more-button"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <CircularProgress size={20} />
                <span>Loading hotels... ({allHotels.length} of {totalHotels})</span>
              </div>
            ) : (
              `Load More Hotels (${allHotels.length} of ${totalHotels})`
            )}
          </Button>
        </div>
      )}

      {displayedHotels.length === 0 && !loading && (
        <div className="no-results">
          <Typography variant="h6">
            No hotels found matching your criteria
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => handleFilter('reset')}
            className="mt-4"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {selectedHotel && (
        <div className="hotel-modal">
          <HotelDetailModal
            hotel={selectedHotel}
            onClose={() => setSelectedHotel(null)}
            onAddHotel={handleAddHotel}
            isLoading={isReplacing}
            itineraryToken={itineraryToken}
            inquiryToken={inquiryToken}
            city={city}
            date={date}
            existingHotelPrice={location.state?.existingHotelPrice} 
          />
        </div>
      )}
    </Container>
  );
};

export default HotelsPage;