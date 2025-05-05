const axios = require('axios');
const apiLogger = require('../../helpers/apiLogger');

class TransferCancellationDetailsService {
    /**
     * Calls the LeAmigo API to get booking details (for cancellation info).
     * @param {object} params - { booking_id, inquiryToken }
     * @returns {Promise<object>} - { success, data, error }
     */
    static async getProviderBookingDetails(params) {
        const { booking_id, inquiryToken } = params;
        if (!booking_id) {
            console.error("TransferCancellationDetailsService Error: Missing booking_id");
            return { success: false, message: "Provider Booking ID is required." };
        }
        const config = {
            method: "post",
            url: "https://api.leamigo.com/agent/booking/get-booking",
            headers: {
                accept: "application/json",
                "X-API-KEY": process.env.LEAMIGO_API_KEY,
                "Content-Type": "application/json"
            },
            data: { booking_id }
        };
        const logData = {
            inquiryToken: inquiryToken || "transfer_cancel_details",
            bookingId: booking_id,
            apiType: "transfer_get_booking",
            requestData: { booking_id },
            responseData: null
        };
        try {
            const response = await axios(config);
            logData.responseData = response.data;
            apiLogger.logApiData(logData);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            logData.responseData = error.response?.data || error.message;
            logData.apiType = "transfer_get_booking_error";
            apiLogger.logApiData(logData);
            return {
                success: false,
                message: error.response?.data?.message || error.message || "An error occurred while fetching provider booking details.",
                error: error
            };
        }
    }
}

module.exports = TransferCancellationDetailsService; 