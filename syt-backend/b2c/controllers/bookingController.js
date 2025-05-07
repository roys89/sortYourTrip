const cancellationService = require('../services/cancellationService');

// Controller function to handle cancellation quote requests
exports.getCancellationQuote = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const options = req.body; // Contains info like specific items or cancelAll: true

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'Booking ID is required.' });
        }

        // Call the cancellation service to generate the quote
        const result = await cancellationService.generateQuote(bookingId, options);

        if (result.success) {
            res.status(200).json(result); // Send back { success: true, quote: {...} }
        } else {
            res.status(400).json(result); // Send back { success: false, message: ..., error: ... }
        }

    } catch (error) {
        console.error('[BookingController] Error in getCancellationQuote:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while generating cancellation quote.',
            error: error.message 
        });
    }
};

// Controller function to handle cancellation execution (Phase 4)
exports.executeCancellation = async (req, res) => {
    try {
        const { bookingId } = req.params;
        // itemsToCancel should be an array of item IDs (e.g., ["flight-ABC123", "hotel-XYZ789"]) 
        // sent from the frontend after user confirmation.
        const { itemsToCancel } = req.body; 

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'Booking ID is required.' });
        }
        if (!itemsToCancel || !Array.isArray(itemsToCancel) || itemsToCancel.length === 0) {
            return res.status(400).json({ success: false, message: 'List of items to cancel is required.' });
        }

        console.log(`[BookingController] Received executeCancellation request for booking ${bookingId}, items:`, itemsToCancel);

        // Call the cancellation service to execute the cancellation
        const result = await cancellationService.executeCancellation(bookingId, itemsToCancel);

         // The service function now returns a detailed result object
         if (result.success) {
            // Even if some items failed, if the overall process didn't hit a fatal error,
            // we might return 200 but the payload indicates partial success/failures.
            res.status(200).json(result);
        } else {
             // Use a different status code for clear failures (e.g., DB update fail, unhandled exception)
             // For partial success/supplier failures, we might still use 200 or a 4xx like 422 (Unprocessable Entity)
            const statusCode = (result.dbUpdateStatus === 'Failed' || result.message.includes('Unhandled')) ? 500 : 422;
            res.status(statusCode).json(result); 
        }

    } catch (error) {
        console.error('[BookingController] Error in executeCancellation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during cancellation execution.',
            error: error.message 
        });
    }
}; 