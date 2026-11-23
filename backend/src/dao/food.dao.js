import foodModel from "../models/food.model.js";

export const createFoodDAO = async (foodData) =>
  await foodModel.create(foodData);

export const getAllFoodDAO = async (filter = {}) => {
  const query = { isAvailable: true };
  if (filter.store) query.store = filter.store;
  if (filter.category) query.category = { $in: [filter.category] };
  if (filter.q) {
    query.$or = [
      { name: { $regex: new RegExp(filter.q, "i") } },
      { description: { $regex: new RegExp(filter.q, "i") } },
    ];
  }

  const limit = Math.min(parseInt(filter.limit) || 50, 100);
  const page = Math.max(parseInt(filter.page) || 1, 1);
  const skip = (page - 1) * limit;

  return await foodModel
    .find(query)
    .populate("store", "name address")
    .populate("Partner", "name")
    .skip(skip)
    .limit(limit)
    .lean();
};

export const getFoodByIdDAO = async (id) =>
  await foodModel
    .findById(id)
    .populate("store", "name address")
    .populate("Partner", "name")
    .lean();

export const getFoodByPartnerDAO = async (partnerId) =>
  await foodModel.find({ Partner: partnerId, isAvailable: true }).lean();

export const getFoodByStoreDAO = async (storeId) =>
  await foodModel.find({ store: storeId, isAvailable: true }).lean();

export const getFoodByCategoryDAO = async (category) =>
  await foodModel.find({ category: { $in: [category] }, isAvailable: true }).lean();

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
    .populate("Partner", "name")
    .sort({ createdAt: -1 })
    .lean();
