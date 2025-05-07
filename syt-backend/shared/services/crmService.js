// Mock CRM Logging Service

exports.logCancellationEvent = async (bookingId, eventDetails) => {
    console.log(`[MockCRMService] Logging cancellation event for Booking ID: ${bookingId}`);
    console.log(`[MockCRMService] Event Details: ${JSON.stringify(eventDetails, null, 2)}`);

    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate quick logging

    // Simulate logging failure possibility
    if (bookingId.includes("FAIL_CRM")) {
        console.error(`[MockCRMService] Failed to log cancellation event for Booking ID: ${bookingId}`);
        return { success: false, message: "Failed to log event to CRM." };
    }

    console.log(`[MockCRMService] Successfully logged cancellation event for Booking ID: ${bookingId}`);
    return { success: true, message: "Event logged successfully." };
}; 