import userModel from "../models/user.model.js";


export const getUserByIdDAO = async (id) =>
  await userModel.findById(id).select("-password");


export const getUserByEmailDAO = async (email) =>
  await userModel.findOne({ email }).select("-password");


export const updateUserDAO = async (id, updateData) =>
  await userModel
    .findByIdAndUpdate(id, updateData, { new: true })
    .select("-password");


export const deleteUserDAO = async (id) =>
  await userModel.findByIdAndDelete(id);
