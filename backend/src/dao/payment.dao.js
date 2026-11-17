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

export const updatePaymentStatusDAO = async (id, status, extraFields = {}) =>
  await paymentModel.findByIdAndUpdate(
    id,
    { status, ...extraFields },
    { new: true }
  );

export const getPaymentByGatewayOrderIdDAO = async (gatewayOrderId) =>
  await paymentModel.findOne({ gatewayOrderId });
