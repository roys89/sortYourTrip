const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class TransferCancelService {
    /**
     * Calls the LeAmigo API to cancel a transfer booking.
     * @param {object} params - The parameters for cancellation.
     * @param {string} params.booking_id - The provider's booking ID to cancel.
     * @param {string} [params.inquiryToken] - Optional inquiry token for logging.
     * @returns {Promise<object>} - Promise resolving to { success: boolean, message?: string, data?: any, error?: any }
     */
    static async cancelBooking(params) {
        const { booking_id, inquiryToken } = params;

        if (!booking_id) {
            console.error("TransferCancelService Error: Missing booking_id");
            return {
                success: false,
                message: "Booking ID is required for cancellation."
            };
        }

        const requestBody = {
            booking_id: booking_id
        };

        const config = {
            method: "post",
            url: "https://api.leamigo.com/agent/booking/cancel-booking",
            headers: {
                accept: "application/json",
                "X-API-KEY": process.env.LEAMIGO_API_KEY,
                "Content-Type": "application/json"
            },
            data: requestBody
        };

        const logData = {
            inquiryToken: inquiryToken || "transfer_cancel",
            bookingId: booking_id,
            apiType: "transfer_cancel",
            requestData: requestBody,
            responseData: null // Initialize
        };

        try {
            console.log(`[TransferCancelService] Attempting to cancel booking ID: ${booking_id}`);
            const response = await axios(config);
            logData.responseData = response.data;
            apiLogger.logApiData(logData);

            // Check LeAmigo's response structure for success
            // Assuming a similar structure to other endpoints
            if (response.data && response.data.status === true) { // Adjust based on actual success indicator
                console.log(`[TransferCancelService] Cancellation successful for booking ID: ${booking_id}`, response.data);
                return {
                    success: true,
                    message: response.data.message || "Booking cancelled successfully.",
                    data: response.data
                };
            } else {
                console.warn(`[TransferCancelService] Cancellation API call succeeded but operation failed for booking ID: ${booking_id}`, response.data);
                return {
                    success: false,
                    message: response.data?.message || "Failed to cancel booking with provider.",
                    data: response.data // Return data even on logical failure
                };
            }

        } catch (error) {
            console.error(`[TransferCancelService] Error cancelling booking ID: ${booking_id}`, error);
            logData.responseData = error.response?.data || error.message;
            logData.apiType = "transfer_cancel_error";
            apiLogger.logApiData(logData);

            return {
                success: false,
                message: error.response?.data?.message || error.message || "An error occurred during cancellation.",
                error: {
                    message: error.message,
                    details: error.response?.data
                }
            };
        }
    }
}

module.exports = TransferCancelService; 