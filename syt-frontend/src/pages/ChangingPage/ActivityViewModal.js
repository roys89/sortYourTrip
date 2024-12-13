import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, Card, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState, } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeChangeModal } from '../../redux/slices/activitySlice';
import { fetchItinerary } from '../../redux/slices/itinerarySlice';

const ActivityViewModal = ({ 
  open, 
  onClose, 
  activity,
  inquiryToken,
  city,
  date 
}) => {
  const dispatch = useDispatch();
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState(null);
  const [activityDetails, setActivityDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [priceComparison, setPriceComparison] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const { itineraryToken } = useSelector((state) => state.itinerary);
  
  const fetchActivityDetails = useCallback(async () => {
    if (!activity?.code) return;
    
    try {
      setLoading(true);
      setError(null);
      setSelectedOption(null);
  
      const response = await fetch(
        `http://localhost:5000/api/itinerary/product-info/${activity.code}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': activity.inquiryToken,
          },
          body: JSON.stringify({
            city: {
              name: activity.city
            },
            date: activity.date,
            travelersDetails: activity.travelersDetails
          })
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch activity details');
      }
  
      const data = await response.json();
      setActivityDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activity]);

  useEffect(() => {
    if (open) {
      fetchActivityDetails();
    }
  }, [open, fetchActivityDetails]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
    // Calculate price comparison when option is selected
    if (activity.oldActivityCode) {
      const existingPrice = activity.existingPrice || 0;
      const newPrice = option.amount;
      const priceDifference = newPrice - existingPrice;
      const percentageChange = existingPrice ? ((priceDifference) / existingPrice) * 100 : 0;

      setPriceComparison({
        existingPrice,
        newPrice,
        priceDifference,
        percentageChange,
        currency: option.currency
      });
    }
  };

  const handleConfirmChange = async () => {
    try {
      setReplacing(true);
      setError(null);
      setConfirmationOpen(false);

      const newActivityDetails = {
        activityType: 'online',
        activityCode: activity.code,
        activityName: activity.title,
        lat: activity.lat || null,
        long: activity.long || null,
        packageDetails: {
          amount: selectedOption.amount,
          currency: selectedOption.currency, 
          ratekey: selectedOption.ratekey,
          title: selectedOption.title,
          departureTime: selectedOption.departureTime,
          description: selectedOption.description
        },
        price_difference: priceComparison?.priceDifference || 0,
        images: activityDetails?.productInfo?.images || [],
        description: activityDetails?.productInfo?.description || '',
        inclusions: activityDetails?.productInfo?.inclusions || [],
        exclusions: activityDetails?.productInfo?.exclusions || [],
        itinerary: activityDetails?.productInfo?.itinerary || null,
        additionalInfo: activityDetails?.productInfo?.additionalInfo || [],
        bookingQuestions: activityDetails?.productInfo?.bookingQuestions || [],
        cancellationFromTourDate: activityDetails?.productInfo?.cancellationFromTourDate || [],
        groupCode: selectedOption.code,
        tourGrade: activityDetails?.productInfo?.tourGrades?.[0] || null,
        ageBands: activityDetails?.productInfo?.ageBands || [],
        bookingRequirements: activityDetails?.productInfo?.bookingRequirements || null,
        pickupHotellist: activityDetails?.productInfo?.PickupHotellist || null
      };

      const response = await fetch(
        `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Inquiry-Token': activity.inquiryToken,
          },
          body: JSON.stringify({
            cityName: activity.city,
            date: activity.date,
            oldActivityCode: activity.oldActivityCode,
            newActivityDetails
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to replace activity');
      }

      await dispatch(fetchItinerary({
        itineraryToken,
        inquiryToken: activity.inquiryToken
      })).unwrap();

      dispatch(closeChangeModal());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplacing(false);
    }
  };

  const handleAddActivity = async () => {
    if (!selectedOption) {
      setError('Please select an option first');
      return;
    }

    // If replacing existing activity, show confirmation
    if (activity.oldActivityCode) {
      setConfirmationOpen(true);
      return;
    }

    // If not replacing, proceed with API call directly
    handleConfirmChange();
  };

  if (!activity) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {activity?.title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Stack spacing={3}>
            {/* Images section */}
            {activityDetails?.productInfo?.images && (
              <Box sx={{ overflow: 'auto' }}>
                <Stack direction="row" spacing={2}>
                  {activityDetails.productInfo.images.map((image, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        height: 300, 
                        minWidth: 400,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={image.variants?.[0]?.url || '/api/placeholder/400/300'}
                        alt={image.caption || `Activity ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/api/placeholder/400/300'; }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Available Options */}
            {activityDetails?.availabilityDetails?.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Available Options</Typography>
                <Stack spacing={2}>
                  {activityDetails.availabilityDetails.map((option) => (
                    <Card 
                      key={option.ratekey}
                      onClick={() => handleOptionSelect(option)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedOption?.ratekey === option.ratekey ? 2 : 1,
                        borderColor: selectedOption?.ratekey === option.ratekey ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: selectedOption?.ratekey === option.ratekey ? 'primary.main' : 'primary.light',
                          boxShadow: 1
                        }
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {option.title}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" color="primary">
                            {option.currency} {option.amount.toLocaleString()}
                          </Typography>
                          {option.departureTime && (
                            <Typography variant="body1" color="text.secondary">
                              Departure: {option.departureTime}
                            </Typography>
                          )}
                        </Stack>
                        {option.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            dangerouslySetInnerHTML={{ __html: option.description }} 
                          />
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider />

            {/* Description section */}
            {activityDetails?.productInfo?.description && (
              <Typography variant="body1">
                {activityDetails.productInfo.description}
              </Typography>
            )}

            {/* Inclusions section */}
            {activityDetails?.productInfo?.inclusions?.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Inclusions</Typography>
                <ul>
                  {activityDetails.productInfo.inclusions.map((inclusion, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        {inclusion.otherDescription}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            {/* Exclusions section */}
            {activityDetails?.productInfo?.exclusions?.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Exclusions</Typography>
                <ul>
                  {activityDetails.productInfo.exclusions.map((exclusion, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        {exclusion.otherDescription || exclusion.typeDescription}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            {/* Action buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddActivity}
                disabled={replacing || !selectedOption}
              >
                {replacing ? <CircularProgress size={24} /> : 
                  activity.oldActivityCode ? 'Change Activity' : 'Add Activity'}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      {/* Price Comparison Dialog */}
      {confirmationOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-bold mb-4">Confirm Activity Change</h3>
            
            {priceComparison && (
              <div className="space-y-3 mb-6">
                <p>Current Activity Price: {priceComparison.currency} {priceComparison.existingPrice.toLocaleString()}</p>
                <p>New Activity Price: {priceComparison.currency} {priceComparison.newPrice.toLocaleString()}</p>
                <p className={`font-bold ${priceComparison.priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Price {priceComparison.priceDifference > 0 ? 'Increase' : 'Decrease'}: {priceComparison.currency} {Math.abs(priceComparison.priceDifference).toLocaleString()} 
                  ({priceComparison.percentageChange.toFixed(1)}%)
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmationOpen(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChange}
                disabled={replacing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {replacing ? 
                  <CircularProgress size={20} color="inherit" /> : 
                  'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default ActivityViewModal;