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

// --- NEW Function: Get Activity Product Info ---
const getActivityProductInfo = async (req, res) => {
    const { activityCode } = req.params;
    const inquiryToken = req.headers['x-inquiry-token'];
    const { 
        city, 
        date, 
    } = req.body;

    try {
        if (!activityCode || !city || !date) {
            return res.status(400).json({ 
                message: 'Missing required parameters. Need activityCode, city, and date' 
            });
        }


        
        const productInfo = await activityProductInfoService.checkProductInfo(
            activityCode,
            inquiryToken,
            city.name, // Assuming city object with name property
            date
        );

        if (!productInfo) {
            throw new Error('Failed to fetch product info');
        }

        res.json(productInfo);

    } catch (error) {
        console.error('Error fetching activity product info:', error);
        res.status(500).json({ 
            message: 'Failed to fetch activity product info',
            error: error.message 
        });
    }
};

// --- NEW Function: Get Activity Availability Detail ---
const getActivityAvailabilityDetail = async (req, res) => {
    const { activityCode } = req.params; // activityCode might still be useful context, keep it in params
    const inquiryToken = req.headers['x-inquiry-token'];
    const { 
        searchId, 
        modifiedGroupCode, // Expecting this from the frontend after getting product info
        city, 
        date
    } = req.body;

    try {
        if (!searchId || !modifiedGroupCode || !activityCode || !city || !date) { // Added activityCode check
            return res.status(400).json({ 
                message: 'Missing required parameters. Need searchId, modifiedGroupCode, activityCode, city, and date' 
            });
        }

        console.log(`Fetching availability detail for activityCode: ${activityCode}, searchId: ${searchId}, modifiedGroupCode: ${modifiedGroupCode}`);
        const availabilityDetails = await activityAvailabilityDetailService.checkAvailabilityDetail(
            searchId,
            activityCode,
            modifiedGroupCode,
            inquiryToken,
            city.name, // Assuming city object with name property
            date
        );

        res.json(availabilityDetails); // Send only availability details

    } catch (error) {
        console.error('Error fetching activity availability detail:', error);
        res.status(500).json({ 
            message: 'Failed to fetch activity availability detail',
            error: error.message 
        });
    }
};

module.exports = {
    searchAvailableActivitiesForChange,
    getActivityProductInfo,      // Add new export
    getActivityAvailabilityDetail // Add new export
}; 