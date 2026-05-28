import {
  getDailyStatsDAO,
  getWeeklyStatsDAO,
  getMonthlyStatsDAO,
  getTopItemsDAO,
  getRushHoursDAO,
  getRushHoursByDayDAO,
  getGrowthDAO,
  getStatusBreakdownDAO,
} from "../dao/dashboard.dao.js";
import { getStoreByIdDAO } from "../dao/store.dao.js";

// helper — verify store belongs to partner
const verifyStoreOwnership = async (storeId, partnerId) => {
  const store = await getStoreByIdDAO(storeId);
  if (!store) return false;
  return store.partner._id.toString() === partnerId.toString();
};

// ── DAILY STATS ──────────────────────────────────────────────
export const getDailyStats = async (req, res) => {
  try {
    const isOwner = await verifyStoreOwnership(
      req.params.storeId,
      req.partner._id,
    );
    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    const stats = await getDailyStatsDAO(req.params.storeId);
    return res.status(200).json({
      stats: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching daily stats", error: error.message });
  }
};

// ── WEEKLY STATS ─────────────────────────────────────────────
export const getWeeklyStats = async (req, res) => {
  try {
    const isOwner = await verifyStoreOwnership(
      req.params.storeId,
      req.partner._id,
    );
    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    const stats = await getWeeklyStatsDAO(req.params.storeId);
    return res.status(200).json({ stats });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching weekly stats", error: error.message });
  }
};

// ── MONTHLY STATS ────────────────────────────────────────────
export const getMonthlyStats = async (req, res) => {
  try {
    const isOwner = await verifyStoreOwnership(
      req.params.storeId,
      req.partner._id,
    );
    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    const stats = await getMonthlyStatsDAO(req.params.storeId);
    return res.status(200).json({ stats });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching monthly stats", error: error.message });
  }
};

// ── TOP ITEMS ────────────────────────────────────────────────
export const getTopItems = async (req, res) => {
  try {
    const isOwner = await verifyStoreOwnership(
      req.params.storeId,
      req.partner._id,
    );
    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    const items = await getTopItemsDAO(req.params.storeId);
    return res.status(200).json({ items });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching top items", error: error.message });
  }
};

// ── RUSH HOURS ───────────────────────────────────────────────
export const getRushHours = async (req, res) => {
  try {
    const isOwner = await verifyStoreOwnership(
      req.params.storeId,
      req.partner._id,
    );
    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    const hours = await getRushHoursDAO(req.params.storeId);
    const byDay = await getRushHoursByDayDAO(req.params.storeId);

    return res.status(200).json({ rushHours: hours, rushHoursByDay: byDay });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching rush hours", error: error.message });
  }
};

// ── GROWTH ───────────────────────────────────────────────────
export const getGrowth = async (req, res) => {
  try {
    const isOwner = await verifyStoreOwnership(
      req.params.storeId,
      req.partner._id,
    );
    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    const growth = await getGrowthDAO(req.params.storeId);
    return res.status(200).json({ growth });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching growth", error: error.message });
  }
};

// ── STATUS BREAKDOWN ─────────────────────────────────────────
export const getStatusBreakdown = async (req, res) => {
  try {
    const isOwner = await verifyStoreOwnership(
      req.params.storeId,
      req.partner._id,
    );
    if (!isOwner) return res.status(403).json({ message: "Unauthorized" });

    const breakdown = await getStatusBreakdownDAO(req.params.storeId);
    return res.status(200).json({ breakdown });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Error fetching status breakdown",
        error: error.message,
      });
  }
};
