// components/PriceCheckModal/PriceCheckModal.js
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography
} from "@mui/material";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Hotel,
  Minus,
  Plane,
  Plus,
  RefreshCw,
  X
} from "lucide-react";
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  recheckFlightPrices,
  recheckHotelPrices,
  resetPriceCheck,
  selectFlightProgress,
  selectHotelProgress
} from '../../redux/slices/priceCheckSlice';

const FlightProgressRow = ({ flight, isChecking, result, error, onRetry }) => (
  <Box className="flex justify-between items-center p-2 bg-gray-50 rounded-md mb-2">
    <Box className="flex items-center gap-2">
      <Plane size={16} className={isChecking ? 'animate-pulse' : ''} />
      <Typography variant="body2">
        {flight.origin} → {flight.destination}
      </Typography>
    </Box>

    {isChecking ? (
      <CircularProgress size={16} />
    ) : error ? (
      <Box className="flex items-center gap-2">
        <Typography color="error" variant="body2">
          {error.response?.data?.error?.error?.errorCode === 6 
            ? "Flight expired" 
            : "Error checking price"}
        </Typography>
        <Tooltip title="Retry">
          <IconButton size="small" onClick={() => onRetry('flights')}>
            <RefreshCw size={16} />
          </IconButton>
        </Tooltip>
      </Box>
    ) : result && (
      <Typography 
        variant="body2" 
        className={result.priceChanged ? 'font-medium' : ''}
        color={result.difference > 0 ? 'error' : 'success'}
      >
        {result.priceChanged ? (
          <>
            ₹{result.newPrice.toLocaleString()}
            <span className="ml-1 text-xs">
              ({result.difference > 0 ? '+' : ''}{result.percentageChange.toFixed(1)}%)
            </span>
          </>
        ) : (
          'No change'
        )}
      </Typography>
    )}
  </Box>
);

const HotelProgressRow = ({ hotel, isChecking, result, error, onRetry }) => (
  <Box className="flex justify-between items-center p-2 bg-gray-50 rounded-md mb-2">
    <Box className="flex items-center gap-2">
      <Hotel size={16} className={isChecking ? 'animate-pulse' : ''} />
      <Typography variant="body2">
        {hotel.name}
        {hotel.roomType && (
          <span className="text-gray-500 ml-1">({hotel.roomType})</span>
        )}
      </Typography>
    </Box>

    {isChecking ? (
      <CircularProgress size={16} />
    ) : error ? (
      <Box className="flex items-center gap-2">
        <Typography color="error" variant="body2">
          {error.response?.data?.error?.code === 'HOTEL_NOT_AVAILABLE' 
            ? "Hotel no longer available" 
            : "Error checking price"}
        </Typography>
        <Tooltip title="Retry">
          <IconButton size="small" onClick={() => onRetry('hotels')}>
            <RefreshCw size={16} />
          </IconButton>
        </Tooltip>
      </Box>
    ) : result && (
      <Typography 
        variant="body2" 
        className={result.priceChanged ? 'font-medium' : ''}
        color={result.difference > 0 ? 'error' : 'success'}
      >
        {result.priceChanged ? (
          <>
            ₹{result.newPrice.toLocaleString()}
            <span className="ml-1 text-xs">
              ({result.difference > 0 ? '+' : ''}{result.percentageChange.toFixed(1)}%)
            </span>
          </>
        ) : (
          'No change'
        )}
      </Typography>
    )}
  </Box>
);

const PriceChangeRow = ({ label, original = 0, current = 0, isLoading, error, onRetry, children }) => {
  const difference = (current || 0) - (original || 0);
  const percentageChange = original ? ((current - original) / original) * 100 : 0;

  return (
    <Box className="space-y-2">
      <Box className="flex justify-between items-center p-3">
        <Typography className="font-medium flex items-center gap-2">
          {label}
          {isLoading && <CircularProgress size={16} />}
          {error && !isLoading && (
            <Tooltip title="Retry">
              <IconButton size="small" onClick={onRetry} color="primary">
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Typography>
        
        {!isLoading && !error ? (
          <Box className="flex items-center gap-4">
            <Typography className="text-gray-600">
              ₹{original.toLocaleString()}
            </Typography>
            <ArrowRight className="text-gray-400" size={20} />
            <Typography 
              className={`font-medium ${
                difference > 0 ? 'text-red-500' : difference < 0 ? 'text-green-500' : 'text-gray-600'
              }`}
            >
              ₹{current.toLocaleString()}
              {difference !== 0 && (
                <span className="ml-2 text-sm">
                  ({difference > 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
                </span>
              )}
            </Typography>
          </Box>
        ) : (
          <Typography className="text-gray-400">
            {error ? 'Error checking price' : 'Checking...'}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
};

const PriceCheckModal = ({
  open,
  onClose,
  onConfirm,
  itinerary,
  tokens
}) => {
  const dispatch = useDispatch();
  const priceCheck = useSelector(state => state.priceCheck);
  const flightProgress = useSelector(selectFlightProgress);
  const hotelProgress = useSelector(selectHotelProgress);
  const originalPrices = itinerary?.priceTotals;

  // Initialize price checks when modal opens
  const initiatePriceChecks = useCallback(async () => {
    try {
      console.log('Itinerary received:', itinerary);
      
      // Extract all flights and hotels from the itinerary 
      const allFlights = itinerary.cities.flatMap(city => 
        city.days.flatMap(day => day.flights || [])
      );
      
      const allHotels = itinerary.cities.flatMap(city => 
        city.days.flatMap(day => day.hotels || [])
      );
      
      console.log('Extracted hotels:', allHotels);
      if(allHotels.length > 0) {
        console.log('Sample hotel structure:', JSON.stringify(allHotels[0]));
      }
  
      // Start price checks in parallel (removed activities)
      await Promise.all([
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
    } catch (error) {
      console.error('Error checking prices:', error);
    }
  }, [dispatch, itinerary, tokens.inquiry]);
  

  // Effect to handle modal open/close
  useEffect(() => {
    if (open) {
      initiatePriceChecks();
    }
    return () => {
      if (!open) {
        dispatch(resetPriceCheck());
      }
    };
  }, [open, dispatch, initiatePriceChecks]);

  // Calculate total changes in prices
  const calculateTotalChanges = useCallback(() => {
    if (!originalPrices) {
      return {
        newPrices: {
          flights: 0,
          hotels: 0
        },
        total: {
          original: 0,
          new: 0,
          hasPriceChanges: false,
          difference: 0,
          percentageChange: 0
        }
      };
    }
  
    const newPrices = {
      flights: priceCheck.flights.data?.newPrice || originalPrices.flights || 0,
      hotels: priceCheck.hotels.data?.total || originalPrices.hotels || 0
    };
  
    const total = {
      original: originalPrices.grandTotal || 0,
      new: Object.values(newPrices).reduce((sum, val) => sum + (val || 0), 0),
      hasPriceChanges: false
    };
  
    total.difference = total.new - total.original;
    total.percentageChange = total.original ? ((total.new - total.original) / total.original) * 100 : 0;
    total.hasPriceChanges = total.difference !== 0;
  
    return { newPrices, total };
  }, [originalPrices, priceCheck]);

  // Handle retries
  const handleRetry = async (type) => {
    try {
      switch(type) {
        case 'flights':
          const allFlights = itinerary.cities.flatMap(city => 
            city.days.flatMap(day => day.flights || [])
          );
          await dispatch(recheckFlightPrices({ 
            itineraryToken: itinerary.itineraryToken, 
            inquiryToken: tokens.inquiry,
            flights: allFlights
          }));
          break;
  
        case 'hotels':
          const allHotels = itinerary.cities.flatMap(city => 
            city.days.flatMap(day => day.hotels || [])
          );
          await dispatch(recheckHotelPrices({ 
            itineraryToken: itinerary.itineraryToken, 
            inquiryToken: tokens.inquiry,
            hotels: allHotels
          }));
          break;
  
        default:
          await initiatePriceChecks();
      }
    } catch (error) {
      console.error(`Error retrying ${type} price check:`, error);
    }
  };

  const isLoading = priceCheck.flights.loading || priceCheck.hotels.loading;

  const hasErrors = priceCheck.flights.error || priceCheck.hotels.error;

  const { newPrices, total } = calculateTotalChanges();

  const canProceed = !isLoading && !hasErrors;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <AlertTriangle 
              className={isLoading ? 'text-blue-500' : total.hasPriceChanges ? 'text-yellow-500' : 'text-green-500'} 
            />
            <Typography variant="h6">
              {isLoading ? 'Checking Current Prices' : 'Price Check Complete'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert 
          severity={isLoading ? "info" : total.difference > 0 ? "warning" : "success"}
          className="mb-4"
        >
          <AlertTitle>
            {isLoading 
              ? "Verifying current prices" 
              : total.hasPriceChanges
                ? total.difference > 0 
                  ? "Prices have increased"
                  : "Prices have decreased"
                : "Prices remain unchanged"
            }
          </AlertTitle>
          {isLoading 
            ? "Please wait while we check the latest prices for your booking."
            : total.hasPriceChanges
              ? "Some prices have changed since you last viewed them. Please review the changes below."
              : "You can proceed with your booking at the same prices."
          }
        </Alert>

        {hasErrors && (
          <Alert severity="error" className="mb-4">
            <AlertTitle>Some price checks failed</AlertTitle>
            Please retry or proceed with caution as some prices couldn't be verified.
          </Alert>
        )}

        <Box className="space-y-2 mb-6">
          <PriceChangeRow 
            label="Flights"
            original={originalPrices?.flights}
            current={newPrices.flights}
            isLoading={priceCheck.flights.loading}
            error={priceCheck.flights.error}
            onRetry={() => handleRetry('flights')}
          >
            {flightProgress.currentFlight && (
              <Box className="ml-4 border-l-2 pl-4 space-y-2">
                <FlightProgressRow 
                  flight={flightProgress.currentFlight}
                  isChecking={true}
                  onRetry={handleRetry}
                />
                {flightProgress.results.map((result, idx) => (
                  <FlightProgressRow 
                    key={`${result.traceId}-${idx}`}
                    flight={result}
                    result={result}
                    error={result.error}
                    onRetry={handleRetry}
                  />
                ))}
              </Box>
            )}
          </PriceChangeRow>

          <Divider />

          <PriceChangeRow 
            label="Hotels"
            original={originalPrices?.hotels}
            current={newPrices.hotels}
            isLoading={priceCheck.hotels.loading}
            error={priceCheck.hotels.error}
            onRetry={() => handleRetry('hotels')}
          >
            {hotelProgress.currentHotel && (
              <Box className="ml-4 border-l-2 pl-4 space-y-2">
                <HotelProgressRow 
                  hotel={hotelProgress.currentHotel}
                  isChecking={true}
                  onRetry={handleRetry}
                />
                {hotelProgress.results.map((result, idx) => (
                  <HotelProgressRow 
                  key={`${result.traceId}-${idx}`}
                  hotel={result}
                  result={result}
                  error={result.error}
                  onRetry={handleRetry}
                />
              ))}
            </Box>
          )}
        </PriceChangeRow>
      </Box>

      {!isLoading && (
        <Box className="bg-gray-50 p-4 rounded-lg">
          <Typography variant="h6" className="mb-2">
            Total Price Summary
          </Typography>
          <Box className="flex justify-between items-center">
            <Typography>Original Total:</Typography>
            <Typography>₹{total.original.toLocaleString()}</Typography>
          </Box>
          <Box className="flex justify-between items-center mt-1">
            <Typography>New Total:</Typography>
            <Typography className="font-bold">
              ₹{total.new.toLocaleString()}
            </Typography>
          </Box>
          {total.hasPriceChanges && (
            <Box className="flex justify-end mt-2">
              <Typography 
                className={`font-medium ${
                  total.difference > 0 ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {total.difference > 0 ? <Plus size={16} /> : <Minus size={16} />}
                ₹{Math.abs(total.difference).toLocaleString()}
                <span className="ml-2">
                  ({total.percentageChange > 0 ? '+' : ''}{total.percentageChange.toFixed(1)}%)
                </span>
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </DialogContent>

    <DialogActions className="p-4">
      <Button
        variant="outlined"
        onClick={onClose}
        startIcon={<X size={18} />}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        disabled={!canProceed || isLoading}
        startIcon={<Check size={18} />}
        color={total.difference > 0 ? "warning" : "primary"}
      >
        {isLoading
          ? "Checking Prices..."
          : total.hasPriceChanges 
            ? `Proceed with New Prices (${total.difference > 0 ? '+' : ''}${total.percentageChange.toFixed(1)}%)`
            : "Continue Booking"
        }
      </Button>
    </DialogActions>
  </Dialog>
);
};

export default PriceCheckModal;