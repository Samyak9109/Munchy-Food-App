import orderModel from "../models/order.model.js";
import mongoose from "mongoose";

// ── DAILY STATS ──────────────────────────────────────────────
export const getDailyStatsDAO = async (storeId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        createdAt: { $gte: start, $lte: end },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
        avgOrderValue: { $avg: "$totalPrice" },
      },
    },
  ]);
};

// ── WEEKLY STATS ─────────────────────────────────────────────
export const getWeeklyStatsDAO = async (storeId) => {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  return await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        createdAt: { $gte: start },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: "$createdAt" }, // 1=Sunday, 7=Saturday
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// ── MONTHLY STATS ────────────────────────────────────────────
export const getMonthlyStatsDAO = async (storeId) => {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  return await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        createdAt: { $gte: start },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// ── TOP SELLING ITEMS ────────────────────────────────────────
export const getTopItemsDAO = async (storeId) => {
  return await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        status: { $ne: "cancelled" },
      },
    },
    { $unwind: "$items" }, // flatten items array
    {
      $group: {
        _id: "$items.food",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "foods",
        localField: "_id",
        foreignField: "_id",
        as: "food",
      },
    },
    { $unwind: "$food" },
    {
      $project: {
        totalSold: 1,
        totalRevenue: 1,
        "food.name": 1,
        "food.image": 1,
        "food.price": 1,
      },
    },
  ]);
};

// ── RUSH HOURS ───────────────────────────────────────────────
export const getRushHoursDAO = async (storeId) => {
  return await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" }, // group by hour 0-23
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// ── RUSH HOURS BY DAY OF WEEK ────────────────────────────────
export const getRushHoursByDayDAO = async (storeId) => {
  return await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfWeek: "$createdAt" }, // 1=Sun, 7=Sat
          hour: { $hour: "$createdAt" },
        },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { "_id.day": 1, "_id.hour": 1 } },
  ]);
};

// ── GROWTH ───────────────────────────────────────────────────
export const getGrowthDAO = async (storeId) => {
  const now = new Date();

  const thisWeekStart = new Date();
  thisWeekStart.setDate(now.getDate() - 7);

  const lastWeekStart = new Date();
  lastWeekStart.setDate(now.getDate() - 14);

  const thisWeek = await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        createdAt: { $gte: thisWeekStart },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const lastWeek = await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        createdAt: { $gte: lastWeekStart, $lt: thisWeekStart },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const thisRevenue = thisWeek[0]?.totalRevenue || 0;
  const lastRevenue = lastWeek[0]?.totalRevenue || 0;
  const thisOrders = thisWeek[0]?.totalOrders || 0;
  const lastOrders = lastWeek[0]?.totalOrders || 0;

  // calculate growth percentage
  const revenueGrowth =
    lastRevenue === 0
      ? 100
      : (((thisRevenue - lastRevenue) / lastRevenue) * 100).toFixed(2);

  const ordersGrowth =
    lastOrders === 0
      ? 100
      : (((thisOrders - lastOrders) / lastOrders) * 100).toFixed(2);

  return {
    thisWeek: { revenue: thisRevenue, orders: thisOrders },
    lastWeek: { revenue: lastRevenue, orders: lastOrders },
    growth: {
      revenue: `${revenueGrowth}%`,
      orders: `${ordersGrowth}%`,
    },
  };
};

// ── ORDER STATUS BREAKDOWN ───────────────────────────────────
export const getStatusBreakdownDAO = async (storeId) => {
  return await orderModel.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};
