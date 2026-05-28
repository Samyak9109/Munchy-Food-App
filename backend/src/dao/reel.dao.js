import reelModel from "../models/reel.model.js";

export const createReelDAO = async (reelData) =>
  await reelModel.create(reelData);

export const getAllReelsDAO = async () =>
  await reelModel
    .find()
    .populate("food", "name price")
    .populate("partner", "name avatar")
    .populate("store", "name address")
    .sort({ createdAt: -1 });

export const getReelsByStoreDAO = async (storeId) =>
  await reelModel
    .find({ store: storeId })
    .populate("food", "name price")
    .populate("partner", "name avatar")
    .sort({ createdAt: -1 });

export const getReelByIdDAO = async (id) => await reelModel.findById(id);

export const incrementViewsDAO = async (id) =>
  await reelModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });

export const incrementLikesDAO = async (id) =>
  await reelModel.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });

export const decrementLikesDAO = async (id) =>
  await reelModel.findByIdAndUpdate(id, { $inc: { likes: -1 } }, { new: true });

export const deleteReelDAO = async (id) =>
  await reelModel.findByIdAndDelete(id);
