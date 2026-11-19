import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import userModel from "../src/models/user.model.js";
import partnerModel from "../src/models/partner.model.js";
import storeModel from "../src/models/store.model.js";
import foodModel from "../src/models/food.model.js";
import orderModel from "../src/models/order.model.js";
import cartModel from "../src/models/cart.model.js";
import {
  computeOrderTotals,
  validateStoreAndAvailability,
} from "../src/services/pricing.service.js";

function makeToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role || "user" },
    process.env.JWT_SECRET,
  );
}

describe("Order Guards & Pricing Suite (QA-02 / ORD-01)", () => {
  let user;
  let userToken;
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
    await userModel.deleteMany({});
    await partnerModel.deleteMany({});
    await storeModel.deleteMany({});
    await foodModel.deleteMany({});
    await orderModel.deleteMany({});
    await cartModel.deleteMany({});

    user = await userModel.create({
      name: "Alice Customer",
      email: "alice.guards@example.com",
      password: "Password123!",
      role: "user",
      isEmailVerified: true,
    });
    userToken = makeToken(user);

    partner = await partnerModel.create({
      name: "Chef Bob",
      email: "bob.guards@example.com",
      password: "Password123!",
      role: "partner",
      isEmailVerified: true,
    });

    store = await storeModel.create({
      name: "Bob's Diner",
      partner: partner._id,
      description: "Great food",
      address: "123 Main St, Indore",
      location: { type: "Point", coordinates: [75.8577, 22.7196] },
      isOpen: true,
    });

    food = await foodModel.create({
      name: "Classic Burger",
      description: "Juicy beef burger",
      price: 250,
      Partner: partner._id,
      store: store._id,
      category: ["lunch"],
      image: "https://example.com/burger.jpg",
      isAvailable: true,
    });
  });

  describe("Unit Guards: computeOrderTotals", () => {
    it("rejects an empty cart", async () => {
      await expect(computeOrderTotals([], foodModel)).rejects.toThrow("Cart is empty");
    });

    it("rejects when food item is deleted/missing from DB", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const items = [{ food: nonExistentId, quantity: 1 }];
      await expect(computeOrderTotals(items, foodModel)).rejects.toThrow("Some food items not found");
    });

    it("rejects when food item is marked unavailable", async () => {
      await foodModel.findByIdAndUpdate(food._id, { isAvailable: false });
      const items = [{ food: food._id, quantity: 2 }];
      await expect(computeOrderTotals(items, foodModel)).rejects.toThrow("currently unavailable");
    });

    it("computes accurate subtotal, tax and total in paise without floating point issues", async () => {
      const items = [{ food: food._id, quantity: 2 }]; // 250 * 2 = 500
      const pricing = await computeOrderTotals(items, foodModel);
      expect(pricing.subtotal).toBe(500);
      expect(pricing.subtotalPaise).toBe(50000);
      expect(pricing.tax).toBe(25); // 5% of 500
      expect(pricing.taxPaise).toBe(2500);
      expect(pricing.total).toBe(525);
      expect(pricing.totalPaise).toBe(52500);
    });
  });

  describe("Unit Guards: validateStoreAndAvailability", () => {
    it("rejects when store is closed", async () => {
      await storeModel.findByIdAndUpdate(store._id, { isOpen: false });
      const foods = [food];
      await expect(validateStoreAndAvailability(foods, store._id, storeModel)).rejects.toThrow("currently closed");
    });

    it("rejects when items belong to different stores", async () => {
      const store2 = await storeModel.create({
        name: "Second Store",
        partner: partner._id,
        address: "456 Side St",
        location: { type: "Point", coordinates: [75.86, 22.72] },
        isOpen: true,
      });
      const food2 = await foodModel.create({
        name: "Pizza",
        price: 300,
        Partner: partner._id,
        store: store2._id,
        category: ["dinner"],
        image: "https://example.com/pizza.jpg",
        isAvailable: true,
      });

      await expect(
        validateStoreAndAvailability([food, food2], store._id, storeModel)
      ).rejects.toThrow("Cart contains items from multiple stores");
    });

    it("rejects if expected storeId mismatches food store", async () => {
      const anotherStoreId = new mongoose.Types.ObjectId();
      await expect(
        validateStoreAndAvailability([food], anotherStoreId, storeModel)
      ).rejects.toThrow("Cart store mismatch");
    });
  });

  describe("Integration: POST /api/order/place guard responses", () => {
    it("returns 400 if user cart is empty", async () => {
      const res = await request(app)
        .post("/api/order/place")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ paymentMethod: "cash" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cart is empty/i);
    });

    it("returns 400 if store is closed at order time", async () => {
      // Setup cart with item
      await cartModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, quantity: 1, price: 250 }],
        totalPrice: 250,
      });

      // Mark store closed
      await storeModel.findByIdAndUpdate(store._id, { isOpen: false });

      const res = await request(app)
        .post("/api/order/place")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ paymentMethod: "cash" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/currently closed/i);
    });

    it("returns 400 if food becomes unavailable at order time", async () => {
      await cartModel.create({
        user: user._id,
        store: store._id,
        items: [{ food: food._id, quantity: 1, price: 250 }],
        totalPrice: 250,
      });

      // Mark food unavailable
      await foodModel.findByIdAndUpdate(food._id, { isAvailable: false });

      const res = await request(app)
        .post("/api/order/place")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ paymentMethod: "cash" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unavailable/i);
    });
  });
});
