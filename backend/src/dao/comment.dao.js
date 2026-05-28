import commentModel from "../models/comment.model.js";

export const createCommentDAO = async (commentData) =>
  await commentModel.create(commentData);

export const getCommentsByReelDAO = async (reelId) =>
  await commentModel
    .find({ reel: reelId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });

export const getCommentByIdDAO = async (id) => await commentModel.findById(id);

export const deleteCommentDAO = async (id) =>
  await commentModel.findByIdAndDelete(id);
