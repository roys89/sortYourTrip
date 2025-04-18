import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DateRangeIcon from '@mui/icons-material/DateRange';
import HotelIcon from '@mui/icons-material/Hotel';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { fetchItinerary } from "../../redux/slices/itinerarySlice";
import HotelDetailModal from "./HotelDetailModal";
import FilterMenu from "./HotelFilter"; // Import the FilterMenu component

// HotelCard Component - Updated with exact positioning
const HotelCard = React.memo(({ hotel, onViewHotel, dates, index }) => {
  const theme = useTheme();
  const location = useLocation();
  const existingHotelPrice = location.state?.existingHotelPrice || 0;
  
  // Handle image URL
  const imageUrl =
    hotel.images?.[0]?.links?.find((link) => link.size === "Standard")?.url ||
    hotel.heroImage ||
    "/api/placeholder/400/300";

  // Parse star rating and review count
  const starRating = parseFloat(hotel.starRating || hotel.category || "0").toFixed(1);
  const reviewCount = hotel.reviews?.[0]?.count || "(0)";
  
  // Handle prices
  const lowestRate = hotel.availability?.rate || {};
  const currentPrice = lowestRate.finalRate || 0;
  const currency = lowestRate.rate?.currency || "₹";
  
  // Calculate price difference
  const priceDifference = currentPrice - existingHotelPrice;
  const priceStatus = priceDifference === 0 ? "same" : priceDifference > 0 ? "increased" : "decreased";
  
  // Check if free cancellation is available
  const hasFreeCancel = index % 2 === 0; // For demo purposes

  // Hotel features to display
  const features = ['Free WiFi', 'Breakfast', 'Pool'];

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
      onClick={() => onViewHotel(hotel)}
    >
      {/* Image Section - Taller height with drop shadow */}
      <Box 
        sx={{ 
          position: "relative", 
          height: 220, // Increased height
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.15)", // Drop shadow only on image
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0px 8px 20px rgba(0,0,0,0.2)", // Enhanced shadow on hover
          },
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={hotel.name || "Hotel"}
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
        
        {/* Free Cancellation Tag */}
        {hasFreeCancel && (
          <Chip
            label="Free cancellation"
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              height: 24,
              backgroundColor: "white",
              color: "text.primary",
              fontSize: "0.7rem",
              fontWeight: 500,
              boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
              "& .MuiChip-label": {
                px: 1,
              },
            }}
          />
        )}
        
        {/* NEW Tag */}
        {index === 3 && (
          <Chip
            label="NEW"
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              height: 24,
              backgroundColor: "#e91e63",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: 600,
              boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
              "& .MuiChip-label": {
                px: 1,
              },
            }}
          />
        )}
      </Box>
      
      {/* Content Section - No background */}
      <Box sx={{ p: 1.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* City name and Rating in same row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          {/* City on left */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ fontSize: "0.75rem" }}
          >
            {hotel.contact?.address?.city?.name || ""}
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
                backgroundColor: starRating >= 4.5 ? "#e91e63" : "#f06292",
                color: "white",
                fontWeight: 700,
                fontSize: "0.8rem",
                mr: 0.5,
              }}
            >
              {starRating}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {reviewCount}
            </Typography>
          </Box>
        </Box>
        
        {/* Hotel Name */}
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
          {hotel.name || "Hotel Name"}
        </Typography>
        
        {/* Features/Amenities */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
          {features.map((feature, i) => (
            <Chip
              key={i}
              label={feature}
              size="small"
              sx={{
                height: 22,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.text.primary,
                fontWeight: 500,
                fontSize: "0.7rem",
                borderRadius: "12px"
              }}
            />
          ))}
        </Box>
        
        {/* Price Comparison - At the bottom, without "from" label */}
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
                    +{currency} {Math.abs(priceDifference).toLocaleString()}
                  </Typography>
                </>
              ) : (
                <>
                  <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" sx={{ color: "inherit", fontWeight: 600 }}>
                    -{currency} {Math.abs(priceDifference).toLocaleString()}
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
});

// Main HotelsPage Component
const HotelsPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { itineraryToken } = useSelector((state) => state.itinerary);

  // States for hotels
  const [allHotels, setAllHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [displayedHotels, setDisplayedHotels] = useState([]);
  const [dates, setDates] = useState({
    checkIn: "",
    checkOut: "",
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [datesLoading, setDatesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalHotels, setTotalHotels] = useState(0);
  const [traceId, setTraceId] = useState(null);
  
  // Modal and replacement states
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    price: [0, 1000000],
    rating: 0,
  });
  const [currentSort, setCurrentSort] = useState("priceAsc");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });

  const { city, inquiryToken, oldHotelCode } = location.state || {};
  const checkIn = location.state?.checkIn;
  const checkOut = location.state?.checkOut;

  const fetchHotels = useCallback(
    async (pageNum) => {
      try {
        setLoading(true);
        console.log(
          "Fetching page:",
          pageNum,
          "with dates:",
          checkIn,
          checkOut
        );

        const response = await fetch(
          `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${city}/${checkIn}/${checkOut}?page=${pageNum}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              "X-Inquiry-Token": inquiryToken,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch hotels");
        }

        const responseData = await response.json();

        // Capture traceId from the response
        if (responseData.data.traceId) {
          setTraceId(responseData.data.traceId);
        }

        // Defensive checks for the exact response structure
        const hotels = responseData?.data?.hotels || [];
        const pagination = responseData?.data?.pagination || {};

        setAllHotels((prevHotels) => {
          if (pageNum === 1) return hotels;
          return [...prevHotels, ...hotels];
        });

        setHasMore(pagination.hasMore || false);
        setTotalHotels(pagination.total || 0);

        // Set dates from response
        if (responseData?.data?.dates) {
          setDates(responseData.data.dates);
          setDatesLoading(false);
        }

        // Set price range only on initial load
        if (pageNum === 1 && hotels.length > 0) {
          const allPrices = hotels
            .flatMap((hotel) => hotel.rates?.map((rate) => rate.price) || [])
            .filter(Boolean);

          if (allPrices.length > 0) {
            const minPrice = Math.min(...allPrices);
            const maxPrice = Math.max(...allPrices);
            setPriceRange({ min: minPrice, max: maxPrice });
            setFilters((prev) => ({
              ...prev,
              price: [minPrice, maxPrice],
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        if (pageNum === 1) setInitialLoading(false);
      }
    },
    [inquiryToken, city, checkIn, checkOut]
  );

  // Modify the onViewHotel handler
  const handleViewHotel = (hotel) => {
    setSelectedHotel({
      ...hotel,
      traceId, // Add the captured traceId
      cityName: city,
      checkIn,
    });
  };

  // Apply filters and sorting
  useEffect(() => {
    // Start with all hotels
    let filtered = [...allHotels];
    console.log("Initial hotels for filtering:", filtered.length);

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (hotel) =>
          hotel.name?.toLowerCase().includes(searchTerm) ||
          hotel.address?.toLowerCase().includes(searchTerm)
      );
      console.log("After search filter:", filtered.length);
    }

    // Apply price filter
    filtered = filtered.filter((hotel) => {
      const lowestRate =
        hotel.rates?.reduce(
          (min, rate) => (rate.price < min.price ? rate : min),
          hotel.rates[0]
        )?.price || 0;
      return lowestRate >= filters.price[0] && lowestRate <= filters.price[1];
    });

    // Apply rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(
        (hotel) =>
          parseInt(hotel.category?.toString() || "0", 10) >= filters.rating
      );
    }

    setFilteredHotels(filtered);

    // Apply sorting
    let sorted = [...filtered];
    sorted.sort((a, b) => {
      const aPrice =
        a.rates?.reduce(
          (min, rate) => (rate.price < min.price ? rate : min),
          a.rates[0]
        )?.price || 0;
      const bPrice =
        b.rates?.reduce(
          (min, rate) => (rate.price < min.price ? rate : min),
          b.rates[0]
        )?.price || 0;

      switch (currentSort) {
        case "priceAsc":
          return aPrice - bPrice;
        case "priceDesc":
          return bPrice - aPrice;
        case "ratingDesc":
          return (
            parseInt(b.category?.toString() || "0", 10) -
            parseInt(a.category?.toString() || "0", 10)
          );
        case "nameAsc":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return 0;
      }
    });

    setDisplayedHotels(sorted);
  }, [allHotels, filters, currentSort]);

  // Initial load
  useEffect(() => {
    if (!inquiryToken || !city || !checkIn || !checkOut) {
      navigate("/itinerary");
      return;
    }

    // Validate date formats
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      setError("Invalid date format");
      return;
    }

    setPage(1);
    fetchHotels(1);
  }, [inquiryToken, city, checkIn, checkOut, navigate, fetchHotels]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      console.log("Loading more hotels, next page:", page + 1);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHotels(nextPage);
    }
  }, [loading, hasMore, page, fetchHotels]);

  const handleFilter = (type, value) => {
    if (type === "reset") {
      setFilters({
        search: "",
        price: [priceRange.min, priceRange.max],
        rating: 0,
      });
    } else {
      setFilters((prev) => ({
        ...prev,
        [type]: value,
      }));
    }
  };

  const handleSort = (value) => {
    setCurrentSort(value);
  };

  const handleBackToItinerary = () => {
    // Navigate back using URL parameters
    if (itineraryToken && inquiryToken) {
      const params = new URLSearchParams({
        itineraryToken,
        inquiryToken
      });
      navigate(`/itinerary?${params.toString()}`, { 
        state: { origin: 'hotels' }
      });
    } else {
      console.warn("Missing itineraryToken or inquiryToken for back navigation. Navigating to home.");
      navigate('/'); // Fallback navigation
    }
  };

  const handleAddHotel = async (hotel) => {
    try {
      setIsReplacing(true);
      setError(null);

      const recheckResponse = await fetch(
        `http://localhost:5000/api/itinerary/hotel-recheck/${hotel.hotel_code}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json",
            "X-Inquiry-Token": inquiryToken || "",
          },
          body: JSON.stringify({
            searchId: hotel.search_id,
            checkIn: dates.checkIn,
            groupCode: hotel.selectedRate.group_code,
            rateKey: hotel.selectedRate.rate_key,
            cityName: city,
          }),
        }
      );

      if (!recheckResponse.ok) {
        const errorData = await recheckResponse.json();
        throw new Error(errorData.message || "Failed to recheck hotel rate");
      }

      const recheckData = await recheckResponse.json();
      const recheckRate = recheckData.hotel?.rate;
      const originalRate = hotel.selectedRate;

      const existingPrice = location.state?.existingHotelPrice || 0;
      const isRateChanged =
        !!recheckRate && recheckRate.price !== originalRate.price;
      const recheckPriceDifference = !!recheckRate
        ? recheckRate.price - originalRate.price
        : 0;
      const itineraryPriceDifference =
        (recheckRate?.price || originalRate.price) - existingPrice;

      const newHotelDetails = {
        hotelCode: hotel.hotel_code,
        name: hotel.name,
        address: hotel.address,
        category: hotel.category,
        description: hotel.description,
        images: [
          {
            url: hotel.images?.url || null,
            variants: [
              {
                url: hotel.images?.url || null,
              },
            ],
          },
        ],
        rate: {
          ...recheckRate,
          rooms: hotel.selectedRate.rooms,
          boarding_details: hotel.selectedRate.boarding_details,
          cancellation_policy: hotel.selectedRate.cancellation_policy,
        },
        rate_status:
          recheckRate?.rate_type === "bookable" ? "BOOKABLE" : "NOT_BOOKABLE",
        is_rate_changed: isRateChanged,
        recheck_price_difference: recheckPriceDifference,
        price_difference: itineraryPriceDifference,
        search_id: hotel.search_id,
        hotel_details: {
          geolocation: hotel.geolocation,
          facilities: hotel.facilities?.split(";").map((f) => f.trim()) || [],
          category: hotel.category?.toString(),
        },
      };

      const response = await fetch(
        `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json",
            "X-Inquiry-Token": inquiryToken,
          },
          body: JSON.stringify({
            cityName: city,
            date: checkIn,
            oldHotelCode,
            newHotelDetails,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to replace hotel");
      }

      await dispatch(
        fetchItinerary({
          itineraryToken,
          inquiryToken,
        })
      ).unwrap();

      navigate("/itinerary", {
        state: {
          itineraryInquiryToken: inquiryToken,
        },
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsReplacing(false);
    }
  };

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
        <LoadingSpinner message="Finding the perfect hotels for your stay..." />
      </Box>
    );
  }

  if (error) {
    const params = new URLSearchParams({
      itineraryToken,
      inquiryToken,
      error: error.message || 'Failed to load hotels'
    });
    navigate(`/itinerary?${params.toString()}`, {
      state: { origin: 'hotels' }
    });
    return;
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        pt: { xs: 6, md: 8 }, // Maintain some top padding
        pb: 6,
        px: { xs: 2, md: 4 } 
      }}
    >
      {/* Header with Background - Your Top Bar */}
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
          {/* Header with gradient background - Reduced padding */}
          <Box 
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 1.5, // Reduced vertical padding
              px: 2.5, // Reduced horizontal padding
              backgroundColor: theme.palette.mode === "dark" 
                ? alpha(theme.palette.primary.main, 0.1)
                : "rgba(251, 203, 173, 0.2)",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36, // Smaller icon box
                  height: 36, // Smaller icon box
                  borderRadius: "10px",
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <HotelIcon fontSize="small" color="primary" />
              </Box>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: "Montserrat", 
                    fontWeight: 600, 
                    color: theme.palette.text.primary,
                    fontSize: "1.125rem", // Smaller font
                    lineHeight: 1.2,
                  }}
                >
                  Hotels in {city}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: alpha(theme.palette.text.primary, 0.7),
                    fontSize: "0.75rem", // Smaller font
                  }}
                >
                  Choose from {totalHotels} available accommodations
                </Typography>
              </Box>
            </Box>
            
            {/* Filter and Sort Buttons in Header - REPLACED with FilterMenu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Integrated FilterMenu component */}
              <FilterMenu 
                onSort={handleSort}
                onFilter={handleFilter}
                currentSort={currentSort}
                filters={filters}
                priceRange={priceRange}
              />
              
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

          {/* Content with stays dates - Reduced padding */}
          <Box sx={{ py: 1.5, px: 2.5, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
            <Stack 
              direction={{ xs: "column", md: "row" }} 
              spacing={2} 
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              {datesLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading stay dates...
                </Typography>
              ) : dates.checkIn && dates.checkOut ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  backgroundColor: theme.palette.mode === "dark" 
                    ? alpha(theme.palette.primary.main, 0.08)
                    : "rgba(251, 203, 173, 0.3)",
                  borderRadius: '30px',
                  py: 0.5, // Reduced padding
                  px: 1.5, // Reduced padding 
                }}>
                  <DateRangeIcon fontSize="small" color="primary" />
                  <Typography variant="caption" fontWeight={500}>
                    {dates.checkIn} to {dates.checkOut}
                  </Typography>
                </Box>
              ) : null}

              {totalHotels > 0 && (
                <Box sx={{ 
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  borderRadius: '30px',
                  py: 0.5, // Reduced padding
                  px: 1.5, // Reduced padding
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}>
                  <Typography variant="caption" color="text.secondary">
                    {displayedHotels.length} of {totalHotels} hotels
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      {/* Cards Grid - Wider to fit 5 in a row */}
      <Box sx={{ 
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)", 
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
          xl: "repeat(5, 1fr)"  // 5 cards per row on extra-large screens
        },
        gap: 2,
        mb: 4
      }}>
        {displayedHotels.map((hotel, index) => (
          <HotelCard
            key={`${hotel.hotel_code || index}-${hotel.search_id || ''}`}
            hotel={hotel}
            dates={dates}
            onViewHotel={handleViewHotel}
            index={index}
          />
        ))}
      </Box>

      {/* Load More Button with CircularProgress */}
      {hasMore && allHotels.length < totalHotels && (
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
                borderRadius: '10px',
                height: 48,
                minWidth: '240px',
                fontWeight: 500,
                textTransform: 'none',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: 'all 0.2s ease',
                backgroundColor: theme.palette.mode === 'dark' ? '#d32f2f' : '#e91e63', 
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#b71c1c' : '#c2185b',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  <span>Loading more hotels...</span>
                </Box>
              ) : (
                `View More Hotels`
              )}
            </Button>
          </Box>
        </motion.div>
      )}

      {selectedHotel && (
        <div className="hotel-modal">
          <HotelDetailModal
            hotel={selectedHotel}
            traceId={traceId}
            onClose={() => setSelectedHotel(null)}
            onAddHotel={handleAddHotel}
            isLoading={isReplacing}
            itineraryToken={itineraryToken}
            inquiryToken={inquiryToken}
            city={city}
            date={checkIn}
            dates={dates}
            existingHotelPrice={location.state?.existingHotelPrice}
          />
        </div>
      )}
    </Container>
  );
};

export default HotelsPage;