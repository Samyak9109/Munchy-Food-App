import Razorpay from "razorpay";
import crypto from "crypto";
import config from "../config/config.js";
import {
  createPaymentDAO,
  getPaymentByIdDAO,
  getPaymentByOrderDAO,
  getPaymentsByUserDAO,
  updatePaymentStatusDAO,
} from "../dao/payment.dao.js";
import {
  getOrderByIdDAO,
  updateOrderStatusDAO,
} from "../dao/order.dao.js";
import { clearCartDAO } from "../dao/cart.dao.js";
import sendEmail from "../services/email.service.js";

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

// ── INITIATE PAYMENT ─────────────────────────────────────────
export const initiatePayment = async (req, res) => {
  const { orderId, method = "online" } = req.body;

  try {
    // Validate order exists and belongs to user
    const order = await getOrderByIdDAO(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Order must be pending_payment for online payment
    if (order.status !== "pending_payment") {
      return res.status(400).json({
        message: order.status === "placed"
          ? "Order already confirmed. Contact support."
          : "Invalid order status for payment",
      });
    }

    // Idempotent: reuse existing pending payment
    let existingPayment = await getPaymentByOrderDAO(orderId);

    if (existingPayment) {
      if (existingPayment.status === "success") {
        return res.status(400).json({ message: "Order already paid" });
      }
      if (existingPayment.status === "pending" && existingPayment.gatewayOrderId) {
        // Reuse existing Razorpay order
        const razorpayOrder = await razorpay.orders.fetch(existingPayment.gatewayOrderId);
        return res.status(200).json({
          message: "Payment reuse",
          razorpayOrder: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
          },
          payment: existingPayment,
          key: config.RAZORPAY_KEY_ID,
        });
      }
    }

    // Create Razorpay order — amount in paise
    const amountPaise = Math.round(order.totalPrice * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `order_${orderId}`,
    });

    // Create payment record in DB
    const payment = await createPaymentDAO({
      user: req.user._id,
      order: orderId,
      amount: order.totalPrice,
      method: "online",
      status: "pending",
      gatewayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      message: "Payment initiated",
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      payment: { id: payment._id, status: payment.status },
      key: config.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error initiating payment", error: error.message });
  }
};

// ── VERIFY PAYMENT ───────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  try {
    // Find payment by gateway order ID (more reliable than orderId)
    const payment = await getPaymentByOrderDAO(orderId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify payment belongs to requesting user
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Idempotent: if already success, return success
    if (payment.status === "success") {
      return res.status(200).json({
        message: "Payment already verified",
        paymentStatus: "success",
      });
    }

    // Verify Razorpay signature with timing-safe comparison
    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const signatureBuffer = Buffer.from(razorpay_signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      await updatePaymentStatusDAO(payment._id, "failed");
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update payment to success
    await updatePaymentStatusDAO(payment._id, "success", {
      paymentId: razorpay_payment_id,
      signature: null, // Don't store signature
    });

    // Update order status and link payment
    const order = await getOrderByIdDAO(orderId);
    await updateOrderStatusDAO(orderId, "placed", payment._id);

    // Clear cart after successful payment
    await clearCartDAO(req.user._id);

    // Send confirmation email
    await sendEmail(
      order.user.email,
      "Payment Successful — Order Confirmed!",
      `<h2>Payment Successful!</h2>
       <p>Your payment of ₹${order.totalPrice} was successful.</p>
       <p>Your order has been confirmed.</p>
       <p>Order ID: ${orderId}</p>
       <p>Payment ID: ${razorpay_payment_id}</p>`,
    );

    return res.status(200).json({
      message: "Payment verified successfully",
      paymentStatus: "success",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying payment", error: error.message });
  }
};

// ── CASH PAYMENT ─────────────────────────────────────────────
export const cashPayment = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await getOrderByIdDAO(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // create cash payment record
    await createPaymentDAO({
      user: req.user._id,
      order: orderId,
      amount: order.totalPrice,
      method: "cash",
      status: "success", // Cash payment success at order time
      gatewayOrderId: null,
    });

    return res.status(201).json({
      message: "Cash payment selected. Pay at pickup.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error processing cash payment", error: error.message });
  }
};

// ── PAYMENT HISTORY ──────────────────────────────────────────
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await getPaymentsByUserDAO(req.user._id);
    return res.status(200).json({ payments });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Error fetching payment history",
        error: error.message,
      });
  }
};
