const Itinerary = require('../../models/Itinerary');
// const TransferOrchestrationService = require('../../../shared/services/transferServicesLA/transferOrchestrationService');
const TransferGetQuotesService = require('../../../shared/services/transferServicesLA/transferGetQuotesService');
const TransferQuoteDetailsService = require('../../../shared/services/transferServicesLA/transferQuoteDetailsService');
// const apiLogger = require('../../../shared/helpers/apiLogger');

exports.updateTransfersForChange = async (req, res) => {
  const { itineraryToken } = req.params;
  const { 
    changeType,  // 'HOTEL_CHANGE' | 'FLIGHT_CHANGE'
    changeDetails 
  } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    // Find the itinerary
    const itinerary = await Itinerary.findOne({ 
      itineraryToken, 
      inquiryToken 
    });

    if (!itinerary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Itinerary not found' 
      });
    }

    // Validate change type
    if (!['HOTEL_CHANGE', 'FLIGHT_CHANGE'].includes(changeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid change type'
      });
    }

    // Prepare transfer update parameters
    const transferUpdateParams = {
      itinerary,
      changeType,
      changeDetails,
      inquiryToken
    };

    // Update transfers using Orchestration Service
    // const updatedTransfers = await TransferOrchestrationService.updateTransfersForChange(transferUpdateParams);
    // Placeholder response if service call is commented out:
    return res.status(501).json({ success: false, message: "Functionality disabled pending review of TransferOrchestrationService usage." });

    // Find and update the specific city and day transfers
    const { cityName, date } = changeDetails;
    const cityIndex = itinerary.cities.findIndex(city => city.city === cityName);
    const dayIndex = itinerary.cities[cityIndex].days.findIndex(day => day.date === date);

    if (cityIndex === -1 || dayIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City or day not found in itinerary'
      });
    }

    // Update transfers for the specific day
    itinerary.cities[cityIndex].days[dayIndex].transfers = updatedTransfers;

    // Add change to history
    itinerary.changeHistory.push({
      type: changeType,
      details: changeDetails
    });

    // Save the updated itinerary
    await itinerary.save();

    res.json({
      success: true,
      message: 'Transfers updated successfully',
      data: updatedTransfers
    });

  } catch (error) {
    console.error('Error updating transfers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update transfers',
      error: error.message 
    });
  }
};

exports.getTransferOptions = async (req, res) => {
  const { 
    originType,    // 'airport', 'hotel'
    destinationType, // 'airport', 'hotel'
    originLocation,
    destinationLocation,
    date,
    cityName
  } = req.query;
  
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    // Get itinerary first to access traveler details
    const itinerary = await Itinerary.findOne({ inquiryToken });
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Prepare transfer search parameters
    const transferSearchParams = {
      travelers: itinerary.travelersDetails,
      inquiryToken,
      preferences: itinerary.preferences || {},
      startDate: date,
      origin: {
        type: originType,
        ...JSON.parse(originLocation)
      },
      destination: {
        type: destinationType,
        ...JSON.parse(destinationLocation)
      }
    };

    // Get transfer options using the ground transfer service
    // const transferResult = await TransferOrchestrationService.getTransferOptions(transferSearchParams);
    // Placeholder response if service call is commented out:
    return res.status(501).json({ success: false, message: "Functionality disabled pending review of TransferOrchestrationService usage." });

    if (transferResult.type === "error") {
      throw new Error(transferResult.message);
    }

    res.json({
      success: true,
      data: transferResult
    });

  } catch (error) {
    console.error('Error fetching transfer options:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching transfer options',
      error: error.message
    });
  }
};

exports.revalidateTransfer = async (req, res) => {
  const { itineraryToken } = req.params;
  const { cityName, date, transferType } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    const itinerary = await Itinerary.findOne({
      itineraryToken,
      inquiryToken
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found'
      });
    }

    // Find the specific transfer
    const city = itinerary.cities.find(c => c.city === cityName);
    const day = city?.days.find(d => d.date === date);
    const transfer = day?.transfers?.find(t => t.type === transferType);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    // Revalidate transfer
    // const revalidatedTransfer = await TransferOrchestrationService.revalidateTransfer({ ... });
    // Placeholder response if service call is commented out:
    return res.status(501).json({ success: false, message: "Functionality disabled pending review of TransferOrchestrationService usage." });

    res.json({
      success: true,
      data: revalidatedTransfer,
      isValid: revalidatedTransfer.type !== "error"
    });

  } catch (error) {
    console.error('Error revalidating transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Error revalidating transfer',
      error: error.message
    });
  }
};

exports.searchTransferOptions = async (req, res) => {
    const {
        origin,       // { lat, long, display_address }
        destination,  // { lat, long, display_address }
        pickupDate,   // YYYY-MM-DD
        pickupTime    // HH:MM (24hr format)
    } = req.body;

    const inquiryToken = req.headers['x-inquiry-token'];

    try {
        if (!origin || !destination || !pickupDate || !pickupTime || !inquiryToken) {
            return res.status(400).json({ success: false, message: "Missing required parameters/headers (origin, destination, pickupDate, pickupTime, inquiryToken)." });
        }

        let travelerDetails = null;
        const itinerary = await Itinerary.findOne({ inquiryToken });
        if (itinerary && itinerary.travelersDetails) {
            travelerDetails = itinerary.travelersDetails;
        } else {
            console.warn(`Itinerary or traveler details not found for inquiry ${inquiryToken}. Proceeding without them.`);
        }

        const formattedPickupDateTime = `${pickupDate} ${pickupTime}:00.000`;

        const quoteParams = {
            origin: {
                lat: String(origin.lat),
                long: String(origin.long),
                display_address: origin.display_address
            },
            destination: {
                lat: String(destination.lat),
                long: String(destination.long),
                display_address: destination.display_address
            },
            pickupDate: formattedPickupDateTime,
            inquiryToken: inquiryToken,
            travelers: travelerDetails
        };

        const quotesResponse = await TransferGetQuotesService.getTransferQuotes(quoteParams);

        if (quotesResponse.success && quotesResponse.quotes) {
            res.json({
                success: true,
                data: quotesResponse.quotes
            });
        } else {
             res.status(404).json({
                success: false,
                message: quotesResponse.message || 'No transfer options found for the specified criteria.',
                error: quotesResponse.error
            });
        }

    } catch (error) {
        console.error('Error searching transfer options:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search transfer options',
            error: error.message
        });
    }
};

exports.getTransferQuoteDetails = async (req, res) => {
    const {
        quotationId,
        quoteId
    } = req.body;
    const inquiryToken = req.headers['x-inquiry-token'];

    try {
        if (!quotationId || !quoteId || !inquiryToken) {
             return res.status(400).json({ success: false, message: "Missing required parameters (quotationId, quoteId, inquiryToken in header)." });
        }

        const quoteDetailsResponse = await TransferQuoteDetailsService.getQuoteDetails(
            quotationId,
            quoteId,
            inquiryToken,
            null,
            null
        );

        if (quoteDetailsResponse.success && quoteDetailsResponse.data) {
            res.json({
                success: true,
                data: quoteDetailsResponse.data
            });
        } else {
             res.status(404).json({
                success: false,
                message: quoteDetailsResponse.message || 'Failed to retrieve quote details.',
                error: quoteDetailsResponse.error
            });
        }

    } catch (error) {
        console.error('Error fetching transfer quote details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transfer quote details',
            error: error.message
        });
    }
};