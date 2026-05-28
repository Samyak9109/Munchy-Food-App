import Razorpay from "razorpay";
import crypto from "crypto";
import config from "../config/config.js";
import {
  createPaymentDAO,
  getPaymentByOrderDAO,
  getPaymentsByUserDAO,
  updatePaymentStatusDAO,
} from "../dao/payment.dao.js";
import { getOrderByIdDAO, updateOrderStatusDAO } from "../dao/order.dao.js";
import sendEmail from "../services/email.service.js";

const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

// ── INITIATE PAYMENT ─────────────────────────────────────────
export const initiatePayment = async (req, res) => {
  const { orderId, method } = req.body;

  try {
    const order = await getOrderByIdDAO(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // verify order belongs to requesting user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // check if payment already exists for this order
    const existingPayment = await getPaymentByOrderDAO(orderId);
    if (existingPayment && existingPayment.status === "success") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // create razorpay order — amount in paise
    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalPrice * 100,
      currency: "INR",
      receipt: `order_${orderId}`,
    });

    // create payment record in DB
    const payment = await createPaymentDAO({
      user: req.user._id,
      order: orderId,
      amount: order.totalPrice,
      method,
      status: "pending",
      gatewayId: razorpayOrder.id,
    });

    return res.status(201).json({
      message: "Payment initiated",
      razorpayOrder,
      payment,
      key: config.RAZORPAY_KEY_ID, // send to frontend for Razorpay checkout
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
    // verify razorpay signature
    const hmac = crypto.createHmac("sha256", config.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // find payment by gateway order id
    const payment = await getPaymentByOrderDAO(orderId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // update payment status to success
    await updatePaymentStatusDAO(payment._id, "success");

    // auto confirm order after successful payment
    await updateOrderStatusDAO(orderId, "confirmed");

    // send confirmation email
    const order = await getOrderByIdDAO(orderId);
    await sendEmail(
      order.user.email,
      "Payment Successful — Order Confirmed!",
      `<h2>Payment Successful!</h2>
       <p>Your payment of ₹${order.totalPrice} was successful.</p>
       <p>Your order has been confirmed.</p>
       <p>Order ID: ${orderId}</p>
       <p>Payment ID: ${razorpay_payment_id}</p>`,
    );

    return res.status(200).json({ message: "Payment verified successfully" });
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
      status: "pending", // becomes success when order is pickedup
      gatewayId: null,
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
