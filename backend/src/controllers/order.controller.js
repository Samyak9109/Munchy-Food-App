import {
  createOrderDAO,
  getOrderByIdDAO,
  getOrdersByUserDAO,
  getOrdersByStoreDAO,
  updateOrderStatusDAO,
  cancelOrderDAO,
} from "../dao/order.dao.js";
import { getCartByUserDAO, clearCartDAO } from "../dao/cart.dao.js";
import { generateOTP, hashOTP } from "../services/otp.service.js";
import {
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderReadyEmail,
  sendOrderPickedUpEmail,
  sendNewOrderEmail,
} from "../services/email.service.js";
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

    // fetch full order with populated fields for email
    const populatedOrder = await getOrderByIdDAO(order._id);

    // notify user with OTP
    await sendOrderPlacedEmail(req.user.email, populatedOrder, otp);

    // notify partner about new order
    await sendNewOrderEmail(cart.store.partner.email, populatedOrder);

    // clear cart after order placed
    await clearCartDAO(req.user._id);

    return res
      .status(201)
      .json({ message: "Order placed successfully", order: populatedOrder });
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

    if (req.partner) {
      // Partner context: verify the order belongs to one of this partner's stores
      const partnerStoreIds = req.partner.stores.map((s) => s.toString());
      if (!partnerStoreIds.includes(order.store._id.toString())) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    } else if (req.user) {
      // User context: verify order belongs to requesting user
      if (order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
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
  const { status } = req.query;

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

    // send correct email based on new status
    if (status === "confirmed")
      await sendOrderConfirmedEmail(order.user.email, order);
    if (status === "ready") await sendOrderReadyEmail(order.user.email, order);

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

    // verify OTP against stored hash
    const isValid = await bcrypt.compare(otp, order.otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await updateOrderStatusDAO(req.params.id, "pickedup");

    // send confirmation to user
    await sendOrderPickedUpEmail(order.user.email, order);

    return res.status(200).json({ message: "Order picked up successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};
