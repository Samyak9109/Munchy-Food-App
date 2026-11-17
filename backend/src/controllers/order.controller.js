import {
  createOrderDAO,
  getOrderByIdDAO,
  getUserOrderByIdDAO,
  getOrderWithOtpByIdDAO,
  getOrdersByUserDAO,
  getOrdersByStoreDAO,
  updateOrderStatusDAO,
  cancelOrderDAO,
  expireOldPendingPaymentsDAO,
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
import {
  computeOrderTotals,
  validateStoreAndAvailability,
} from "../services/pricing.service.js";
import foodModel from "../models/food.model.js";
import storeModel from "../models/store.model.js";
import paymentModel from "../models/payment.model.js";
import Razorpay from "razorpay";
import config from "../config/config.js";
import bcrypt from "bcrypt";

// ── PREVIEW ORDER ────────────────────────────────────────────
export const previewOrder = async (req, res) => {
  try {
    const cart = await getCartByUserDAO(req.user._id);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Compute server-side totals
    const pricing = await computeOrderTotals(cart.items, foodModel);

    // Validate store is open
    await validateStoreAndAvailability(
      await foodModel.find({ _id: { $in: cart.items.map((i) => i.food) } }),
      cart.store._id,
      storeModel,
    );

    return res.status(200).json({
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      itemCount: cart.items.length,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Error previewing order",
    });
  }
};

// ── PLACE ORDER ──────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const { paymentMethod = "online" } = req.body; // "online" or "cash"
    const cart = await getCartByUserDAO(req.user._id);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Compute server-side totals (tamper-proof)
    const pricing = await computeOrderTotals(cart.items, foodModel);

    // Validate store is open and all items from same store
    const foods = await foodModel.find({
      _id: { $in: cart.items.map((i) => i.food) },
    });
    const store = await validateStoreAndAvailability(
      foods,
      cart.store._id,
      storeModel,
    );

    // generate OTP for pickup verification
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    // Online orders start as pending_payment, cash orders start as placed
    const initialStatus = paymentMethod === "cash" ? "placed" : "pending_payment";

    // Cash orders get a Payment record at creation (marked success at pickup, PAY-06)
    let cashPaymentId = null;
    if (paymentMethod === "cash") {
      const cashPayment = await paymentModel.create({
        user: req.user._id,
        amount: pricing.total,
        method: "cash",
        status: "pending",
      });
      cashPaymentId = cashPayment._id;
    }

    // create order with server-computed pricing
    const order = await createOrderDAO({
      user: req.user._id,
      store: store._id,
      items: pricing.items,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      totalPrice: pricing.total,
      status: initialStatus,
      otp: hashedOtp,
      pickupCode: otp,
      note: req.body.note || null,
      payment: cashPaymentId,
    });

    // fetch full order with populated fields
    const populatedOrder = await getOrderByIdDAO(order._id);

    // Cash orders: clear cart immediately
    // Online orders: cart stays until payment verified
    if (paymentMethod === "cash") {
      await clearCartDAO(req.user._id);

      const notifications = [
        sendOrderPlacedEmail(req.user.email, populatedOrder, otp),
      ];
      if (store.partner?.email) {
        notifications.push(sendNewOrderEmail(store.partner.email, populatedOrder));
      }
      Promise.allSettled(notifications).then((results) => {
        results
          .filter((result) => result.status === "rejected")
          .forEach((result) =>
            console.error("Order notification failed:", result.reason),
          );
      });
    }

    return res.status(201).json({
      message: paymentMethod === "cash"
        ? "Order placed successfully"
        : "Order created. Complete payment to confirm.",
      order: { ...populatedOrder.toObject(), pickupCode: paymentMethod === "cash" ? otp : null },
      requiresPayment: paymentMethod === "online",
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Error placing order",
    });
  }
};

// ── GET USER ORDERS ──────────────────────────────────────────
export const getOrders = async (req, res) => {
  try {
    // Lazy expiry: convert old pending_payment to cancelled
    await expireOldPendingPaymentsDAO();

    const orders = await getOrdersByUserDAO(req.user._id);

    // Mark which orders need payment
    const ordersWithPaymentFlag = orders.map((order) => ({
      ...order.toObject(),
      needsPayment: order.status === "pending_payment",
    }));

    return res.status(200).json({ orders: ordersWithPaymentFlag });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

// ── GET SINGLE ORDER ─────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    // Lazy expiry check
    await expireOldPendingPaymentsDAO();

    const order = req.user
      ? await getUserOrderByIdDAO(req.params.id)
      : await getOrderByIdDAO(req.params.id);
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

    return res.status(200).json({
      order: {
        ...order.toObject(),
        needsPayment: order.status === "pending_payment",
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

// ── CANCEL ORDER ─────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    // Lazy expiry check
    await expireOldPendingPaymentsDAO();

    const order = await getOrderByIdDAO(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // pending_payment can always be cancelled (no refund needed)
    // placed/confirmed can be cancelled (refund handled in PAY-07)
    if (!["placed", "confirmed", "pending_payment"].includes(order.status)) {
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });
    }

    // Cash orders: just cancel, no refund
    if (order.payment?.method === "cash") {
      await cancelOrderDAO(req.params.id);
      return res.status(200).json({ message: "Order cancelled successfully" });
    }

    // pending_payment online: void the payment, no refund
    if (order.status === "pending_payment" && order.payment) {
      await cancelOrderDAO(req.params.id);
      await paymentModel.updateOne(
        { _id: order.payment._id },
        { status: "failed" },
      );
      return res.status(200).json({ message: "Order cancelled successfully" });
    }

    // Paid online order: refund via Razorpay (PAY-07)
    if (order.payment && order.payment.status === "success") {
      const razorpay = new Razorpay({
        key_id: config.RAZORPAY_KEY_ID,
        key_secret: config.RAZORPAY_KEY_SECRET,
      });
      try {
        const refund = await razorpay.payments.refund(
          order.payment.gatewayPaymentId,
          { amount: Math.round(order.totalPrice * 100) },
        );
        await cancelOrderDAO(req.params.id);
        await paymentModel.updateOne(
          { _id: order.payment._id },
          { status: "refunded", refundId: refund.id },
        );
        return res.status(200).json({ message: "Order cancelled successfully" });
      } catch (refundError) {
        // Refund failed: still cancel the order, flag for manual action
        console.error("Refund failed:", refundError.message);
        await cancelOrderDAO(req.params.id);
        await paymentModel.updateOne(
          { _id: order.payment._id },
          { status: "refunded", refundStatus: "failed" },
        );
        return res.status(200).json({
          message:
            "Order cancelled, but refund failed. Contact support with order ID.",
        });
      }
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
    const partnerStoreIds = req.partner.stores.map((store) => store.toString());
    if (!partnerStoreIds.includes(req.params.storeId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

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
    if (order.store.partner?.toString?.() !== req.partner._id.toString()) {
      const partnerStoreIds = req.partner.stores.map((store) => store.toString());
      if (!partnerStoreIds.includes(order.store._id.toString())) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    // partner can only move status forward
    const currentIndex = validFlow.indexOf(order.status);
    const newIndex = validFlow.indexOf(status);

    if (newIndex !== currentIndex + 1) {
      return res.status(400).json({
        message: `Invalid status update. Current status: ${order.status}`,
      });
    }

    const updated = await updateOrderStatusDAO(req.params.id, status);

    const notification =
      status === "confirmed"
        ? sendOrderConfirmedEmail(order.user.email, order)
        : status === "ready"
          ? sendOrderReadyEmail(order.user.email, order)
          : null;
    notification?.catch((error) =>
      console.error("Order status notification failed:", error),
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
    const order = await getOrderWithOtpByIdDAO(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const partnerStoreIds = req.partner.stores.map((store) => store.toString());
    if (!partnerStoreIds.includes(order.store._id.toString())) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // order must be ready before pickup
    if (order.status !== "ready") {
      return res.status(400).json({ message: "Order is not ready for pickup" });
    }

    // verify OTP against stored hash
    if (!otp || !order.otp) {
      return res.status(400).json({ message: "Pickup OTP is required" });
    }
    const isValid = await bcrypt.compare(String(otp).trim(), order.otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await updateOrderStatusDAO(req.params.id, "pickedup");

    // Cash payment marked successful at pickup (PAY-06)
    if (order.payment) {
      await paymentModel.updateOne(
        { _id: order.payment },
        { status: "success" },
      );
    }

    sendOrderPickedUpEmail(order.user.email, order).catch((error) =>
      console.error("Pickup notification failed:", error),
    );

    return res.status(200).json({ message: "Order picked up successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};
