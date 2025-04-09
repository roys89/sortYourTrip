import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, Card, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState, } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeChangeModal } from '../../redux/slices/activitySlice';
import { fetchItinerary } from '../../redux/slices/itinerarySlice';

// --- Helper function to parse duration string to minutes --- 
const parseDurationToMinutes = (durationString) => {
    if (!durationString || typeof durationString !== 'string') {
        return null; 
    }
    let totalMinutes = 0;
    const hoursMatch = durationString.match(/(\d+)\s*hour/i);
    const minutesMatch = durationString.match(/(\d+)\s*minute/i);

    if (hoursMatch && hoursMatch[1]) {
        totalMinutes += parseInt(hoursMatch[1], 10) * 60; 
    }
    if (minutesMatch && minutesMatch[1]) {
        totalMinutes += parseInt(minutesMatch[1], 10);
    }

    if (totalMinutes === 0 && /^\d+$/.test(durationString.trim())) {
        totalMinutes = parseInt(durationString.trim(), 10);
    }

    return totalMinutes > 0 ? totalMinutes : null; 
};

// --- Frontend Time Helper Functions (based on backend logic) ---

// Helper function to validate and normalize time (HH:MM format)
const validateAndNormalizeTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!pattern.test(timeStr)) return null;
    return timeStr; // Already in HH:MM format
};

// Helper function to determine time slot based on hour
const getTimeSlot = (timeStr) => {
  if (!timeStr) return null;
  const validatedTime = validateAndNormalizeTime(timeStr);
  if (!validatedTime) return null;

  const hour = parseInt(validatedTime.split(':')[0], 10);

  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 20) return 'evening';
  return null; // Outside defined slots or invalid
};

// Helper function to calculate end time using duration in minutes
const calculateEndTime = (startTimeStr, durationInMinutes) => {
  const validatedStartTime = validateAndNormalizeTime(startTimeStr);
  if (!validatedStartTime || durationInMinutes == null || durationInMinutes <= 0) {
    return null; // Cannot calculate without valid start time and duration
  }

  const [hours, minutes] = validatedStartTime.split(':').map(Number);
  const totalStartMinutes = hours * 60 + minutes;
  const totalEndMinutes = totalStartMinutes + durationInMinutes;

  const endHours = Math.floor(totalEndMinutes / 60) % 24; 
  const endMinutes = totalEndMinutes % 60;

  if (endHours >= 20 && totalStartMinutes < (20*60)) { 
      return '20:00';
  }

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// --- End Frontend Time Helper Functions ---

const ActivityViewModal = ({ 
  open, 
  onClose, 
  activity,
  inquiryToken,
  city,
  date,
  travelersDetails,
  oldActivityCode
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
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify({
            city: { name: city },
            date: date,
            travelersDetails: travelersDetails,
            searchId: activity.searchId,
            groupCode: activity.groupCode
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
  }, [activity, inquiryToken, city, date, travelersDetails]);

  useEffect(() => {
    if (open) {
      fetchActivityDetails();
    }
  }, [open, fetchActivityDetails]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
    // Calculate price comparison when option is selected
    if (oldActivityCode) {
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

      // --- Determine Start Time (assuming selectedOption.departureTime exists) --- 
      const finalStartTime = validateAndNormalizeTime(selectedOption?.departureTime);
      if (!finalStartTime) {
         setError('Selected option does not have a valid departure time.');
         setReplacing(false);
         return;
      }

      // --- Parse Duration to Minutes ---
      const durationInMinutes = parseDurationToMinutes(activityDetails?.productInfo?.duration);
      if (durationInMinutes === null) {
         setError('Could not determine activity duration.');
         setReplacing(false);
         return;
      }

      // --- Calculate End Time & Time Slot ---
      const finalEndTime = calculateEndTime(finalStartTime, durationInMinutes);
      const finalTimeSlot = getTimeSlot(finalStartTime);

      // Construct payload mirroring CRM modals
      const newActivityDetails = {
         searchId: activity.searchId, // Assuming searchId is on the initial activity prop
         activityType: activityDetails?.productInfo?.activityType || 'online',
         activityCode: activity.code,
         activityName: selectedOption.title || activity.title, // Prefer option title
         selectedTime: finalStartTime, 
         activityProvider: 'GRNC',
         endTime: finalEndTime, 
         timeSlot: finalTimeSlot, 
         isFlexibleTiming: false, // Assuming fixed time from selectedOption
         bookingStatus: 'pending', 
         departureTime: {
             time: finalStartTime,
             code: selectedOption?.ratekey || null // Use ratekey as code identifier
         },
         packageDetails: {
             amount: selectedOption.amount,
             currency: selectedOption.currency, 
             ratekey: selectedOption.ratekey,
             title: selectedOption.title,
             departureTime: selectedOption.departureTime, // Original departure time if needed
             description: selectedOption.description
         },
         // Include other relevant fields from productInfo
         duration: durationInMinutes,
         images: activityDetails?.productInfo?.images || [],
         description: activityDetails?.productInfo?.description || '',
         groupCode: activityDetails?.productInfo?.groupCode || activity.groupCode || selectedOption.code || null, // Try various sources for groupCode
         departurePoint: activityDetails?.productInfo?.departurePoint || null,
         inclusions: activityDetails?.productInfo?.inclusions || [],
         exclusions: activityDetails?.productInfo?.exclusions || [],
         additionalInfo: activityDetails?.productInfo?.additionalInfo || [],
         itinerary: activityDetails?.productInfo?.itinerary || null,
         bookingRequirements: activityDetails?.productInfo?.bookingRequirements || null,
         pickupHotellist: activityDetails?.productInfo?.PickupHotellist || null,
         bookingQuestions: activityDetails?.productInfo?.bookingQuestions || [],
         cancellationFromTourDate: activityDetails?.productInfo?.cancellationFromTourDate || [],
         tourGrade: activityDetails?.productInfo?.tourGrades?.find(tg => tg.encryptgradeCode === selectedOption.code) || activityDetails?.productInfo?.tourGrades?.[0] || null, // Try to find matching tour grade
         ageBands: activityDetails?.productInfo?.ageBands || [],
         // Optional: Add lat/long if needed, but often derived backend
         // lat: activity.lat || null, 
         // long: activity.long || null, 
         // price_difference: priceComparison?.priceDifference || 0, // Probably not needed in payload itself
      };

      const response = await fetch(
        `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify({
            cityName: activity.city,
            date: date,
            oldActivityCode: oldActivityCode || null,
            newActivityDetails
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to replace activity');
      }

      await dispatch(fetchItinerary({
        itineraryToken,
        inquiryToken: inquiryToken
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
    if (oldActivityCode) {
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
                  oldActivityCode ? 'Change Activity' : 'Add Activity'}
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