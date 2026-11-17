import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Env vars are set in vitest globalSetup (tests/globalSetup.js), which runs
// before test modules load. config.js calls requireEnv() at import time, so
// the app would otherwise throw on boot. process.env is shared across the
// globalSetup worker and the test worker; globalThis is not.

// Import models and app after setting process.env
import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import partnerModel from "../src/models/partner.model.js";
import storeModel from "../src/models/store.model.js";
import foodModel from "../src/models/food.model.js";
import orderModel from "../src/models/order.model.js";
import paymentModel from "../src/models/payment.model.js";
import cartModel from "../src/models/cart.model.js";

function makeToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role || "user" },
    process.env.JWT_SECRET,
  );
}

describe("Payment Suite (PAY-08)", () => {
  let user;
  let userToken;
  let otherUser;
  let otherUserToken;
  let partner;
  let store;
  let food;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database collections
    await userModel.deleteMany({});
    await partnerModel.deleteMany({});
    await storeModel.deleteMany({});
    await foodModel.deleteMany({});
    await orderModel.deleteMany({});
    await paymentModel.deleteMany({});
    await cartModel.deleteMany({});

    // Seed test user, partner, store, food
    user = await userModel.create({
      name: "Alice Tester",
      email: "alice@example.com",
      role: "user",
      isVerified: true,
    });
    userToken = makeToken(user);

    otherUser = await userModel.create({
      name: "Bob Stranger",
      email: "bob@example.com",
      role: "user",
      isVerified: true,
    });
    otherUserToken = makeToken(otherUser);

    partner = await partnerModel.create({
      name: "Chef Partner",
      email: "partner@example.com",
      role: "partner",
      isVerified: true,
    });

    store = await storeModel.create({
      partner: partner._id,
      name: "Pizza Palace",
      address: "123 Main St",
      isOpen: true,
      location: { type: "Point", coordinates: [77.2, 28.6] },
    });
    partner.stores.push(store._id);
    await partner.save();

    food = await foodModel.create({
      name: "Margherita Pizza",
      price: 200, // ₹200
      store: store._id,
      Partner: partner._id,
      category: ["lunch"],
      image: "https://example.com/pizza.jpg",
      isAvailable: true,
    });
  });

  // ── 1. SIGNATURE VALIDATION & VERIFICATION (PAY-02) ───────────
  describe("Payment Verification (PAY-02)", () => {
    it("rejects verification with an invalid Razorpay signature", async () => {
      const order = await orderModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, name: food.name, quantity: 1, price: 200 }],
        subtotal: 200,
        tax: 10,
        totalPrice: 210,
        status: "pending_payment",
      });

      const payment = await paymentModel.create({
        user: user._id,
        order: order._id,
        amount: 210,
        method: "online",
        status: "pending",
        gatewayOrderId: "order_rzp_123",
      });

      const res = await request(app)
        .post("/api/payment/verify")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          orderId: order._id.toString(),
          razorpay_order_id: "order_rzp_123",
          razorpay_payment_id: "pay_rzp_456",
          razorpay_signature: "bad_invalid_signature_hex_digest_string_32_chars",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid payment signature/i);

      // Check payment was marked failed
      const updatedPayment = await paymentModel.findById(payment._id);
      expect(updatedPayment.status).toBe("failed");
    });

    it("verifies successfully with a valid HMAC-SHA256 signature", async () => {
      const order = await orderModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, name: food.name, quantity: 1, price: 200 }],
        subtotal: 200,
        tax: 10,
        totalPrice: 210,
        status: "pending_payment",
      });

      const payment = await paymentModel.create({
        user: user._id,
        order: order._id,
        amount: 210,
        method: "online",
        status: "pending",
        gatewayOrderId: "order_rzp_valid",
      });

      const razorpayOrderId = "order_rzp_valid";
      const razorpayPaymentId = "pay_rzp_valid";
      const validSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const res = await request(app)
        .post("/api/payment/verify")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          orderId: order._id.toString(),
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.paymentStatus).toBe("success");

      // Verify DB updates: payment success, order placed, payment linked
      const updatedPayment = await paymentModel.findById(payment._id);
      expect(updatedPayment.status).toBe("success");
      expect(updatedPayment.gatewayPaymentId).toBe(razorpayPaymentId);

      const updatedOrder = await orderModel.findById(order._id);
      expect(updatedOrder.status).toBe("placed");
      expect(updatedOrder.payment.toString()).toBe(payment._id.toString());
    });
  });

  // ── 2. OWNERSHIP CONTROL ─────────────────────────────────────
  describe("Ownership Controls", () => {
    it("prevents User B from verifying User A's payment", async () => {
      const order = await orderModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, name: food.name, quantity: 1, price: 200 }],
        subtotal: 200,
        tax: 10,
        totalPrice: 210,
        status: "pending_payment",
      });

      await paymentModel.create({
        user: user._id,
        order: order._id,
        amount: 210,
        method: "online",
        status: "pending",
        gatewayOrderId: "order_rzp_user_a",
      });

      const res = await request(app)
        .post("/api/payment/verify")
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({
          orderId: order._id.toString(),
          razorpay_order_id: "order_rzp_user_a",
          razorpay_payment_id: "pay_rzp_hacker",
          razorpay_signature: "any_sig",
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/unauthorized/i);
    });

    it("prevents User B from initiating payment for User A's order", async () => {
      const order = await orderModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, name: food.name, quantity: 1, price: 200 }],
        subtotal: 200,
        tax: 10,
        totalPrice: 210,
        status: "pending_payment",
      });

      const res = await request(app)
        .post("/api/payment/initiate")
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ orderId: order._id.toString() });

      expect(res.status).toBe(403);
    });
  });

  // ── 3. IDEMPOTENCY ───────────────────────────────────────────
  describe("Idempotency Controls", () => {
    it("returns success without side effects when re-verifying an already successful payment", async () => {
      const order = await orderModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, name: food.name, quantity: 1, price: 200 }],
        subtotal: 200,
        tax: 10,
        totalPrice: 210,
        status: "placed",
      });

      const payment = await paymentModel.create({
        user: user._id,
        order: order._id,
        amount: 210,
        method: "online",
        status: "success",
        gatewayOrderId: "order_rzp_idem",
        gatewayPaymentId: "pay_rzp_idem",
      });

      const res = await request(app)
        .post("/api/payment/verify")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          orderId: order._id.toString(),
          razorpay_order_id: "order_rzp_idem",
          razorpay_payment_id: "pay_rzp_idem",
          razorpay_signature: "any_sig",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/already verified/i);

      // State remains unchanged
      const checkPayment = await paymentModel.findById(payment._id);
      expect(checkPayment.status).toBe("success");
    });
  });

  // ── 4. WEBHOOK SIGNATURE & IDEMPOTENCY (PAY-03) ───────────────
  describe("Razorpay Webhook (PAY-03)", () => {
    it("rejects webhooks with invalid X-Razorpay-Signature", async () => {
      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: { id: "pay_web_123", order_id: "order_web_123" },
          },
        },
      };

      const res = await request(app)
        .post("/api/payment/webhook")
        .set("X-Razorpay-Signature", "invalid_webhook_sig_hex")
        .set("Content-Type", "application/json")
        .send(JSON.stringify(payload));

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid webhook signature/i);
    });

    it("processes valid payment.captured webhook and updates order to placed", async () => {
      const order = await orderModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, name: food.name, quantity: 1, price: 200 }],
        subtotal: 200,
        tax: 10,
        totalPrice: 210,
        status: "pending_payment",
      });

      const payment = await paymentModel.create({
        user: user._id,
        order: order._id,
        amount: 210,
        method: "online",
        status: "pending",
        gatewayOrderId: "order_web_valid",
      });

      const bodyObj = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_web_captured",
              order_id: "order_web_valid",
            },
          },
        },
      };

      const rawBody = JSON.stringify(bodyObj);
      const validSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const res = await request(app)
        .post("/api/payment/webhook")
        .set("X-Razorpay-Signature", validSig)
        .set("Content-Type", "application/json")
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/payment captured/i);

      const checkPayment = await paymentModel.findById(payment._id);
      expect(checkPayment.status).toBe("success");

      const checkOrder = await orderModel.findById(order._id);
      expect(checkOrder.status).toBe("placed");
      expect(checkOrder.payment.toString()).toBe(payment._id.toString());
    });
  });

  // ── 5. AMOUNT ROUNDING (PAISE CONVERSION) ────────────────────
  describe("Amount Rounding (Paise)", () => {
    it("converts floating point prices to exact integer paise without rounding drift", async () => {
      // Create a food item with fractional rupees: ₹99.99
      const cheapFood = await foodModel.create({
        name: "Snack",
        price: 99.99,
        store: store._id,
        Partner: partner._id,
        category: ["snacks"],
        image: "https://example.com/snack.jpg",
        isAvailable: true,
      });

      // Cart with 3 items of ₹99.99 = 299.97 subtotal
      // Tax at 5%: 299.97 * 0.05 = 14.9985 -> rounded to 15.00
      // Total: 314.97
      const cartItems = [{ food: cheapFood._id, quantity: 3 }];

      const { computeOrderTotals } = await import(
        "../src/services/pricing.service.js"
      );
      const totals = await computeOrderTotals(cartItems, foodModel);

      // Verify exact paise values (all integers)
      expect(Number.isInteger(totals.subtotalPaise)).toBe(true);
      expect(Number.isInteger(totals.taxPaise)).toBe(true);
      expect(Number.isInteger(totals.totalPaise)).toBe(true);
      expect(totals.subtotalPaise).toBe(29997); // 9999 * 3
      expect(totals.taxPaise).toBe(1500); // Math.round(29997 * 0.05) = Math.round(1499.85) = 1500
      expect(totals.totalPaise).toBe(31497);
      expect(totals.total).toBe(314.97);
    });
  });
});