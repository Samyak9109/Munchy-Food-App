import storeModel from "../models/store.model.js";

export const createStoreDAO = async (storeData) =>
  await storeModel.create(storeData);

export const getStoreByIdDAO = async (id) =>
  await storeModel.findById(id).populate("partner", "name email avatar").lean();

export const getStoreByPartnerDAO = async (partnerId) =>
  await storeModel.find({ partner: partnerId }).lean();

export const getAllStoresDAO = async (filter = {}) => {
  const query = {};
  if (filter.openOnly === "true" || filter.openOnly === true) {
    query.isOpen = true;
  }
  if (filter.cuisine) {
    query.cuisine = { $regex: new RegExp(filter.cuisine, "i") };
  }
  if (filter.q) {
    query.$or = [
      { name: { $regex: new RegExp(filter.q, "i") } },
      { cuisine: { $regex: new RegExp(filter.q, "i") } },
      { description: { $regex: new RegExp(filter.q, "i") } },
    ];
  }

  const limit = Math.min(parseInt(filter.limit) || 50, 100);
  const page = Math.max(parseInt(filter.page) || 1, 1);
  const skip = (page - 1) * limit;

  const stores = await storeModel
    .find(query)
    .populate({
      path: "partner",
      select: "name isActive",
      match: { isActive: { $ne: false } },
    })
    .sort({ isOpen: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Exclude stores where matched partner is null (i.e. partner is deactivated)
  return stores.filter((s) => s.partner !== null);
};

export const updateStoreDAO = async (id, updateData) =>
  await storeModel.findByIdAndUpdate(id, updateData, { new: true });

export const deleteStoreDAO = async (id) =>
  await storeModel.findByIdAndDelete(id);

export const toggleStoreStatusDAO = async (id, isOpen) =>
  await storeModel.findByIdAndUpdate(id, { isOpen }, { new: true });

export const getStoreWithMenuDAO = async (id) =>
  await storeModel.findById(id).populate("partner", "name email avatar").lean();
