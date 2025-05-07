// Mock Activity Cancellation Service (GRNconnect)

exports.cancelBooking = async (supplierBookingRef, activityData) => {
    console.log(`[MockActivityCancelGRNC] Attempting cancellation for ref: ${supplierBookingRef}`);

    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API delay

    // Example: Simulate failure based on booking ref or activity details
    if (supplierBookingRef.includes("FAIL")) {
        console.warn(`[MockActivityCancelGRNC] Mock Failure for ref: ${supplierBookingRef}`);
        return { success: false, message: "Activity cancellation failed by provider.", refundAmount: 0 };
    } else {
        console.log(`[MockActivityCancelGRNC] Mock Success for ref: ${supplierBookingRef}`);
        // Simulate varying refund based on policy (mock 90% refund here)
        const basePrice = parseFloat(activityData?.details?.totalPrice || 200);
        const refundPercentage = 0.90; // 90% refund

        return {
            success: true,
            message: "Activity cancellation successful.",
            refundAmount: basePrice * refundPercentage // NET refund from supplier
        };
    }
}; 