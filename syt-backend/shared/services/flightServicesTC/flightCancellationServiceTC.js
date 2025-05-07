// Mock Flight Cancellation Service (TravClan)

exports.cancelBooking = async (supplierBookingRef, flightData) => {
    console.log(`[MockFlightCancelTC] Attempting cancellation for ref: ${supplierBookingRef}`);

    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay

    if (supplierBookingRef.includes("FAIL")) {
        console.warn(`[MockFlightCancelTC] Mock Failure for ref: ${supplierBookingRef}`);
        return { success: false, message: "Flight cancellation failed by provider.", refundAmount: 0 };
    } else {
        console.log(`[MockFlightCancelTC] Mock Success for ref: ${supplierBookingRef}`);
        // Simulate varying refund (mock 70% refund here)
        const basePrice = parseFloat(flightData?.details?.price?.totalFare?.grossAmount || 1000);
        const refundPercentage = 0.70; // 70% refund

        return {
            success: true,
            message: "Flight cancellation successful.",
            refundAmount: basePrice * refundPercentage // NET refund from supplier
        };
    }
}; 