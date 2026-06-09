import orderModel from "../models/order.model.js";

const populateOrder = (query) =>
  query
    .populate("user", "name email phone avatar")
    .populate("store", "name address partner")
    .populate("items.food", "name price image");

export const createOrderDAO = async (orderData) =>
  await orderModel.create(orderData);

export const getOrderByIdDAO = async (id) =>
  await populateOrder(orderModel.findById(id));

export const getUserOrderByIdDAO = async (id) =>
  await populateOrder(orderModel.findById(id).select("+pickupCode"));

export const getOrderWithOtpByIdDAO = async (id) =>
  await populateOrder(orderModel.findById(id).select("+otp"));

export const getOrdersByUserDAO = async (userId) =>
  await orderModel
    .find({ user: userId })
    .populate("store", "name address")
    .populate("items.food", "name price image")
    .sort({ createdAt: -1 });

export const getOrdersByStoreDAO = async (storeId, status = null) =>
  await orderModel
    .find({ store: storeId, ...(status && { status }) })
    .populate("user", "name email phone avatar")
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
