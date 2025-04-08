const ActivityDestination = require('../../../shared/models/itineraryModel/ActivityDestination');
const activityAvailabilityService = require('../../../shared/services/activityServicesGRNC/activityAvailabilityService');
const activityProductInfoService = require('../../../shared/services/activityServicesGRNC/activityProductInfoService');
const activityAvailabilityDetailService = require('../../../shared/services/activityServicesGRNC/activityAvailabilityDetailService');

// Helper to transform frontend traveler details to service format
const formatTravelers = (travelersDetails) => {
    if (!travelersDetails || !travelersDetails.rooms) {
        throw new Error('Invalid travelersDetails structure');
    }
    let adults = [];
    let childAges = [];
    travelersDetails.rooms.forEach(room => {
        if (room.adults) adults.push(...room.adults.map(() => ({}))); // Service expects array of objects, age not needed here
        if (room.children) childAges.push(...room.children.map(age => parseInt(age)));
    });
    return { adults, childAges };
};

const searchAvailableActivitiesForChange = async (req, res) => {
    const { inquiryToken } = req.params;
    const { cityName, countryName, date, travelersDetails, oldActivityCode } = req.body;
    const userToken = req.headers['authorization']?.split(' ')[1];

    // Basic validation
    if (!cityName || !countryName || !date || !travelersDetails) {
        return res.status(400).json({ message: "Missing required parameters: cityName, countryName, date, travelersDetails" });
    }
    if (!inquiryToken) {
        return res.status(400).json({ message: "Missing inquiryToken in request path" });
    }

    try {
        // 1. Find Destination Code
        console.log(`Searching destination code for City: ${cityName}, Country: ${countryName}`);
        const destination = await ActivityDestination.findOne({
            name: { $regex: new RegExp(`^${cityName}$`, 'i') },
            country: { $regex: new RegExp(`^${countryName}$`, 'i') }
        }).lean();

        if (!destination || !destination.destination_code) {
            console.error(`Destination code not found for City: ${cityName}, Country: ${countryName}`);
            return res.status(404).json({ message: `Destination information not found for ${cityName}, ${countryName}` });
        }
        console.log(`Found destination code: ${destination.destination_code}`);

        // 2. Format Travelers
        const formattedTravelers = formatTravelers(travelersDetails);

        // 3. Call Availability Service
        const cityInfoForService = {
            code: destination.destination_code,
            name: destination.name
        };

        console.log(`Calling activityAvailabilityService for ${cityInfoForService.name} on ${date}`);
        const availabilityResponse = await activityAvailabilityService.checkActivityAvailability(
            cityInfoForService,
            date,
            formattedTravelers,
            inquiryToken
        );

        if (!availabilityResponse) {
            console.error(`No availability response from service for ${cityInfoForService.name} on ${date}`);
            return res.status(404).json({ message: `Could not retrieve activity availability for ${cityName} on ${date}.` });
        }

        console.log(`Received availability response for ${cityInfoForService.name} on ${date}`);
        
        // 4. Process and Return Response
        res.json(availabilityResponse);

    } catch (error) {
        console.error('Error searching available activities for change:', error);
        res.status(500).json({ message: 'Failed to search for activities', error: error.message });
    }
};

// New getActivityDetails function that uses direct service calls
const getActivityDetails = async (req, res) => {
    const { activityCode } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];
    const { 
        city, 
        date, 
        travelersDetails,
        searchId,     // Now required from frontend
        groupCode     // Now required from frontend
    } = req.body;

    try {
        // Validate required parameters
        if (!activityCode || !searchId || !groupCode || !travelersDetails) {
            return res.status(400).json({ 
                message: 'Missing required parameters. Need activityCode, searchId, groupCode, and travelersDetails' 
            });
        }

        // Format travelers data
        const formattedTravelers = formatTravelers(travelersDetails);

        // Get product info directly using the service
        const productInfo = await activityProductInfoService.checkProductInfo(
            activityCode,
            formattedTravelers,
            groupCode,
            searchId,
            inquiryToken,
            city.name,
            date
        );

        if (!productInfo) {
            throw new Error('Failed to fetch product info');
        }

        // Get availability details using the service
        const availabilityDetails = await activityAvailabilityDetailService.checkAvailabilityDetail(
            searchId,
            activityCode,
            productInfo.modifiedGroupCode,
            inquiryToken,
            city.name,
            date
        );

        // Return combined response
        res.json({
            productInfo,
            availabilityDetails
        });

    } catch (error) {
        console.error('Error fetching activity details:', error);
        res.status(500).json({ 
            message: 'Failed to fetch activity details',
            error: error.message 
        });
    }
};

module.exports = {
    searchAvailableActivitiesForChange,
    getActivityDetails
}; 