import favoriteModel from "../models/favourite.model.js";

export const createFavoriteDAO = async (userId, storeId) =>
  await favoriteModel.create({ user: userId, store: storeId });

export const deleteFavoriteDAO = async (userId, storeId) =>
  await favoriteModel.findOneAndDelete({ user: userId, store: storeId });

export const getFavoriteDAO = async (userId, storeId) =>
  await favoriteModel.findOne({ user: userId, store: storeId });

export const getFavoritesByUserDAO = async (userId) =>
  await favoriteModel
    .find({ user: userId })
    .populate("store", "name image address cuisine rating isOpen")
    .sort({ createdAt: -1 });
