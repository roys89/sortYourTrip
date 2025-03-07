import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Fade,
  Grow,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme
} from "@mui/material";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  DollarSign,
  Hotel,
  Info,
  Minus,
  Plane,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X
} from "lucide-react";
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  searchReplacementFlight,
  updateItineraryFlight,
} from '../../redux/slices/flightReplacementSlice';
import {
  searchReplacementHotel,
  updateItineraryHotel,
} from '../../redux/slices/hotelReplacementSlice';
import {
  recheckFlightPrices,
  recheckHotelPrices,
  resetPriceCheck,
  selectFlightProgress,
  selectHotelProgress,
  updatePriceSummary
} from '../../redux/slices/priceCheckSlice';
import { getPriceCheckSummary } from '../../utils/priceCalculations';

// FlightProgressRow component
const FlightProgressRow = ({ flight, isChecking, result, error }) => {
  const theme = useTheme();
  
  return (
    <Fade in timeout={300}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "10px",
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.03)}`,
            borderColor: alpha(theme.palette.primary.main, 0.15),
          }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Plane 
            size={18} 
            style={{ 
              color: isChecking ? alpha(theme.palette.primary.main, 0.7) : theme.palette.primary.main,
              opacity: isChecking ? 0.7 : 1,
              animation: isChecking ? "pulse 1.5s infinite ease-in-out" : "none"
            }} 
          />
          <Typography sx={{ fontWeight: 500 }}>
            {flight.origin} → {flight.destination}
          </Typography>
        </Box>

        {isChecking ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Checking...
            </Typography>
            <CircularProgress size={16} thickness={4} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              label={error.response?.data?.error?.errorCode === 6 
                ? "Flight unavailable" 
                : "Price check failed"}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontSize: "0.75rem", height: 24 }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
              This flight needs replacement
            </Typography>
          </Box>
        ) : result && (
          <Box sx={{ display: "flex", alignItems: "center", ml: 'auto' }}>
            {result.priceChanged ? (
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5,
                p: "4px 12px",
                borderRadius: "16px",
                backgroundColor: result.difference > 0 
                  ? alpha(theme.palette.error.light, 0.1) 
                  : alpha(theme.palette.success.light, 0.1),
                border: `1px solid ${result.difference > 0 
                  ? alpha(theme.palette.error.main, 0.2)
                  : alpha(theme.palette.success.main, 0.2)}`
              }}>
                {result.difference > 0 
                  ? <TrendingUp size={14} style={{ color: theme.palette.error.main }} />
                  : <TrendingDown size={14} style={{ color: theme.palette.success.main }} />
                }
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: result.difference > 0 
                      ? theme.palette.error.main 
                      : theme.palette.success.main
                  }}
                >
                  ₹{result.newPrice.toLocaleString()}
                  <Typography 
                    component="span" 
                    variant="caption" 
                    sx={{ 
                      ml: 0.5,
                      fontWeight: 500
                    }}
                  >
                    ({result.difference > 0 ? '+' : ''}{result.percentageChange.toFixed(1)}%)
                  </Typography>
                </Typography>
              </Box>
            ) : (
              <Chip 
                label="No change" 
                size="small" 
                color="default" 
                variant="outlined" 
                sx={{ 
                  fontSize: "0.75rem",
                  height: 24,
                  backgroundColor: alpha(theme.palette.text.disabled, 0.05)
                }} 
              />
            )}
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

// HotelProgressRow component
const HotelProgressRow = ({ hotel, isChecking, result, error }) => {
  const theme = useTheme();
  
  return (
    <Fade in timeout={300}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "10px",
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.03)}`,
            borderColor: alpha(theme.palette.primary.main, 0.15),
          }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Hotel 
            size={18} 
            style={{ 
              color: isChecking ? alpha(theme.palette.primary.main, 0.7) : theme.palette.primary.main,
              opacity: isChecking ? 0.7 : 1,
              animation: isChecking ? "pulse 1.5s infinite ease-in-out" : "none"
            }} 
          />
          <Box>
            <Typography sx={{ fontWeight: 500 }}>
              {hotel.name}
            </Typography>
            {hotel.roomType && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  display: "block",
                  mt: 0.3
                }}
              >
                {hotel.roomType}
              </Typography>
            )}
          </Box>
        </Box>

        {isChecking ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Checking...
            </Typography>
            <CircularProgress size={16} thickness={4} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              label={error.response?.data?.error?.code === 'HOTEL_NOT_AVAILABLE' 
                ? "Hotel unavailable" 
                : "Price check failed"}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontSize: "0.75rem", height: 24 }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
              This hotel needs replacement
            </Typography>
          </Box>
        ) : result && (
          <Box sx={{ display: "flex", alignItems: "center", ml: 'auto' }}>
            {result.priceChanged ? (
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5,
                p: "4px 12px",
                borderRadius: "16px",
                backgroundColor: result.difference > 0 
                  ? alpha(theme.palette.error.light, 0.1) 
                  : alpha(theme.palette.success.light, 0.1),
                border: `1px solid ${result.difference > 0 
                  ? alpha(theme.palette.error.main, 0.2)
                  : alpha(theme.palette.success.main, 0.2)}`
              }}>
                {result.difference > 0 
                  ? <TrendingUp size={14} style={{ color: theme.palette.error.main }} />
                  : <TrendingDown size={14} style={{ color: theme.palette.success.main }} />
                }
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: result.difference > 0 
                      ? theme.palette.error.main 
                      : theme.palette.success.main
                  }}
                >
                  ₹{result.newPrice.toLocaleString()}
                  <Typography 
                    component="span" 
                    variant="caption" 
                    sx={{ 
                      ml: 0.5,
                      fontWeight: 500
                    }}
                  >
                    ({result.difference > 0 ? '+' : ''}{result.percentageChange.toFixed(1)}%)
                  </Typography>
                </Typography>
              </Box>
            ) : (
              <Chip 
                label="No change" 
                size="small" 
                color="default" 
                variant="outlined" 
                sx={{ 
                  fontSize: "0.75rem",
                  height: 24,
                  backgroundColor: alpha(theme.palette.text.disabled, 0.05)
                }} 
              />
            )}
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

// PriceChangeRow component 
const PriceChangeRow = ({ label, original = 0, current = 0, isLoading, error, children, icon }) => {
  const theme = useTheme();
  const difference = (current || 0) - (original || 0);
  const percentageChange = original ? ((current - original) / original) * 100 : 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: "all 0.2s ease",
          backgroundColor: isLoading 
            ? alpha(theme.palette.primary.main, 0.03)
            : error
              ? alpha(theme.palette.error.main, 0.03)
              : alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Box sx={{ 
          p: 2.5, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: children ? `1px solid ${alpha(theme.palette.divider, 0.07)}` : 'none'
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box 
              sx={{ 
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: alpha(
                  isLoading ? theme.palette.primary.main : 
                  error ? theme.palette.error.main : 
                  theme.palette.primary.main, 
                  0.1
                ),
              }}
            >
              {icon}
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontFamily: "Montserrat", 
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              {label}
              {isLoading && <CircularProgress size={16} thickness={4} sx={{ color: theme.palette.primary.main }} />}
            </Typography>
          </Box>
          
          {error && !isLoading && (
            <Typography variant="caption" sx={{ 
              color: theme.palette.error.main,
              fontWeight: 500
            }}>
              Some items require replacement
            </Typography>
          )}
          
          {!isLoading && !error && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                ₹{(original || 0).toLocaleString()}
              </Typography>
              
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: "50%",
                p: 0.5
              }}>
                <ArrowRight style={{ color: theme.palette.text.disabled }} size={18} />
              </Box>
              
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.5,
                borderRadius: "20px",
                py: 0.5,
                px: 1.5,
                backgroundColor: difference !== 0 
                  ? (difference > 0 
                    ? alpha(theme.palette.error.light, 0.1) 
                    : alpha(theme.palette.success.light, 0.1))
                  : "transparent"
              }}>
                <Typography 
                  sx={{
                    fontWeight: 600,
                    color: difference !== 0 
                      ? (difference > 0 
                        ? theme.palette.error.main 
                        : theme.palette.success.main)
                      : theme.palette.text.primary
                  }}
                >
                  ₹{(current || 0).toLocaleString()}
                </Typography>
                
                {difference !== 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", ml: 0.5 }}>
                    {difference > 0 
                      ? <TrendingUp size={14} style={{ color: theme.palette.error.main }} />
                      : <TrendingDown size={14} style={{ color: theme.palette.success.main }} />
                    }
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        ml: 0.5,
                        fontWeight: 500,
                        color: difference > 0 
                          ? theme.palette.error.main 
                          : theme.palette.success.main
                      }}
                    >
                      {difference > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          
          {isLoading && !error && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Clock size={16} style={{ color: theme.palette.text.disabled }} />
              <Typography sx={{ color: theme.palette.text.disabled, fontStyle: "italic" }}>
                Checking prices...
              </Typography>
            </Box>
          )}
        </Box>
        
        {children && (
          <Box sx={{ p: 2 }}>
            {children}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// ReplacementProgress component
const ReplacementProgress = ({ currentItem }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        borderRadius: "12px",
        background: alpha(theme.palette.primary.main, 0.05),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <CircularProgress 
          size={24} 
          thickness={4}
          sx={{ color: theme.palette.primary.main }} 
        />
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {currentItem.type === 'flight' ? 'Finding Replacement Flight' : 'Finding Replacement Hotel'}
        </Typography>
      </Box>
      
      <Grow in={!!currentItem}>
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.5,
            p: 2,
            borderRadius: "8px",
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            background: theme.palette.background.paper,
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: "all 0.2s ease"
          }}
        >
          {currentItem.type === "flight" ? (
            <Plane 
              size={20} 
              style={{ 
                color: theme.palette.primary.main,
                animation: "pulse 2s infinite ease-in-out"
              }} 
            />
          ) : (
            <Hotel 
              size={20} 
              style={{ 
                color: theme.palette.primary.main,
                animation: "pulse 2s infinite ease-in-out" 
              }} 
            />
          )}
          <Typography variant="body1" fontWeight={500}>
            {currentItem.status ||
              (currentItem.type === "flight"
                ? `Finding alternatives for: ${currentItem.origin} → ${currentItem.destination}`
                : `Finding alternatives for: ${currentItem.name}`)}
          </Typography>
        </Box>
      </Grow>
    </Paper>
  );
};

// FailedItemsSection component
const FailedItemsSection = ({ failedItems, handleFlightReplacement, handleHotelReplacement, isReplacing, currentlyReplacingItem }) => {
  const theme = useTheme();
  
  if (failedItems.length === 0) return null;
  
  // Helper to check if item is currently being replaced
  const isItemBeingReplaced = (item) => {
    if (!isReplacing || !currentlyReplacingItem) return false;
    
    if (item.type === 'flight' && currentlyReplacingItem.type === 'flight') {
      return item.details.flightCode === currentlyReplacingItem.details.flightCode;
    } else if (item.type === 'hotel' && currentlyReplacingItem.type === 'hotel') {
      const itemId = item.details?.staticContent?.[0]?.id || item.details?.hotelId;
      const replacingId = currentlyReplacingItem.details?.staticContent?.[0]?.id || 
                          currentlyReplacingItem.details?.hotelId;
      return itemId === replacingId;
    }
    return false;
  };
  
  return (
    <Paper 
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        borderRadius: "12px",
        background: alpha(theme.palette.warning.light, 0.1),
        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <AlertTriangle size={24} style={{ color: theme.palette.warning.main }} />
        <Typography variant="h6" sx={{ fontWeight: 500, color: theme.palette.warning.dark }}>
          Some items are no longer available and need replacement
        </Typography>
      </Box>
      
      <Stack spacing={2}>
        {failedItems.map((item, idx) => (
          <Fade in key={idx} timeout={300} style={{ transitionDelay: `${idx * 100}ms` }}>
            <Box>
              {item.type === "flight" && (
                <Box
                  sx={{
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    p: 2,
                    borderRadius: "10px",
                    background: alpha(theme.palette.warning.light, 0.1),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Plane size={20} style={{ color: theme.palette.warning.main, marginTop: "4px" }} />
                    <div>
                      <Typography variant="body1" fontWeight={500}>
                        {item.details.origin || "Unknown Origin"} → {item.details.destination || "Unknown Destination"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.error?.message || "This flight is no longer available"}
                      </Typography>
                    </div>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleFlightReplacement(item)}
                    startIcon={
                      isItemBeingReplaced(item) ? (
                        <CircularProgress size={16} />
                      ) : (
                        <RefreshCw size={16} />
                      )
                    }
                    disabled={isReplacing}
                    sx={{ 
                      ml: 2,
                      borderRadius: "8px",
                      borderColor: theme.palette.warning.main,
                      color: theme.palette.warning.main,
                      "&:hover": {
                        borderColor: theme.palette.warning.dark,
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                      }
                    }}
                  >
                    {isItemBeingReplaced(item) ? "Replacing..." : "Replace Flight"}
                  </Button>
                </Box>
              )}
              {item.type === "hotel" && (
                <Box
                  sx={{
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    p: 2,
                    borderRadius: "10px",
                    background: alpha(theme.palette.warning.light, 0.1),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Hotel size={20} style={{ color: theme.palette.warning.main, marginTop: "4px" }} />
                    <div>
                      <Typography variant="body1" fontWeight={500}>
                        {item.details.name || "Unknown Hotel"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.error?.message || "This hotel is no longer available"}
                      </Typography>
                    </div>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleHotelReplacement(item)}
                    startIcon={
                      isItemBeingReplaced(item) ? (
                        <CircularProgress size={16} />
                      ) : (
                        <RefreshCw size={16} />
                      )
                    }
                    disabled={isReplacing}
                    sx={{ 
                      ml: 2,
                      borderRadius: "8px",
                      borderColor: theme.palette.warning.main,
                      color: theme.palette.warning.main,
                      "&:hover": {
                        borderColor: theme.palette.warning.dark,
                        backgroundColor: alpha(theme.palette.warning.main, 0.05),
                      }
                    }}
                  >
                    {isItemBeingReplaced(item) ? "Replacing..." : "Replace Hotel"}
                  </Button>
                </Box>
              )}
            </Box>
          </Fade>
        ))}
      </Stack>
    </Paper>
  );
};

const PriceCheckModal = ({
  open,
  onClose,
  onConfirm,
  itinerary,
  tokens,
  onReplacementComplete
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const priceCheck = useSelector(state => state.priceCheck);
  const { markups, tcsRates } = useSelector(state => state.markup);
  const flightProgress = useSelector(selectFlightProgress);
  const hotelProgress = useSelector(selectHotelProgress);
  
  // Add state for replacement functionality
  const [failedItems, setFailedItems] = useState([]);
  const [isReplacing, setIsReplacing] = useState(false);
  const [currentReplacement, setCurrentReplacement] = useState(null);
  const [replacementComplete, setReplacementComplete] = useState(false);
  const [error, setError] = useState(null);
  const [allReplacementsComplete, setAllReplacementsComplete] = useState(false);
  const isLoading = priceCheck.flights.loading || priceCheck.hotels.loading;
  const hasErrors = priceCheck.flights.error || priceCheck.hotels.error;

  // Initialize price checks when modal opens
  const initiatePriceChecks = useCallback(async () => {
    try {
      if (allReplacementsComplete) return; // Skip if all items are already replaced
      
      // Extract all flights and hotels from the itinerary 
      const allFlights = itinerary.cities.flatMap(city => 
        city.days.flatMap(day => day.flights || [])
      );
      
      const allHotels = itinerary.cities.flatMap(city => 
        city.days.flatMap(day => day.hotels || [])
      );
      
      // Start price checks in parallel
      const [flightResults, hotelResults] = await Promise.all([
        dispatch(recheckFlightPrices({ 
          itineraryToken: itinerary.itineraryToken, 
          inquiryToken: tokens.inquiry,
          flights: allFlights
        })),
        dispatch(recheckHotelPrices({ 
          itineraryToken: itinerary.itineraryToken, 
          inquiryToken: tokens.inquiry,
          hotels: allHotels
        }))
      ]);

      // Check for failed items (expired or unavailable)
      const newFailedItems = [];
      
      // Check flights - ADD ANY flight with error to failedItems
      if (flightResults.payload && flightResults.payload.results) {
        flightResults.payload.results.forEach(result => {
          if (result.error || result.status === 'failed') {
            // Find the original flight data from allFlights
            const originalFlight = allFlights.find(f => 
              f.flightData.flightCode === result.flightCode || 
              f.flightData.traceId === result.traceId
            );
            
            newFailedItems.push({
              type: "flight",
              details: originalFlight ? originalFlight.flightData : result,
              error: {
                message: result.error || "Price check failed. This flight needs to be replaced.",
                errorCode: result.error?.errorCode || "PRICE_CHECK_FAILED"
              }
            });
          }
        });
      }

      // Check hotels - ADD ANY hotel with error to failedItems
      if (hotelResults.payload && hotelResults.payload.results) {
        hotelResults.payload.results.forEach(result => {
          if (result.error || result.status === 'failed') {
            // Find the original hotel data from allHotels
            const originalHotel = allHotels.find(h => 
              h.data.traceId === result.traceId || 
              h.data.code === result.itineraryCode
            );
            
            newFailedItems.push({
              type: "hotel",
              details: originalHotel ? originalHotel.data : {
                name: result.name,
                hotelId: result.traceId,
                checkIn: originalHotel?.data.checkIn,
                checkOut: originalHotel?.data.checkOut,
                searchRequestLog: originalHotel?.data.searchRequestLog
              },
              error: {
                message: result.error || "Price check failed. This hotel needs to be replaced.",
                errorCode: result.error?.errorCode || "PRICE_CHECK_FAILED"
              }
            });
          }
        });
      }
      
      setFailedItems(newFailedItems);

      // Only calculate price summary if no failures
      if (newFailedItems.length === 0) {
        // Calculate comprehensive price summary
        const summary = getPriceCheckSummary(
          itinerary, 
          flightResults.payload, 
          hotelResults.payload, 
          markups, 
          tcsRates
        );

        // Dispatch the price summary
        dispatch(updatePriceSummary(summary));
      }

    } catch (error) {
      console.error('Error checking prices:', error);
    }
  }, [dispatch, itinerary, tokens.inquiry, markups, tcsRates, allReplacementsComplete]);

  // Helper function to check if all items are replaced
  const checkAllReplacementsComplete = (updatedFailedItems) => {
    if (updatedFailedItems.length === 0) {
      // All items are replaced
      setAllReplacementsComplete(true);
      setReplacementComplete(true);
      
      // Call the onReplacementComplete callback if provided
      if (onReplacementComplete) {
        onReplacementComplete();
      }
      
      return true;
    }
    return false;
  };

   // Handle flight replacement
   const handleFlightReplacement = async (failedFlight) => {
    try {
      setIsReplacing(true);
      setError(null);
      setCurrentReplacement(failedFlight);
      
      setCurrentReplacement({
        ...failedFlight,
        status: "Searching for replacement flight...",
      });

      const searchResult = await dispatch(
        searchReplacementFlight({
          expiredFlight: failedFlight.details,
          itinerary,
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      if (!Array.isArray(searchResult) || searchResult.length === 0) {
        throw new Error("No replacement flights found");
      }

      setCurrentReplacement((prev) => ({
        ...prev,
        status: "Updating itinerary with new flight...",
      }));

      const cityName =
        failedFlight.details.type === "return_flight"
          ? failedFlight.details.origin
          : failedFlight.details.destination;

      const result = await dispatch(
        updateItineraryFlight({
          itineraryToken: tokens.itinerary,
          cityName,
          date: failedFlight.details.departureDate,
          newFlightDetails: searchResult[0],
          type: failedFlight.details.type || "departure_flight",
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      if (result.success) {
        // Only remove this specific flight from failed items
        const updatedFailedItems = failedItems.filter(
          (f) =>
            f.type !== "flight" ||
            f.details.flightCode !== failedFlight.details.flightCode
        );

        setFailedItems(updatedFailedItems);
        
        // Check if this was the last item to replace
        const isComplete = checkAllReplacementsComplete(updatedFailedItems);
      } else {
        throw new Error("Failed to update itinerary with new flight");
      }
    } catch (error) {
      console.error("Error replacing flight:", error);
      setError(error.message || "Failed to replace flight. Please try again.");
    } finally {
      setIsReplacing(false);
      setCurrentReplacement(null);
    }
  };

  // Handle hotel replacement
  const handleHotelReplacement = async (failedHotel) => {
    try {
      setIsReplacing(true);
      setError(null);
      setCurrentReplacement(failedHotel);

      // Store the ID of the hotel we're replacing for precise tracking
      const hotelToReplaceId = failedHotel.details?.staticContent?.[0]?.id || 
                              failedHotel.details?.hotelId;

      setCurrentReplacement({
        ...failedHotel,
        status: "Searching for replacement hotel...",
      });

      const searchResult = await dispatch(
        searchReplacementHotel({
          failedHotel: {
            details: failedHotel.details
          },
          itinerary,
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      setCurrentReplacement((prev) => ({
        ...prev,
        status: "Updating itinerary with new hotel...",
      }));

      const result = await dispatch(
        updateItineraryHotel({
          itineraryToken: tokens.itinerary,
          date: failedHotel.details.checkIn || failedHotel.details.searchRequestLog?.checkIn,
          newHotelDetails: searchResult.data,
          checkIn: failedHotel.details.checkIn || failedHotel.details.searchRequestLog?.checkIn,
          checkout: failedHotel.details.checkOut || failedHotel.details.searchRequestLog?.checkOut,
          inquiryToken: tokens.inquiry,
        })
      ).unwrap();

      if (result.success) {
        // Only remove the specific hotel we just replaced using ID matching
        const updatedFailedItems = failedItems.filter((f) => {
          if (f.type !== "hotel") return true;
          const currentHotelId = f.details?.staticContent?.[0]?.id || f.details?.hotelId;
          return currentHotelId !== hotelToReplaceId;
        });

        setFailedItems(updatedFailedItems);
        
        // Check if this was the last item to replace
        const isComplete = checkAllReplacementsComplete(updatedFailedItems);
      }
    } catch (error) {
      console.error("Error replacing hotel:", error);
      setError(error.message || "Failed to replace hotel. Please try again.");
    } finally {
      setIsReplacing(false);
      setCurrentReplacement(null);
    }
  };

  // Simplified retry
  const handleRetry = async () => {
    try {
      await initiatePriceChecks();
    } catch (error) {
      console.error(`Error retrying price check:`, error);
    }
  };

  // Effect to handle modal open/close
  useEffect(() => {
    if (open) {
      // Reset everything at start
      setAllReplacementsComplete(false);
      setReplacementComplete(false);
      setFailedItems([]);
      setError(null);
      initiatePriceChecks();
    }
    return () => {
      if (!open) {
        dispatch(resetPriceCheck());
      }
    };
  }, [open, dispatch, initiatePriceChecks]);

  // Add a separate effect to watch for failed items changes
  // This helps ensure we detect when all items are replaced
  useEffect(() => {
    if (failedItems.length === 0 && !isLoading && !isReplacing && open) {
      // Double check if we have already run some replacements
      if (replacementComplete) {
        setAllReplacementsComplete(true);
        setError("All items replaced successfully");
      }
    }
  }, [failedItems, isLoading, isReplacing, open, replacementComplete]);



  // Safe access to price summary
  const priceSummary = priceCheck.priceSummary;
  const total = {
    original: priceSummary?.originalTotals?.grandTotal || 0,
    new: priceSummary?.newTotals?.grandTotal || 0,
    difference: priceSummary?.difference || 0,
    percentageChange: priceSummary?.percentageChange || 0,
    hasPriceChanges: priceSummary?.hasPriceChanged || false
  };

  // Update canProceed logic to prevent proceeding if there are failed items
  const canProceed = !isLoading && !isReplacing && failedItems.length === 0 && !allReplacementsComplete;

  // Get alert icon based on current state
  const getAlertIcon = () => {
    if (isLoading) return <Info size={22} />;
    if (hasErrors || failedItems.length > 0) return <AlertTriangle size={22} />;
    if (total.hasPriceChanges) {
      return total.difference > 0 
        ? <TrendingUp size={22} /> 
        : <TrendingDown size={22} />;
    }
    return <Check size={22} />;
  };

  // Get alert title based on current state  
  const getAlertTitle = () => {
    if (isLoading) return "Verifying current prices";
    if (hasErrors || failedItems.length > 0) return "Some items need replacement";
    if (total.hasPriceChanges) {
      return total.difference > 0 
        ? "Prices have increased" 
        : "Prices have decreased";
    }
    return "Prices remain unchanged";
  };

  return (
    <Dialog 
      open={open} 
      onClose={!isLoading && !isReplacing ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          px: 3,
          py: 2,
          backgroundColor: theme.palette.mode === "dark" 
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.light, 0.05),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 42,
              height: 42,
              borderRadius: "12px",
              backgroundColor: alpha(
                isLoading 
                  ? theme.palette.info.main 
                  : failedItems.length > 0
                    ? theme.palette.warning.main
                    : total.hasPriceChanges 
                      ? (total.difference > 0 ? theme.palette.warning.main : theme.palette.success.main)
                      : theme.palette.success.main,
                0.1
              ),
            }}
          >
            {isLoading ? (
              <Box sx={{ position: "relative" }}>
                <CircularProgress 
                  size={24} 
                  thickness={4}
                  sx={{ 
                    color: theme.palette.info.main,
                  }} 
                />
                <DollarSign 
                  size={12} 
                  style={{ 
                    position: "absolute", 
                    top: "50%", 
                    left: "50%", 
                    transform: "translate(-50%, -50%)",
                    color: theme.palette.info.main
                  }} 
                />
              </Box>
            ) : (
              <DollarSign 
                size={22} 
                style={{ 
                  color: failedItems.length > 0
                    ? theme.palette.warning.main
                    : total.hasPriceChanges 
                      ? (total.difference > 0 ? theme.palette.warning.main : theme.palette.success.main)
                      : theme.palette.success.main
                }} 
              />
            )}
          </Box>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: "Montserrat", 
                fontWeight: 600, 
                color: theme.palette.text.primary,
              }}
            >
              {isLoading ? 'Checking Current Prices' : isReplacing ? 'Replacing Unavailable Items' : 'Price Check Complete'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: alpha(theme.palette.text.primary, 0.7),
                mt: 0.5,
              }}
            >
              {isLoading 
                ? "Verifying the latest prices for your booking"
                : isReplacing
                  ? "Finding alternatives for unavailable items"
                  : failedItems.length > 0
                    ? "Some items need replacement before proceeding"
                    : allReplacementsComplete
                      ? "All items replaced successfully"
                      : total.hasPriceChanges
                        ? `Prices have ${total.difference > 0 ? 'increased' : 'decreased'} since your last view`
                        : "All prices are confirmed and unchanged"
              }
            </Typography>
          </Box>
        </Box>
        
        {!isLoading && !isReplacing && (
          <IconButton 
            onClick={onClose} 
            sx={{
              color: theme.palette.text.secondary,
              width: 36,
              height: 36,
              backgroundColor: alpha(theme.palette.divider, 0.1),
              "&:hover": {
                backgroundColor: alpha(theme.palette.divider, 0.2),
              },
              transition: "all 0.2s ease",
            }}
          >
            <X size={18} />
          </IconButton>
        )}
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: "12px",
              background: alpha(
                isLoading 
                  ? theme.palette.info.main 
                  : hasErrors || failedItems.length > 0
                    ? theme.palette.error.main
                    : allReplacementsComplete
                      ? theme.palette.success.main
                      : total.hasPriceChanges
                        ? (total.difference > 0 ? theme.palette.warning.main : theme.palette.success.main)
                        : theme.palette.success.main,
                0.05
              ),
              border: `1px solid ${alpha(
                isLoading 
                  ? theme.palette.info.main 
                  : hasErrors || failedItems.length > 0
                    ? theme.palette.error.main
                    : allReplacementsComplete
                      ? theme.palette.success.main 
                      : total.hasPriceChanges
                        ? (total.difference > 0 ? theme.palette.warning.main : theme.palette.success.main)
                        : theme.palette.success.main,
                0.2
              )}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box 
                sx={{
                  mt: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  backgroundColor: alpha(
                    isLoading 
                      ? theme.palette.info.main 
                      : hasErrors || failedItems.length > 0
                        ? theme.palette.error.main
                        : allReplacementsComplete
                          ? theme.palette.success.main
                          : total.hasPriceChanges
                            ? (total.difference > 0 ? theme.palette.warning.main : theme.palette.success.main)
                            : theme.palette.success.main,
                    0.1
                  ),
                }}
              >
                {allReplacementsComplete ? <Check size={22} /> : getAlertIcon()}
              </Box>
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 0.5,
                    color: isLoading 
                      ? theme.palette.info.main 
                      : hasErrors || failedItems.length > 0
                        ? theme.palette.error.main
                        : allReplacementsComplete
                          ? theme.palette.success.main
                          : total.hasPriceChanges
                            ? (total.difference > 0 ? theme.palette.warning.main : theme.palette.success.main)
                            : theme.palette.success.main,
                  }}
                >
                  {allReplacementsComplete ? "All replacements complete!" : getAlertTitle()}
                </Typography>
                <Typography variant="body2">
                  {isLoading 
                    ? "Please wait while we check the latest prices for your booking."
                    : hasErrors || failedItems.length > 0
                      ? "Some items need to be replaced before you can proceed."
                      : allReplacementsComplete
                        ? "Return to view updated details and continue with your booking."
                        : total.hasPriceChanges
                          ? `Some prices have changed ${
                              total.difference > 0 
                                ? "and increased by " 
                                : "and decreased by "
                            } ${Math.abs(total.percentageChange).toFixed(1)}%. Please review the changes below.`
                          : "You can proceed with your booking at the same prices."
                  }
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Show replacement progress if currently replacing */}
        {isReplacing && currentReplacement && (
          <ReplacementProgress currentItem={currentReplacement} />
        )}

        {/* Show failed items that need replacement */}
        {failedItems.length > 0 && (
          <FailedItemsSection 
            failedItems={failedItems} 
            handleFlightReplacement={handleFlightReplacement}
            handleHotelReplacement={handleHotelReplacement}
            isReplacing={isReplacing}
            currentlyReplacingItem={currentReplacement}
          />
        )}

        {/* Show error message if any */}
        {error && !error.includes("go back to itinerary") && (
          <Paper 
            elevation={0}
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: "12px",
              background: alpha(theme.palette.error.light, 0.05),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AlertTriangle size={20} style={{ color: theme.palette.error.main }} />
              <Typography sx={{ fontWeight: 500, color: theme.palette.error.main }}>
                {error}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Go Back to Itinerary section - shown after all replacements complete */}
        {failedItems.length === 0 && allReplacementsComplete && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
              maxWidth: "500px",
              mx: "auto",
              my: 4
            }}
          >
            <Paper 
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                background: alpha(theme.palette.success.light, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%"
              }}
            >
              <Check size={20} style={{ color: theme.palette.success.main }} />
              <Typography>
                All replacements complete! Return to view updated details.
              </Typography>
            </Paper>
            
            <Button
              variant="contained"
              onClick={() => {
                navigate("/itinerary", {
                  state: {
                    itineraryToken: tokens.itinerary,
                    itineraryInquiryToken: tokens.inquiry,
                  },
                });
              }}
              startIcon={<ChevronLeft size={18} />}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "#fff",
                borderRadius: "10px",
                py: 1.2,
                px: 3,
                fontWeight: 600,
                transition: "all 0.2s ease",
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                }
              }}
            >
              Go Back to Itinerary
            </Button>
          </Box>
        )}

          {!isReplacing && !allReplacementsComplete && (
            <>
              <PriceChangeRow 
                label="Flights" 
                icon={<Plane size={18} style={{ color: theme.palette.primary.main }} />}
                original={priceCheck.flights.data?.results?.reduce((sum, r) => sum + r.originalPrice, 0) || 0}
                current={priceCheck.flights.data?.results?.reduce((sum, r) => sum + r.newPrice, 0) || 0}
                isLoading={priceCheck.flights.loading}
                error={priceCheck.flights.error}
                onRetry={handleRetry}
              >
                <Stack spacing={1.5}>
                  {flightProgress.currentFlight && (
                    <FlightProgressRow 
                      flight={flightProgress.currentFlight}
                      isChecking={true}
                    />
                  )}
                  {flightProgress.results.map((result, idx) => (
                    <FlightProgressRow 
                      key={`${result.traceId || idx}-${idx}`}
                      flight={result}
                      result={result}
                      error={result.error}
                    />
                  ))}
                </Stack>
              </PriceChangeRow>
      
              <PriceChangeRow 
                label="Hotels" 
                icon={<Hotel size={18} style={{ color: theme.palette.primary.main }} />}
                original={priceCheck.hotels.data?.results?.reduce((sum, r) => sum + r.originalPrice, 0) || 0}
                current={priceCheck.hotels.data?.results?.reduce((sum, r) => sum + r.newPrice, 0) || 0}
                isLoading={priceCheck.hotels.loading}
                error={priceCheck.hotels.error}
                onRetry={handleRetry}
              >
                <Stack spacing={1.5}>
                  {hotelProgress.currentHotel && (
                    <HotelProgressRow 
                      hotel={hotelProgress.currentHotel}
                      isChecking={true}
                    />
                  )}
                  {hotelProgress.results.map((result, idx) => (
                    <HotelProgressRow 
                      key={`${result.traceId || idx}-${idx}`}
                      hotel={result}
                      result={result}
                      error={result.error}
                    />
                  ))}
                </Stack>
              </PriceChangeRow>
            </>
          )}

          {!isLoading && !isReplacing && priceSummary && !allReplacementsComplete && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                backgroundColor: theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.background.default, 0.7),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                boxShadow: total.hasPriceChanges 
                  ? `0 4px 20px ${alpha(
                      total.difference > 0 
                        ? theme.palette.error.main 
                        : theme.palette.success.main, 
                      0.1
                    )}`
                  : 'none'
              }}
            >
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1.5, 
                mb: 2,
                pb: 1.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}>
                <Box 
                  sx={{ 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    backgroundColor: alpha(
                      total.hasPriceChanges 
                        ? (total.difference > 0 
                          ? theme.palette.error.main 
                          : theme.palette.success.main)
                        : theme.palette.primary.main, 
                      0.1
                    ),
                  }}
                >
                  <DollarSign 
                    size={18} 
                    style={{ 
                      color: total.hasPriceChanges 
                        ? (total.difference > 0 
                          ? theme.palette.error.main 
                          : theme.palette.success.main)
                        : theme.palette.primary.main 
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ fontFamily: "Montserrat", fontWeight: 600 }}
                >
                  Total Price Summary
                </Typography>
              </Box>
              
              <Box sx={{ px: 1 }}>
                <Box 
                  sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    py: 1.5
                  }}
                >
                  <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                    Original Total:
                  </Typography>
                  <Typography sx={{ fontWeight: 500 }}>
                    ₹{(priceSummary.originalTotals?.grandTotal || 0).toLocaleString()}
                  </Typography>
                </Box>
                
                <Divider sx={{ opacity: 0.5 }} />
                
                <Box 
                  sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    py: 1.5
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>
                    New Total:
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: total.hasPriceChanges 
                        ? (total.difference > 0 
                          ? theme.palette.error.main 
                          : theme.palette.success.main)
                        : theme.palette.text.primary
                    }}
                  >
                    ₹{(priceSummary.newTotals?.grandTotal || 0).toLocaleString()}
                  </Typography>
                </Box>
                
                {total.hasPriceChanges && (
                  <Grow in>
                    <Box 
                      sx={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        mt: 2,
                        p: 2,
                        borderRadius: "10px",
                        backgroundColor: alpha(
                          total.difference > 0 
                            ? theme.palette.error.main 
                            : theme.palette.success.main,
                          0.08
                        ),
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {total.difference > 0 
                          ? <TrendingUp size={18} style={{ color: theme.palette.error.main }} />
                          : <TrendingDown size={18} style={{ color: theme.palette.success.main }} />
                        }
                        <Typography sx={{ fontWeight: 500 }}>
                          Price {total.difference > 0 ? "Increase" : "Decrease"}:
                        </Typography>
                      </Box>
                      <Typography 
                        sx={{ 
                          fontWeight: 600,
                          color: total.difference > 0 
                            ? theme.palette.error.main 
                            : theme.palette.success.main,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5
                        }}
                      >
                        {total.difference > 0 ? <Plus size={14} /> : <Minus size={14} />}
                        ₹{Math.abs(total.difference).toLocaleString()}
                        <span style={{ marginLeft: "4px", fontWeight: 500 }}>
                          ({total.percentageChange > 0 ? '+' : ''}
                          {total.percentageChange.toFixed(1)}%)
                        </span>
                      </Typography>
                    </Box>
                  </Grow>
                )}
              </Box>
            </Paper>
          )}
        
        {/* Action Buttons */}
        {!allReplacementsComplete && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 4,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              startIcon={<X size={18} />}
              disabled={isLoading || isReplacing}
              sx={{
                borderColor: alpha(theme.palette.error.main, 0.5),
                color: theme.palette.error.main,
                borderRadius: "10px",
                py: 1.2,
                px: 3,
                textTransform: "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.05),
                  transform: "translateY(-2px)",
                },
              }}
            >
              Cancel
            </Button>
            
            <Button
              variant="contained"
              onClick={onConfirm}
              disabled={!canProceed}
              startIcon={isLoading || isReplacing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Check size={18} />
              )}
              sx={{
                backgroundColor: isLoading || isReplacing
                  ? theme.palette.grey[400]
                  : failedItems.length > 0
                    ? theme.palette.warning.main
                    : total.hasPriceChanges 
                      ? (total.difference > 0 
                        ? theme.palette.warning.main 
                        : theme.palette.success.main)
                      : theme.palette.primary.main,
                color: "#fff",
                borderRadius: "10px",
                py: 1.2,
                px: 3,
                fontWeight: 600,
                textTransform: "none",
                transition: "all 0.2s ease",
                boxShadow: `0 4px 14px ${alpha(
                  isLoading || isReplacing
                    ? theme.palette.grey[400]
                    : failedItems.length > 0
                      ? theme.palette.warning.main
                      : total.hasPriceChanges 
                        ? (total.difference > 0 
                          ? theme.palette.warning.main 
                          : theme.palette.success.main)
                        : theme.palette.primary.main,
                  0.3
                )}`,
               "&:hover": {
                  backgroundColor: isLoading || isReplacing
                    ? theme.palette.grey[400]
                    : failedItems.length > 0
                      ? theme.palette.warning.dark
                      : total.hasPriceChanges 
                        ? (total.difference > 0 
                          ? theme.palette.warning.dark 
                          : theme.palette.success.dark)
                        : theme.palette.primary.dark,
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 20px ${alpha(
                    isLoading || isReplacing
                      ? theme.palette.grey[400]
                      : failedItems.length > 0
                        ? theme.palette.warning.main
                        : total.hasPriceChanges 
                          ? (total.difference > 0 
                            ? theme.palette.warning.main 
                            : theme.palette.success.main)
                          : theme.palette.primary.main,
                    0.4
                  )}`,
                },
                "&:disabled": {
                  backgroundColor: alpha(theme.palette.action.disabled, 0.24),
                  boxShadow: "none",
                }
              }}
            >
              {isLoading
                ? "Checking Prices..."
                : isReplacing
                  ? "Replacing Items..."
                  : failedItems.length > 0
                    ? "Please Replace All Items"
                    : total.hasPriceChanges 
                      ? `Proceed with ${total.difference > 0 ? 'New' : 'Lower'} Prices`
                      : "Continue Booking"
              }
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceCheckModal;