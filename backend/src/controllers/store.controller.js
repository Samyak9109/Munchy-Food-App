import {
  createStoreDAO,
  getStoreByIdDAO,
  getAllStoresDAO,
  updateStoreDAO,
  deleteStoreDAO,
  toggleStoreStatusDAO,
  getStoreWithMenuDAO,
} from "../dao/store.dao.js";
import { getFoodByStoreDAO } from "../dao/food.dao.js";
import { uploadToImagekit } from "../utils/imagekit.js";
import partnerModel from "../models/partner.model.js";

// ── CREATE STORE ─────────────────────────────────────────────
export const createStore = async (req, res) => {
  const { name, address, description, cuisine, timing, coordinates } = req.body;

  try {
    const store = await createStoreDAO({
      name,
      address,
      description,
      cuisine,
      timing,
      coordinates,
      location: {
        type: "Point",
        coordinates: [coordinates.lng, coordinates.lat], 
      },
      partner: req.partner._id,
    });

    // push store id into partner's stores array
    await partnerModel.findByIdAndUpdate(req.partner._id, {
      $push: { stores: store._id },
    });

    return res
      .status(201)
      .json({ message: "Store created successfully", store });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating store", error: error.message });
  }
};

// ── GET STORE BY ID ──────────────────────────────────────────
export const getStoreById = async (req, res) => {
  try {
    const store = await getStoreByIdDAO(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    return res.status(200).json({ store });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching store", error: error.message });
  }
};

// ── GET ALL STORES ───────────────────────────────────────────
export const getAllStores = async (req, res) => {
  try {
    const stores = await getAllStoresDAO();
    return res.status(200).json({ stores });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching stores", error: error.message });
  }
};

// ── GET STORE MENU ───────────────────────────────────────────
export const getStoreMenu = async (req, res) => {
  try {
    const store = await getStoreByIdDAO(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const menu = await getFoodByStoreDAO(req.params.id);
    return res.status(200).json({ store, menu });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching menu", error: error.message });
  }
};

// ── UPDATE STORE ─────────────────────────────────────────────
export const updateStore = async (req, res) => {
  try {
    const store = await getStoreByIdDAO(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // verify store belongs to requesting partner
    if (store.partner._id.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await updateStoreDAO(req.params.id, req.body);
    return res
      .status(200)
      .json({ message: "Store updated successfully", store: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating store", error: error.message });
  }
};

// ── DELETE STORE ─────────────────────────────────────────────
export const deleteStore = async (req, res) => {
  try {
    const store = await getStoreByIdDAO(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.partner._id.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await deleteStoreDAO(req.params.id);

    // remove store from partner's stores array
    await partnerModel.findByIdAndUpdate(req.partner._id, {
      $pull: { stores: req.params.id },
    });

    return res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting store", error: error.message });
  }
};

// ── TOGGLE STORE STATUS ──────────────────────────────────────
export const toggleStoreStatus = async (req, res) => {
  const { isOpen } = req.body;

  try {
    const store = await getStoreByIdDAO(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.partner._id.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await toggleStoreStatusDAO(req.params.id, isOpen);
    return res.status(200).json({
      message: `Store is now ${isOpen ? "open" : "closed"}`,
      store: updated,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating store status", error: error.message });
  }
};

// ── UPLOAD STORE IMAGE ───────────────────────────────────────
export const uploadStoreImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const store = await getStoreByIdDAO(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.partner._id.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const imageUrl = await uploadToImagekit(req.file);
    const updated = await updateStoreDAO(req.params.id, { image: imageUrl });

    return res
      .status(200)
      .json({ message: "Image uploaded successfully", store: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error uploading image", error: error.message });
  }
};
