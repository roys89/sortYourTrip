const Itinerary = require('../../models/Itinerary');
const apiLogger = require('../../helpers/apiLogger');

exports.replaceHotel = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, oldHotelCode, newHotelDetails } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) {
      return res.status(404).json({ message: 'City not found in itinerary' });
    }

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(
      day => day.date === date
    );
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Day not found in itinerary' });
    }

    const rateComments = newHotelDetails.rate?.rate_comments || {};
    const cancellationPolicy = newHotelDetails.rate?.cancellation_policy || {
      amount_type: "value",
      no_show_fee: {
        amount_type: "value",
        currency: newHotelDetails.rate?.currency,
        flat_fee: newHotelDetails.rate?.price
      },
      under_cancellation: false,
      message: "Not cancelable"
    };

    // Format hotel details to match initial structure
    const formattedHotelDetails = {
      ...newHotelDetails,
      images: Array.isArray(newHotelDetails.images) ? 
        newHotelDetails.images : 
        [{
          url: newHotelDetails.images?.url || null,
          variants: [{
            url: newHotelDetails.images?.url || null
          }]
        }],
      rate: {
        ...newHotelDetails.rate,
        rate_comments: {
          checkin_begin_time: rateComments.checkin_begin_time || "2:00 PM",
          checkin_end_time: rateComments.checkin_end_time || "midnight",
          checkout_time: rateComments.checkout_time || "12:00 PM",
          comments: rateComments.comments || "",
          fee_comments: rateComments.fee_comments || "",
          mealplan: rateComments.mealplan || "",
          pax_comments: rateComments.pax_comments || "",
          remarks: rateComments.remarks || ""
        },
        price_details: {
          GST: newHotelDetails.rate?.price_details?.GST || [],
          net: newHotelDetails.rate?.price_details?.net || [],
          surcharge_or_tax: newHotelDetails.rate?.price_details?.surcharge_or_tax || []
        },
        other_inclusions: newHotelDetails.rate?.other_inclusions || [],
        promotions_details: newHotelDetails.rate?.has_promotions ? 
          newHotelDetails.rate.promotions_details : undefined,
        cancellation_policy: cancellationPolicy
      },
      hotel_details: {
        ...newHotelDetails.hotel_details,
        facilities: Array.isArray(newHotelDetails.hotel_details?.facilities) ?
          newHotelDetails.hotel_details.facilities :
          (newHotelDetails.hotel_details?.facilities || '').split(';').map(f => f.trim()),
        cancellation_policy: cancellationPolicy,
        checkin_end_time: rateComments.checkin_end_time || "midnight",
        checkin_begin_time: rateComments.checkin_begin_time || "2:00 PM",
        checkout_time: rateComments.checkout_time || "12:00 PM",
        hotel_charges: newHotelDetails.rate?.price_details?.surcharge_or_tax || []
      }
    };

    // Replace the hotel
    itinerary.cities[cityIndex].days[dayIndex].hotels = [formattedHotelDetails];

    await itinerary.save();
    res.json(itinerary);
  } catch (error) {
    console.error('Error replacing hotel:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.replaceActivity = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, oldActivityCode, newActivityDetails } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) {
      return res.status(404).json({ message: 'City not found in itinerary' });
    }

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(
      day => day.date === date
    );
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Day not found in itinerary' });
    }

    const activities = itinerary.cities[cityIndex].days[dayIndex].activities;

    if (oldActivityCode) {
      // Replace existing activity
      const activityIndex = activities.findIndex(activity => 
        activity.activityCode === oldActivityCode
      );
      if (activityIndex === -1) {
        return res.status(404).json({ message: 'Activity not found' });
      }
      activities[activityIndex] = newActivityDetails;
    } else {
      // Add new activity
      if (activities.length >= 3) {
        return res.status(400).json({ message: 'Maximum of 3 activities allowed per day' });
      }
      activities.push(newActivityDetails);
    }

    // Save the updated itinerary
    await itinerary.save();
    res.json(itinerary);
  } catch (error) {
    console.error('Error modifying activity:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: oldActivityCode ? 'replace-activity-error' : 'add-activity-error',
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
};

exports.removeActivity = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, activityCode } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-activity-request',
      requestData: { 
        itineraryToken, 
        activityCode 
      }
    });

    const itinerary = await Itinerary.findOne({ 
      itineraryToken,
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    if (cityIndex === -1) {
      return res.status(404).json({ message: 'City not found in itinerary' });
    }

    const dayIndex = itinerary.cities[cityIndex].days.findIndex(
      day => day.date === date
    );
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Day not found in itinerary' });
    }

    const activities = itinerary.cities[cityIndex].days[dayIndex].activities;
    const activityIndex = activities.findIndex(activity => 
      activity.activityCode === activityCode
    );

    if (activityIndex === -1) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Remove the activity
    activities.splice(activityIndex, 1);

    // Save the updated itinerary
    await itinerary.save();

    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-activity-success',
      responseData: { message: 'Activity removed successfully' }
    });

    res.json(itinerary);
  } catch (error) {
    console.error('Error removing activity:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'remove-activity-error',
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
};


