import paymentModel from "../models/payment.model.js";

export const createPaymentDAO = async (paymentData) =>
  await paymentModel.create(paymentData);

export const getPaymentByIdDAO = async (id) => await paymentModel.findById(id);

export const getPaymentByOrderDAO = async (orderId) =>
  await paymentModel.findOne({ order: orderId });

export const getPaymentsByUserDAO = async (userId) =>
  await paymentModel
    .find({ user: userId })
    .populate("order", "totalPrice status createdAt")
    .sort({ createdAt: -1 });

export const updatePaymentStatusDAO = async (id, status) =>
  await paymentModel.findByIdAndUpdate(id, { status }, { new: true });
