import { uploadToImagekit } from "../services/storage.service.js"; // ❌ was default import
import {
  createFoodDAO,
  getFoodVideosDAO,
  getFoodByIdDAO,
  getAllFoodDAO,
  getFoodByCategoryDAO,
  updateFoodDAO,
  deleteFoodDAO,
  toggleFoodAvailabilityDAO,
} from "../dao/food.dao.js";

// ── CREATE FOOD ──────────────────────────────────────────────
export const createFood = async (req, res) => {
  const { name, description, price, category, store } = req.body;
  try {
    if (!req.files?.image) {
      return res.status(400).json({ message: "Food image is required" });
    }

    const imageUrl = await uploadToImagekit(req.files.image[0]);
    const videoUrl = req.files?.video
      ? await uploadToImagekit(req.files.video[0])
      : null;

    const food = await createFoodDAO({
      name,
      description,
      price,
      category,
      image: imageUrl, 
      video: videoUrl,
      foodPartner: req.partner._id,
      store,
    });

    return res
      .status(201)
      .json({ message: "Food item created successfully", food });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating food item", error: error.message });
  }
};

// ── GET ALL FOOD (reel feed) ─────────────────────────────────
export const getFoodItem = async (req, res) => {
  try {
    const foodItems = await getFoodVideosDAO();
    return res.status(200).json({ foodItems });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching food items", error: error.message });
  }
};

// ── GET FOOD BY ID ───────────────────────────────────────────
export const getFoodById = async (req, res) => {
  try {
    const food = await getFoodByIdDAO(req.params.id);
    if (!food) return res.status(404).json({ message: "Food item not found" });
    return res.status(200).json({ food });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching food item", error: error.message });
  }
};

// ── GET FOOD BY CATEGORY ─────────────────────────────────────
export const getFoodByCategory = async (req, res) => {
  try {
    const food = await getFoodByCategoryDAO(req.params.category);
    return res.status(200).json({ food });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching food by category",
      error: error.message,
    });
  }
};

// ── UPDATE FOOD ──────────────────────────────────────────────
export const updateFood = async (req, res) => {
  try {
    const food = await getFoodByIdDAO(req.params.id);
    if (!food) return res.status(404).json({ message: "Food item not found" });

    // verify food belongs to requesting partner
    if (food.foodPartner.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // prevent updating partner or store fields
    const { foodPartner, store, ...updateData } = req.body;

    const updated = await updateFoodDAO(req.params.id, updateData);
    return res
      .status(200)
      .json({ message: "Food item updated successfully", food: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating food item", error: error.message });
  }
};

// ── DELETE FOOD ──────────────────────────────────────────────
export const deleteFood = async (req, res) => {
  try {
    const food = await getFoodByIdDAO(req.params.id);
    if (!food) return res.status(404).json({ message: "Food item not found" });

    if (food.foodPartner.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await deleteFoodDAO(req.params.id);
    return res.status(200).json({ message: "Food item deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting food item", error: error.message });
  }
};

// ── TOGGLE AVAILABILITY ──────────────────────────────────────
export const toggleAvailability = async (req, res) => {
  const { isAvailable } = req.body;

  try {
    const food = await getFoodByIdDAO(req.params.id);
    if (!food) return res.status(404).json({ message: "Food item not found" });

    if (food.foodPartner.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await toggleFoodAvailabilityDAO(req.params.id, isAvailable);
    return res.status(200).json({
      message: `Food item is now ${isAvailable ? "available" : "unavailable"}`,
      food: updated,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating availability", error: error.message });
  }
};
