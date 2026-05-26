import {
  getUserByIdDAO,
  updateUserDAO,
  deleteUserDAO,
} from "../dao/user.dao.js";
import sessionModel from "../models/session.model.js";

// ── GET PROFILE ──────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await getUserByIdDAO(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

// ── UPDATE PROFILE ───────────────────────────────────────────
export const updateProfile = async (req, res) => {
  // only allow these fields to be updated
  const { name, phone, avatar } = req.body;

  try {
    const updated = await updateUserDAO(req.user._id, { name, phone, avatar });
    return res
      .status(200)
      .json({ message: "Profile updated successfully", user: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// ── DELETE ACCOUNT ───────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    // revoke all sessions first
    await sessionModel.updateMany({ userId: req.user._id }, { revoked: true });

    await deleteUserDAO(req.user._id);

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting account", error: error.message });
  }
};
