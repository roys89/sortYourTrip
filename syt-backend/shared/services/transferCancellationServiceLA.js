// Mock Transfer Cancellation Service (LuxuryAirport)

exports.cancelBooking = async (supplierBookingRef, transferData) => {
    console.log(`[MockTransferCancelLA] Attempting cancellation for ref: ${supplierBookingRef}`);

    await new Promise(resolve => setTimeout(resolve, 120));

    if (supplierBookingRef.includes("FAIL")) {
        console.warn(`[MockTransferCancelLA] Mock Failure for ref: ${supplierBookingRef}`);
        return { success: false, message: "Transfer cancellation failed by provider.", refundAmount: 0 };
    } else {
        console.log(`[MockTransferCancelLA] Mock Success for ref: ${supplierBookingRef}`);
        // Transfers often have stricter policies closer to date, but mock 100% for now
        const basePrice = parseFloat(transferData?.details?.selectedQuote?.quote?.fare || 100);
        const refundPercentage = 1.0; // 100% refund
        return {
            success: true,
            message: "Transfer cancellation successful.",
            refundAmount: basePrice * refundPercentage // NET refund from supplier
        };
    }
}; 