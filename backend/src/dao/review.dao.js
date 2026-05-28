import reviewModel from "../models/review.model.js";
import mongoose from "mongoose";

export const createReviewDAO = async (reviewData) =>
  await reviewModel.create(reviewData);

export const getReviewsByFoodDAO = async (foodId) =>
  await reviewModel
    .find({ food: foodId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });

export const getReviewsByStoreDAO = async (storeId) =>
  await reviewModel
    .find({ store: storeId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });

export const getReviewByIdDAO = async (id) => await reviewModel.findById(id);

export const deleteReviewDAO = async (id) =>
  await reviewModel.findByIdAndDelete(id);

// calculate average rating for a food item
export const getAverageRatingByFoodDAO = async (foodId) => {
  const result = await reviewModel.aggregate([
    { $match: { food: new mongoose.Types.ObjectId(foodId) } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return result[0] || { average: 0, count: 0 };
};

// calculate average rating for a store
export const getAverageRatingByStoreDAO = async (storeId) => {
  const result = await reviewModel.aggregate([
    { $match: { store: new mongoose.Types.ObjectId(storeId) } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return result[0] || { average: 0, count: 0 };
};
