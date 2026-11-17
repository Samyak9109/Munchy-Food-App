import crypto from "crypto";
import config from "../config/config.js";
import {
  getPaymentByGatewayOrderIdDAO,
  updatePaymentStatusDAO,
} from "../dao/payment.dao.js";
import { getOrderByIdDAO, updateOrderStatusDAO } from "../dao/order.dao.js";
import { clearCartDAO } from "../dao/cart.dao.js";

/**
 * Razorpay webhook handler.
 * Verifies X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET.
 * Handles payment.captured (success) and payment.failed events.
 * Idempotent by payment ID — replays return 200 without side effects.
 *
 * NOTE: Must be mounted with express.raw({ type: "application/json" })
 * BEFORE express.json(), so the raw body is available for HMAC verification.
 */
export const handleRazorpayWebhook = async (req, res) => {
  const secret = config.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  const sigBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    if (event === "payment.captured" || event === "payment.authorized") {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.order_id; // Razorpay order ID

      // Find payment by gateway order ID
      const payment = await getPaymentByGatewayOrderIdDAO(orderId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Idempotent: already success
      if (payment.status === "success") {
        return res.status(200).json({ message: "Already processed" });
      }

      // Update payment to success
      await updatePaymentStatusDAO(payment._id, "success", {
        gatewayPaymentId: paymentId,
      });

      // Update order to placed and link payment
      const order = await getOrderByIdDAO(payment.order);
      if (order && order.status === "pending_payment") {
        await updateOrderStatusDAO(order._id, "placed", payment._id);
        await clearCartDAO(order.user);
      }

      return res.status(200).json({ message: "Payment captured" });
    }

    if (event === "payment.failed") {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.order_id;

      const payment = await getPaymentByGatewayOrderIdDAO(orderId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Idempotent
      if (payment.status === "failed") {
        return res.status(200).json({ message: "Already processed" });
      }

      await updatePaymentStatusDAO(payment._id, "failed", {
        gatewayPaymentId: paymentId,
      });

      // Order stays pending_payment — user can retry

      return res.status(200).json({ message: "Payment failed recorded" });
    }

    // Unknown event
    return res.status(200).json({ message: "Event ignored" });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    // Always return 200 so Razorpay doesn't retry endlessly
    return res.status(200).json({ message: "Webhook processed with error" });
  }
};