import likeModel from "../models/like.model.js";

export const createLikeDAO = async (reelId, userId) =>
  await likeModel.create({ reel: reelId, user: userId });

export const deleteLikeDAO = async (reelId, userId) =>
  await likeModel.findOneAndDelete({ reel: reelId, user: userId });

export const getLikeDAO = async (reelId, userId) =>
  await likeModel.findOne({ reel: reelId, user: userId }).lean();

export const getUserLikesForReelsDAO = async (reelIds, userId) => {
  if (!userId || !reelIds?.length) return [];
  return await likeModel
    .find({ user: userId, reel: { $in: reelIds } })
    .select("reel")
    .lean();
};
