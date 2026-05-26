import cartModel from "../models/cart.model.js";

export const createCartDAO = async (userId, storeId) =>
  await cartModel.create({
    user: userId,
    store: storeId,
    items: [],
    totalPrice: 0,
  });

export const getCartByUserDAO = async (userId) =>
  await cartModel
    .findOne({ user: userId })
    .populate("items.food", "name price image video")
    .populate("store", "name image");

export const addItemToCartDAO = async (userId, item) =>
  await cartModel.findOneAndUpdate(
    { user: userId },
    { $push: { items: item } },
    { new: true },
  );

export const updateItemQtyDAO = async (userId, foodId, quantity) =>
  await cartModel.findOneAndUpdate(
    { user: userId, "items.food": foodId },
    { $set: { "items.$.quantity": quantity } },
    { new: true },
  );

export const removeItemFromCartDAO = async (userId, foodId) =>
  await cartModel.findOneAndUpdate(
    { user: userId },
    { $pull: { items: { food: foodId } } },
    { new: true },
  );

export const clearCartDAO = async (userId) =>
  await cartModel.findOneAndDelete({ user: userId });

export const updateTotalPriceDAO = async (userId, totalPrice) =>
  await cartModel.findOneAndUpdate(
    { user: userId },
    { totalPrice },
    { new: true },
  );
