// controllers/itineraryController/transferChangeController.js
const Itinerary = require('../../models/Itinerary');
const TransferOrchestrationService = require('../../services/transferServices/transferOrchestrationService');
const apiLogger = require('../../helpers/apiLogger');

exports.updateTransfersForChange = async (req, res) => {
  const { itineraryToken } = req.params;
  const { 
    changeType,  // 'HOTEL_CHANGE' | 'FLIGHT_CHANGE'
    changeDetails 
  } = req.body;
  const inquiryToken = req.headers['x-inquiry-token'];

  try {
    // Log the transfer update request
    apiLogger.logApiData({
      inquiryToken,
      apiType: 'update-transfers',
      requestData: { changeType, changeDetails }
    });

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
    const updatedTransfers = await TransferOrchestrationService.updateTransfersForChange(transferUpdateParams);

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

    // Save the updated itinerary
    await itinerary.save();

    // Log successful transfer update
    apiLogger.logApiData({
      inquiryToken,
      apiType: 'update-transfers-success',
      responseData: { 
        cityName, 
        date, 
        transfersUpdated: updatedTransfers.length 
      }
    });

    res.json({
      success: true,
      message: 'Transfers updated successfully',
      data: updatedTransfers
    });

  } catch (error) {
    // Log error
    apiLogger.logApiData({
      inquiryToken,
      apiType: 'update-transfers-error',
      error: error.message
    });

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
    // Log API request
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'get-transfer-options',
      requestData: {
        originType,
        destinationType,
        originLocation,
        destinationLocation
      }
    });

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
    const transferResult = await TransferOrchestrationService.getTransferOptions(transferSearchParams);

    if (transferResult.type === "error") {
      throw new Error(transferResult.message);
    }

    // Log success
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'get-transfer-options-success',
      responseData: transferResult
    });

    res.json({
      success: true,
      data: transferResult
    });

  } catch (error) {
    console.error('Error fetching transfer options:', error);
    apiLogger.logApiData({
      inquiryToken,
      cityName,
      date,
      apiType: 'get-transfer-options-error',
      error: error.message
    });
    
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
    const revalidatedTransfer = await TransferOrchestrationService.revalidateTransfer({
      travelers: itinerary.travelersDetails,
      inquiryToken,
      preferences: itinerary.preferences,
      startDate: date,
      origin: transfer.details.origin,
      destination: transfer.details.destination
    });

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