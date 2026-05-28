import {
  createReviewDAO,
  getReviewsByFoodDAO,
  getReviewsByStoreDAO,
  getReviewByIdDAO,
  deleteReviewDAO,
  getAverageRatingByFoodDAO,
  getAverageRatingByStoreDAO,
} from "../dao/review.dao.js";
import { updateFoodDAO } from "../dao/food.dao.js";
import { updateStoreDAO } from "../dao/store.dao.js";

// ── HELPER: update ratings after review add/delete ───────────
const updateRatings = async (foodId, storeId) => {
  const foodRating = await getAverageRatingByFoodDAO(foodId);
  await updateFoodDAO(foodId, {
    ratings: { average: foodRating.average, count: foodRating.count },
  });

  const storeRating = await getAverageRatingByStoreDAO(storeId);
  await updateStoreDAO(storeId, {
    rating: { average: storeRating.average, count: storeRating.count },
  });
};

// ── ADD REVIEW ───────────────────────────────────────────────
export const addReview = async (req, res) => {
  const { foodId, storeId, rating, comment } = req.body;

  try {
    const review = await createReviewDAO({
      user: req.user._id,
      food: foodId,
      store: storeId,
      rating,
      comment,
    });

    // update average ratings for food and store
    await updateRatings(foodId, storeId);

    return res
      .status(201)
      .json({ message: "Review added successfully", review });
  } catch (error) {
    // duplicate review — unique index on user+food throws error
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this item" });
    }
    return res
      .status(500)
      .json({ message: "Error adding review", error: error.message });
  }
};

// ── GET FOOD REVIEWS ─────────────────────────────────────────
export const getFoodReviews = async (req, res) => {
  try {
    const reviews = await getReviewsByFoodDAO(req.params.foodId);
    return res.status(200).json({ reviews });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

// ── GET STORE REVIEWS ────────────────────────────────────────
export const getStoreReviews = async (req, res) => {
  try {
    const reviews = await getReviewsByStoreDAO(req.params.storeId);
    return res.status(200).json({ reviews });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

// ── DELETE REVIEW ────────────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const review = await getReviewByIdDAO(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // verify review belongs to requesting user
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { food, store } = review;
    await deleteReviewDAO(req.params.id);

    // recalculate ratings after deletion
    await updateRatings(food, store);

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
};
