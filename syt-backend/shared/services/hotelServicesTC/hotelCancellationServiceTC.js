// Mock Hotel Cancellation Service (TravClan)

exports.cancelBooking = async (supplierBookingRef, hotelData) => {
    console.log(`[MockHotelCancelTC] Attempting cancellation for ref: ${supplierBookingRef}`);

    await new Promise(resolve => setTimeout(resolve, 180)); // Simulate API delay

    if (supplierBookingRef.includes("FAIL")) {
        console.warn(`[MockHotelCancelTC] Mock Failure for ref: ${supplierBookingRef}`);
        return { success: false, message: "Hotel cancellation failed by provider.", refundAmount: 0 };
    } else {
        console.log(`[MockHotelCancelTC] Mock Success for ref: ${supplierBookingRef}`);
        // Simulate varying refund (mock 85% refund here)
        const basePrice = parseFloat(hotelData?.details?.price?.gross || 500);
        const refundPercentage = 0.85; // 85% refund

        return {
            success: true,
            message: "Hotel cancellation successful.",
            refundAmount: basePrice * refundPercentage // NET refund from supplier
        };
    }
}; 