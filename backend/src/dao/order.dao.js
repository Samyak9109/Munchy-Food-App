import orderModel from "../models/order.model.js";

export const createOrderDAO = async (orderData) =>
  await orderModel.create(orderData);

export const getOrderByIdDAO = async (id) =>
  await orderModel
    .findById(id)
    .populate("user", "name email phone")
    .populate("store", "name address")
    .populate("items.food", "name price image");

export const getOrdersByUserDAO = async (userId) =>
  await orderModel
    .find({ user: userId })
    .populate("store", "name address")
    .populate("items.food", "name price image")
    .sort({ createdAt: -1 });

export const getOrdersByStoreDAO = async (storeId, status = null) =>
  await orderModel
    .find({ store: storeId, ...(status && { status }) })
    .populate("user", "name email phone")
    .populate("items.food", "name price image")
    .sort({ createdAt: -1 });

export const updateOrderStatusDAO = async (id, status) =>
  await orderModel.findByIdAndUpdate(id, { status }, { new: true });

export const updateOrderOtpDAO = async (id, otp) =>
  await orderModel.findByIdAndUpdate(id, { otp }, { new: true });

export const updatePickupTimeDAO = async (id, pickupTime) =>
  await orderModel.findByIdAndUpdate(id, { pickupTime }, { new: true });

export const cancelOrderDAO = async (id) =>
  await orderModel.findByIdAndUpdate(
    id,
    { status: "cancelled" },
    { new: true },
  );
