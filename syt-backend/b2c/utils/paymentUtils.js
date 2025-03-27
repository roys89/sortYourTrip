// utils/paymentUtils.js
import crypto from 'crypto';

export const validatePaymentSignature = (orderId, paymentId, signature) => {
  const text = orderId + "|" + paymentId;
  const secret = process.env.RAZORPAY_SECRET;
  
  const generated_signature = crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");

  return generated_signature === signature;
};