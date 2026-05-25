import foodModel from "../models/food.model.js";

export const createFoodDAO = async (foodData) =>
  await foodModel.create(foodData);

export const getAllFoodDAO = async () =>
  await foodModel
    .find({ isAvailable: true })
    .populate("store", "name address")
    .populate("foodPartner", "name");

export const getFoodByIdDAO = async (id) =>
  await foodModel
    .findById(id)
    .populate("store", "name address")
    .populate("foodPartner", "name");

export const getFoodByPartnerDAO = async (partnerId) =>
  await foodModel.find({ foodPartner: partnerId, isAvailable: true });

export const getFoodByStoreDAO = async (storeId) =>
  await foodModel.find({ store: storeId, isAvailable: true });

export const getFoodByCategoryDAO = async (category) =>
  await foodModel.find({ category: { $in: [category] }, isAvailable: true });

export const updateFoodDAO = async (id, updateData) =>
  await foodModel.findByIdAndUpdate(id, updateData, { new: true });

export const deleteFoodDAO = async (id) =>
  await foodModel.findByIdAndDelete(id);

export const toggleFoodAvailabilityDAO = async (id, isAvailable) =>
  await foodModel.findByIdAndUpdate(id, { isAvailable }, { new: true });

export const getFoodVideosDAO = async () =>
  await foodModel
    .find({ isAvailable: true, video: { $exists: true, $ne: null } })
    .select("name video ratings")
    .populate("foodPartner", "name")
    .sort({ createdAt: -1 });
