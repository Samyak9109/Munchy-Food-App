import mongoose from "mongoose";
import reelModel from "../models/reel.model.js";
import { getUserLikesForReelsDAO } from "./like.dao.js";

export const createReelDAO = async (reelData) =>
  await reelModel.create(reelData);

export const getAllReelsDAO = async (options = {}) => {
  const { cursor, limit = 10, userId } = options;
  const numLimit = Math.min(parseInt(limit) || 10, 30);

  const query = {};
  if (cursor) {
    if (mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } else {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      }
    }
  }

  // Fetch 1 extra to check for nextCursor
  const reels = await reelModel
    .find(query)
    .populate("food", "name price image")
    .populate("partner", "name avatar")
    .populate("store", "name _id address")
    .sort({ createdAt: -1, _id: -1 })
    .limit(numLimit + 1)
    .lean();

  const hasMore = reels.length > numLimit;
  const items = hasMore ? reels.slice(0, numLimit) : reels;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

  if (userId && items.length > 0) {
    const reelIds = items.map((r) => r._id);
    const userLikes = await getUserLikesForReelsDAO(reelIds, userId);
    const likedSet = new Set(userLikes.map((l) => l.reel.toString()));
    for (const r of items) {
      r.likedByMe = likedSet.has(r._id.toString());
    }
  }

  return { reels: items, nextCursor, hasMore };
};

export const getReelsByStoreDAO = async (storeId) =>
  await reelModel
    .find({ store: storeId })
    .populate("food", "name price image")
    .populate("partner", "name avatar")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

export const getReelByIdDAO = async (id) =>
  await reelModel.findById(id).lean();

export const incrementViewsDAO = async (id) =>
  await reelModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });

export const incrementLikesDAO = async (id) =>
  await reelModel.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });

export const decrementLikesDAO = async (id) =>
  await reelModel.findByIdAndUpdate(id, { $inc: { likes: -1 } }, { new: true });

export const incrementCommentsDAO = async (id) =>
  await reelModel.findByIdAndUpdate(
    id,
    { $inc: { commentsCount: 1 } },
    { new: true },
  );

export const decrementCommentsDAO = async (id) =>
  await reelModel.findByIdAndUpdate(
    id,
    { $inc: { commentsCount: -1 } },
    { new: true },
  );

export const deleteReelDAO = async (id) =>
  await reelModel.findByIdAndDelete(id);
