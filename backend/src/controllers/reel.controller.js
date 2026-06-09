import {
  createReelDAO,
  getAllReelsDAO,
  getReelsByStoreDAO,
  getReelByIdDAO,
  incrementViewsDAO,
  incrementLikesDAO,
  decrementLikesDAO,
  incrementCommentsDAO,
  decrementCommentsDAO,
  deleteReelDAO,
} from "../dao/reel.dao.js";
import { createLikeDAO, deleteLikeDAO, getLikeDAO } from "../dao/like.dao.js";
import {
  createCommentDAO,
  getCommentsByReelDAO,
  getCommentByIdDAO,
  deleteCommentDAO,
} from "../dao/comment.dao.js";
import { uploadToImagekit } from "../services/storage.service.js";

// ── CREATE REEL ──────────────────────────────────────────────
export const createReel = async (req, res) => {
  const { foodId, storeId, caption } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Video is required" });
    }

    const videoUrl = await uploadToImagekit(req.file);

    const reel = await createReelDAO({
      food: foodId,
      store: storeId,
      partner: req.partner._id,
      video: videoUrl,
      caption,
    });

    return res.status(201).json({ message: "Reel created successfully", reel });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating reel", error: error.message });
  }
};

// ── GET ALL REELS ────────────────────────────────────────────
export const getAllReels = async (req, res) => {
  try {
    const reels = await getAllReelsDAO();
    return res.status(200).json({ reels });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching reels", error: error.message });
  }
};

// ── GET REELS BY STORE ───────────────────────────────────────
export const getReelsByStore = async (req, res) => {
  try {
    const reels = await getReelsByStoreDAO(req.params.storeId);
    return res.status(200).json({ reels });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching reels", error: error.message });
  }
};

// ── INCREMENT VIEWS ──────────────────────────────────────────
export const incrementViews = async (req, res) => {
  try {
    await incrementViewsDAO(req.params.id);
    return res.status(200).json({ message: "View counted" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating views", error: error.message });
  }
};

// ── LIKE / UNLIKE REEL (toggle) ──────────────────────────────
export const toggleLike = async (req, res) => {
  try {
    const reel = await getReelByIdDAO(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const existingLike = await getLikeDAO(req.params.id, req.user._id);

    if (existingLike) {
      // already liked → unlike
      await deleteLikeDAO(req.params.id, req.user._id);
      await decrementLikesDAO(req.params.id);
      return res.status(200).json({ message: "Reel unliked" });
    } else {
      // not liked → like
      await createLikeDAO(req.params.id, req.user._id);
      await incrementLikesDAO(req.params.id);
      return res.status(200).json({ message: "Reel liked" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error toggling like", error: error.message });
  }
};

// ── ADD COMMENT ──────────────────────────────────────────────
export const addComment = async (req, res) => {
  const { text } = req.body;

  try {
    const reel = await getReelByIdDAO(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const comment = await createCommentDAO({
      reel: req.params.id,
      user: req.user._id,
      text,
    });
    await incrementCommentsDAO(req.params.id);

    return res.status(201).json({ message: "Comment added", comment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding comment", error: error.message });
  }
};

// ── GET COMMENTS ─────────────────────────────────────────────
export const getComments = async (req, res) => {
  try {
    const comments = await getCommentsByReelDAO(req.params.id);
    return res.status(200).json({ comments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching comments", error: error.message });
  }
};

// ── DELETE COMMENT ───────────────────────────────────────────
export const deleteComment = async (req, res) => {
  try {
    const comment = await getCommentByIdDAO(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await deleteCommentDAO(req.params.commentId);
    await decrementCommentsDAO(comment.reel);
    return res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting comment", error: error.message });
  }
};

// ── DELETE REEL ──────────────────────────────────────────────
export const deleteReel = async (req, res) => {
  try {
    const reel = await getReelByIdDAO(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    if (reel.partner.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await deleteReelDAO(req.params.id);
    return res.status(200).json({ message: "Reel deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting reel", error: error.message });
  }
};
