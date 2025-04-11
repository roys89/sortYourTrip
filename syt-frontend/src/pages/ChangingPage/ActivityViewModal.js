import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, Card, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, TextField, Typography } from '@mui/material';
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

// --- ADD categorizeTravelers Helper Function (Adapted for Customer Frontend) ---
const categorizeTravelers = (travelerAgesObject, apiAgeBands) => {
  // Convert travelersDetails format to simple age array
  const ages = [];
  if (travelerAgesObject?.rooms?.[0]?.adults) {
    // Need a representative age for adults based on bands
    const adultBand = apiAgeBands?.find(b => b.ageBand === 'ADULT');
    const representativeAdultAge = adultBand ? adultBand.startAge : 30; // Default 30 if no ADULT band
    ages.push(...Array(travelerAgesObject.rooms[0].adults.length).fill(representativeAdultAge));
  }
  if (travelerAgesObject?.rooms?.[0]?.children) {
    ages.push(...travelerAgesObject.rooms[0].children.map(age => parseInt(age)));
  }
  // Handle potential top-level adult/child counts if rooms are not structured
  else if (travelerAgesObject?.adults || travelerAgesObject?.children) {
     const adultBand = apiAgeBands?.find(b => b.ageBand === 'ADULT');
     const representativeAdultAge = adultBand ? adultBand.startAge : 30;
     ages.push(...Array(travelerAgesObject.adults || 0).fill(representativeAdultAge));
     // Assuming children means age < adultBand start age (or a default like 12)
     const childCutoff = adultBand ? adultBand.startAge : 12;
     // Need a representative age for children too, perhaps midpoint of CHILD band or default?
     const childBand = apiAgeBands?.find(b => b.ageBand === 'CHILD');
     const representativeChildAge = childBand ? Math.floor((childBand.startAge + childBand.endAge) / 2) : 6;
     ages.push(...Array(travelerAgesObject.children || 0).fill(representativeChildAge));
  }

  const counts = { ADULT: 0, CHILD: 0, INFANT: 0, SENIOR: 0, YOUTH: 0 };
  const defaultBand = 'ADULT';
  const validAgeBands = Array.isArray(apiAgeBands) ? apiAgeBands : [];

  if (validAgeBands.length === 0) {
    console.warn('categorizeTravelers (Customer View Modal): No valid ageBands provided, using default counts.');
    counts[defaultBand] = ages.length;
  } else {
    ages.forEach(age => {
      let matched = false;
      for (const band of validAgeBands) {
        if (band && typeof band.startAge === 'number' && typeof band.endAge === 'number' && band.ageBand &&
            age >= band.startAge && age <= band.endAge) {
          if (counts.hasOwnProperty(band.ageBand)) {
            counts[band.ageBand]++;
            matched = true;
            break;
          } else {
            console.warn(`categorizeTravelers (Customer View Modal): Unknown ageBand type '${band.ageBand}' found.`);
          }
        }
      }
      if (!matched) {
        counts[defaultBand]++;
        console.warn(`categorizeTravelers (Customer View Modal): Age ${age} did not fit any defined band, assigned to ${defaultBand}.`);
      }
    });
  }

  const groupCodeString = `${counts.ADULT}|${counts.CHILD}|${counts.INFANT}|${counts.SENIOR}|${counts.YOUTH}`;

  return {
    groupCode: groupCodeString // Only need the string for modifiedGroupCode construction
  };
};
// --- END categorizeTravelers ---

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
  const [productInfoData, setProductInfoData] = useState(null);
  const [availableOptions, setAvailableOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productInfoLoading, setProductInfoLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [priceComparison, setPriceComparison] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const { itineraryToken } = useSelector((state) => state.itinerary);
  const [manualStartTime, setManualStartTime] = useState('');
  const [bookingStatus, setBookingStatus] = useState({
    loading: false,
    error: null,
    success: false,
    message: ''
  });
  
  const fetchProductInfo = useCallback(async () => {
    if (!activity?.code || !activity?.searchId || !inquiryToken || !city || !date) {
      console.error("Customer View Modal: Missing data for fetching product info:", { activity, inquiryToken, city, date });
      setError("Internal error: Missing required data to fetch product info.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setProductInfoLoading(true);
    setError(null);
    setProductInfoData(null);
    setAvailableOptions([]);
    setSelectedOption(null);
    setAvailabilityError(null);
    setPriceComparison(null);
    setBookingStatus({ loading: false, error: null, success: false, message: '' });
    setManualStartTime('');

    try {
      console.log(`Customer View Modal: Fetching product info for activity code: ${activity.code}`);
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
            searchId: activity.searchId,
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch activity product info (${response.status})`);
      }

      const data = await response.json();
      console.log("Customer View Modal: Fetched activity product info:", data);

      if (!data || !data.title || !data.productCode) {
        throw new Error("Invalid product info structure received (missing title or productCode).");
      }
      setProductInfoData(data); 
      fetchAvailabilityDetails(data);

    } catch (err) {
      console.error("Customer View Modal: Error fetching product info:", err);
      setError(err.message);
      setLoading(false);
      setProductInfoLoading(false);
    } 
    finally {
      setProductInfoLoading(false); 
    }
  }, [activity, inquiryToken, city, date]);

  const fetchAvailabilityDetails = useCallback(async (fetchedProductInfo) => {
    if (!fetchedProductInfo || !travelersDetails || !activity?.groupCode || !activity?.searchId || !city || !date) {
      console.error("Customer View Modal: Missing data for fetching availability details:", {
        fetchedProductInfo, travelersDetails, activity, city, date
      });
      setAvailabilityError("Internal error: Cannot fetch options.");
      setLoading(false);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setAvailableOptions([]); 
    setSelectedOption(null); 

    try {
      const baseGroupCode = activity.groupCode.split('-')[0];
      if (!baseGroupCode) {
        throw new Error("Could not determine base group code from selected activity.");
      }
      const { groupCode: ageDistribution } = categorizeTravelers(travelersDetails, fetchedProductInfo.ageBands);
      const calculatedModifiedGroupCode = `${baseGroupCode}-${ageDistribution}`;
      console.log(`Customer View Modal: Calculated modifiedGroupCode for availability: ${calculatedModifiedGroupCode}`);

      console.log(`Customer View Modal: Fetching availability details using searchId ${activity.searchId} and modifiedGroupCode ${calculatedModifiedGroupCode}`);
      const availabilityResponse = await fetch(
        `http://localhost:5000/api/itinerary/availability-detail/${activity.code}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify({
            searchId: activity.searchId,
            modifiedGroupCode: calculatedModifiedGroupCode,
            city: { name: city },
            date: date,
          })
        }
      );

      if (!availabilityResponse.ok) {
        const errorData = await availabilityResponse.json().catch(() => ({ message: availabilityResponse.statusText }));
        throw new Error(errorData.message || `Failed to fetch availability details (${availabilityResponse.status})`);
      }

      const data = await availabilityResponse.json();
      console.log("Customer View Modal: Fetched availability details (options):", data);

      if (!Array.isArray(data)) {
        throw new Error("Invalid response structure received for availability details.");
      }

      if (data.length === 0) {
        setAvailabilityError("No options found for the current travelers and selected activity.");
      } else {
        setAvailableOptions(data);
        if (data.length === 1) {
          handleOptionSelect(data[0]);
        }
      }

    } catch (err) {
      console.error("Customer View Modal: Error fetching availability details:", err);
      setAvailabilityError(err.message);
    } finally {
      setAvailabilityLoading(false);
      setLoading(false);
    }
  }, [activity, inquiryToken, city, date, travelersDetails]);

  useEffect(() => {
    if (open) {
      fetchProductInfo();
    }
    if (!open) {
      setProductInfoData(null);
      setAvailableOptions([]);
      setSelectedOption(null);
      setError(null);
      setLoading(true);
      setProductInfoLoading(false);
      setAvailabilityLoading(false);
      setManualStartTime('');
      setPriceComparison(null);
      setBookingStatus({ loading: false, error: null, success: false, message: '' });
    }
  }, [open, fetchProductInfo]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    
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
      setBookingStatus({ loading: true, error: null, success: false, message: 'Changing activity...' }); 
      setError(null);
      setConfirmationOpen(false);

      let finalStartTime = null;
      const hasDepartureTime = selectedOption.departureTime && validateAndNormalizeTime(selectedOption.departureTime);

      if (hasDepartureTime) {
        finalStartTime = selectedOption.departureTime;
        console.log(`Customer View Modal: Using provided departure time: ${finalStartTime}`);
      } else {
        finalStartTime = validateAndNormalizeTime(manualStartTime);
        console.log(`Customer View Modal: Using manual start time: ${finalStartTime}`);
        if (!finalStartTime) {
          setBookingStatus({ loading: false, success: false, error: true, message: 'Please enter a valid start time (HH:MM).' });
          return;
        }
      }

      if (!finalStartTime) {
         setError('Selected option does not have a valid departure time.');
         setBookingStatus({ loading: false, success: false, error: true, message: 'Selected option does not have a valid departure time.' });
         return;
      }

      const durationInMinutes = parseDurationToMinutes(productInfoData?.duration);
      console.log(`Customer View Modal: Parsed duration '${productInfoData?.duration}' to ${durationInMinutes} minutes.`);
      if (durationInMinutes === null) {
          setError('Could not determine activity duration.');
          setBookingStatus({ loading: false, success: false, error: true, message: 'Could not determine activity duration.' });
          return;
       }

      const finalEndTime = calculateEndTime(finalStartTime, durationInMinutes);
      const finalTimeSlot = getTimeSlot(finalStartTime);
      console.log(`Customer View Modal: Calculated End Time: ${finalEndTime}, Time Slot: ${finalTimeSlot}`);

      const baseGroupCode = activity?.groupCode?.split('-')[0];
      if (!baseGroupCode) {
        setBookingStatus({ loading: false, success: false, error: true, message: 'Could not determine base group code.'});
        return;
      }
      const { groupCode: ageDistribution } = categorizeTravelers(travelersDetails, productInfoData.ageBands);
      const finalModifiedGroupCode = `${baseGroupCode}-${ageDistribution}`;
      console.log(`Customer View Modal: Final modifiedGroupCode for change request: ${finalModifiedGroupCode}`);

      const newActivityDetails = {
         searchId: activity.searchId,
         activityType: productInfoData?.activityType || 'online',
         activityCode: activity.code,
         activityName: selectedOption.title || activity.title,
         selectedTime: finalStartTime, 
         activityProvider: 'GRNC',
         endTime: finalEndTime, 
         timeSlot: finalTimeSlot, 
         isFlexibleTiming: !hasDepartureTime,
         bookingStatus: 'pending', 
         departureTime: {
             time: finalStartTime,
             code: selectedOption?.code
         },
         packageDetails: {
             amount: selectedOption.amount,
             currency: selectedOption.currency, 
             ratekey: selectedOption.ratekey,
             title: selectedOption.title,
             departureTime: selectedOption.departureTime,
             description: selectedOption.description
         },
         duration: durationInMinutes,
         images: productInfoData?.images || (activity.imgURL ? [{variants:[{url: activity.imgURL}]}] : []),
         description: productInfoData?.description || activity.description || '',
         groupCode: finalModifiedGroupCode,
         departurePoint: productInfoData?.departurePoint || null,
         inclusions: productInfoData?.inclusions || [],
         exclusions: productInfoData?.exclusions || [],
         additionalInfo: productInfoData?.additionalInfo || [],
         itinerary: productInfoData?.itinerary || null,
         bookingRequirements: productInfoData?.bookingRequirements || null,
         pickupHotellist: productInfoData?.PickupHotellist || null,
         bookingQuestions: productInfoData?.bookingQuestions || [],
         cancellationFromTourDate: productInfoData?.cancellationFromTourDate || [],
         tourGrade: productInfoData?.tourGrades?.find(tg => tg.encryptgradeCode === selectedOption.code) || null,
         ageBands: productInfoData?.ageBands || [],
      };

      const requestBody = {
        cityName: city,
        date: date,
        oldActivityCode: oldActivityCode || null,
        newActivityDetails: newActivityDetails,
        travelersDetails: travelersDetails
      };

      console.log("Customer View Modal: Submitting POST /activity request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-Inquiry-Token': inquiryToken,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to replace activity (${response.status})`);
      }

      setBookingStatus({ loading: false, success: true, error: null, message: 'Activity changed successfully!' });

      await dispatch(fetchItinerary({
        itineraryToken,
        inquiryToken: inquiryToken
      })).unwrap();

      dispatch(closeChangeModal());
      setTimeout(onClose, 1500);

    } catch (err) {
       setError(err.message);
       setBookingStatus({ loading: false, success: false, error: true, message: err.message || "An unknown error occurred." });
    } finally {
    }
  };

  const handleAddActivity = async () => {
    if (!selectedOption) {
      setError('Please select an option first');
      return;
    }

    if (oldActivityCode) {
      setConfirmationOpen(true);
      return;
    }

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
        {loading || productInfoLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Stack spacing={3}>
            {productInfoData?.images && productInfoData.images.length > 0 && (
              <Box sx={{ overflow: 'auto' }}>
                <Stack direction="row" spacing={2}>
                  {productInfoData.images.map((image, index) => (
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

            <Box>
              <Typography variant="h6" gutterBottom>Available Options</Typography>
              {availabilityLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 1 }}>Loading options...</Typography>
                </Box>
              ) : availabilityError ? (
                <Alert severity="warning" sx={{ mt: 1 }}>{availabilityError}</Alert>
              ) : (
                <Stack spacing={2}>
                  {availableOptions.length > 0 ? availableOptions.map((option) => (
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
                  ))
                  : (
                    <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      No specific options available for the selected travelers.
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>

            <Divider />

            {productInfoData?.description && (
              <Typography variant="body1">
                {productInfoData.description}
              </Typography>
            )}

            {productInfoData?.inclusions?.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Inclusions</Typography>
                <ul>
                  {productInfoData.inclusions.map((inclusion, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        {inclusion.otherDescription}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            {productInfoData?.exclusions?.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Exclusions</Typography>
                <ul>
                  {productInfoData.exclusions.map((exclusion, index) => (
                    <li key={index}>
                      <Typography variant="body2">
                        {exclusion.otherDescription || exclusion.typeDescription}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            {selectedOption && !selectedOption.departureTime && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Select Start Time</Typography>
                <TextField
                  type="time"
                  fullWidth
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                  sx={{ mt: 1 }}
                  helperText="This option has flexible timing. Please select a start time."
                />
              </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={bookingStatus.loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddActivity}
                disabled={bookingStatus.loading || !selectedOption || (!selectedOption.departureTime && !validateAndNormalizeTime(manualStartTime)) || bookingStatus.success}
              >
                {bookingStatus.loading ? <CircularProgress size={24} /> : 
                  oldActivityCode ? 'Confirm Change' : 'Add Activity'}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      {bookingStatus.message && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Alert 
            severity={bookingStatus.success ? 'success' : bookingStatus.error ? 'error' : 'info'}
            icon={bookingStatus.loading ? <CircularProgress size={20} /> : undefined}
          >
            {bookingStatus.message}
          </Alert>
        </Box>
      )}

      {confirmationOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-bold mb-4">Confirm Activity Change</h3>
            
            {priceComparison && (
              <div className="space-y-3 mb-6">
                <p>Current Activity Price: {priceComparison.currency} {priceComparison.existingPrice.toLocaleString()}</p>
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
                disabled={bookingStatus.loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {bookingStatus.loading ? 
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