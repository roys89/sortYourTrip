// Mock Refund Service (e.g., Razorpay)

exports.initiateRefund = async (paymentId, amount, notes) => {
    console.log(`[MockRefundService] Attempting refund for payment: ${paymentId}, Amount: ${amount}`);
    console.log(`[MockRefundService] Notes: ${JSON.stringify(notes)}`);

    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay

    if (amount <= 0) {
        console.warn(`[MockRefundService] Refund amount must be positive. Amount: ${amount}`);
        return { success: false, message: "Refund amount must be positive.", refundId: null };
    }

    // Simulate potential refund failure
    if (paymentId.includes("FAIL_REFUND")) {
        console.error(`[MockRefundService] Mock Refund Failure for payment: ${paymentId}`);
        return { success: false, message: "Refund processing failed.", refundId: null };
    }

    const mockRefundId = `ref_${Date.now()}`;
    console.log(`[MockRefundService] Mock Refund Success for payment: ${paymentId}. Refund ID: ${mockRefundId}`);
    return { success: true, message: "Refund initiated successfully.", refundId: mockRefundId };
}; 