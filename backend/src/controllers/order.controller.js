import {
  createOrderDAO,
  getOrderByIdDAO,
  getOrdersByUserDAO,
  getOrdersByStoreDAO,
  updateOrderStatusDAO,
  updateOrderOtpDAO,
  updatePickupTimeDAO,
  cancelOrderDAO,
} from "../dao/order.dao.js";
import { getCartByUserDAO, clearCartDAO } from "../dao/cart.dao.js";
import { generateOTP, hashOTP, verifyOTP } from "../services/otp.service.js";
import sendEmail from "../services/email.service.js";
import bcrypt from "bcrypt";

// ── PLACE ORDER ──────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const cart = await getCartByUserDAO(req.user._id);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // generate OTP for pickup verification
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    // create order from cart
    const order = await createOrderDAO({
      user: req.user._id,
      store: cart.store._id,
      items: cart.items.map((item) => ({
        food: item.food._id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: cart.totalPrice,
      otp: hashedOtp,
      note: req.body.note || null,
    });

    // send OTP to user email
    await sendEmail(
      req.user.email,
      "Your Munchy Order OTP",
      `<h2>Order Placed Successfully!</h2>
       <p>Your pickup OTP is: <strong>${otp}</strong></p>
       <p>Show this to the restaurant when picking up your order.</p>
       <p>Order ID: ${order._id}</p>`,
    );

    // clear cart after order placed
    await clearCartDAO(req.user._id);

    return res
      .status(201)
      .json({ message: "Order placed successfully", order });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error placing order", error: error.message });
  }
};

// ── GET USER ORDERS ──────────────────────────────────────────
export const getOrders = async (req, res) => {
  try {
    const orders = await getOrdersByUserDAO(req.user._id);
    return res.status(200).json({ orders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

// ── GET SINGLE ORDER ─────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const order = await getOrderByIdDAO(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // verify order belongs to requesting user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

// ── CANCEL ORDER ─────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const order = await getOrderByIdDAO(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // can only cancel if placed or confirmed
    if (!["placed", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });
    }

    await cancelOrderDAO(req.params.id);
    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error cancelling order", error: error.message });
  }
};

// ── GET STORE ORDERS (partner) ───────────────────────────────
export const getStoreOrders = async (req, res) => {
  const { status } = req.query; // optional filter by status

  try {
    const orders = await getOrdersByStoreDAO(req.params.storeId, status);
    return res.status(200).json({ orders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

// ── UPDATE ORDER STATUS (partner) ────────────────────────────
export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const validFlow = ["placed", "confirmed", "ready", "pickedup"];

  try {
    const order = await getOrderByIdDAO(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // partner can only move status forward
    const currentIndex = validFlow.indexOf(order.status);
    const newIndex = validFlow.indexOf(status);

    if (newIndex !== currentIndex + 1) {
      return res.status(400).json({
        message: `Invalid status update. Current status: ${order.status}`,
      });
    }

    const updated = await updateOrderStatusDAO(req.params.id, status);

    // send email to user on status change
    await sendEmail(
      order.user.email,
      `Your Munchy Order is ${status}`,
      `<h2>Order Update</h2>
       <p>Your order status has been updated to: <strong>${status}</strong></p>
       <p>Order ID: ${order._id}</p>`,
    );

    return res
      .status(200)
      .json({ message: "Order status updated", order: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
};

// ── VERIFY PICKUP OTP (partner) ──────────────────────────────
export const verifyPickupOTP = async (req, res) => {
  const { otp } = req.body;

  try {
    const order = await getOrderByIdDAO(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // order must be ready before pickup
    if (order.status !== "ready") {
      return res.status(400).json({ message: "Order is not ready for pickup" });
    }

    // verify OTP
    const isValid = await bcrypt.compare(otp, order.otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // mark as picked up
    await updateOrderStatusDAO(req.params.id, "pickedup");

    // send confirmation to user
    await sendEmail(
      order.user.email,
      "Order Picked Up — Enjoy your meal!",
      `<h2>Order Complete!</h2>
       <p>Your order has been picked up successfully.</p>
       <p>Enjoy your meal! 🍔</p>
       <p>Order ID: ${order._id}</p>`,
    );

    return res.status(200).json({ message: "Order picked up successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};
