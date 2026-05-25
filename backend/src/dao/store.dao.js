import storeModel from "../models/store.model.js";

export const createStoreDAO = async (storeData) =>
  await storeModel.create(storeData);

export const getStoreByIdDAO = async (id) =>
  await storeModel.findById(id).populate("partner", "name email avatar");

export const getStoreByPartnerDAO = async (partnerId) =>
  await storeModel.find({ partner: partnerId });

export const getAllStoresDAO = async () =>
  await storeModel
    .find()
    .populate("partner", "name isActive")
    .then((stores) => stores.filter((s) => s.partner?.isActive === true));

export const updateStoreDAO = async (id, updateData) =>
  await storeModel.findByIdAndUpdate(id, updateData, { new: true });

export const deleteStoreDAO = async (id) =>
  await storeModel.findByIdAndDelete(id);

export const toggleStoreStatusDAO = async (id, isOpen) =>
  await storeModel.findByIdAndUpdate(id, { isOpen }, { new: true });

export const getStoreWithMenuDAO = async (id) =>
  await storeModel.findById(id).populate("partner", "name email avatar");
