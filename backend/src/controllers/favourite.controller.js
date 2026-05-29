import {
  createFavoriteDAO,
  deleteFavoriteDAO,
  getFavoriteDAO,
  getFavoritesByUserDAO,
} from "../dao/favourite.dao.js";

// ── TOGGLE FAVORITE ──────────────────────────────────────────
export const toggleFavorite = async (req, res) => {
  try {
    const existing = await getFavoriteDAO(req.user._id, req.params.storeId);

    if (existing) {
      await deleteFavoriteDAO(req.user._id, req.params.storeId);
      return res.status(200).json({ message: "Store removed from favorites" });
    } else {
      await createFavoriteDAO(req.user._id, req.params.storeId);
      return res.status(201).json({ message: "Store added to favorites" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error toggling favorite", error: error.message });
  }
};

// ── GET FAVORITES ────────────────────────────────────────────
export const getFavorites = async (req, res) => {
  try {
    const favorites = await getFavoritesByUserDAO(req.user._id);
    return res.status(200).json({ favorites });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching favorites", error: error.message });
  }
};
