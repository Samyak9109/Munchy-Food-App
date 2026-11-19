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
import { uploadToImagekit } from "../services/storage.service.js";
import partnerModel from "../models/partner.model.js";

// ── CREATE STORE ─────────────────────────────────────────────
export const createStore = async (req, res) => {
  const { name, address, description, cuisine, timing, latitude, longitude } =
    req.body;

  const lat = Number(latitude);
  const lng = Number(longitude);

  // Guard against [0,0] slipping through (belt-and-suspenders)
  if (lat === 0 && lng === 0) {
    return res
      .status(400)
      .json({ message: "Store location cannot be [0,0]" });
  }

  try {
    const store = await createStoreDAO({
      name,
      address,
      description,
      cuisine,
      timing,
      location: {
        type: "Point",
        coordinates: [lng, lat],
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

// ── GET MY STORE (partner self-lookup) ──────────────────────────
// Lets the frontend heal stale sessions where user.stores[] is undefined.
export const getMyStore = async (req, res) => {
  try {
    const { getStoreByPartnerDAO } = await import("../dao/store.dao.js");
    const stores = await getStoreByPartnerDAO(req.partner._id);
    const store = stores?.[0] || null;
    return res.status(200).json({ store });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching store", error: error.message });
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

    // Whitelist only the fields the partner is allowed to change.
    // Never pass raw req.body to the DAO — it could carry location or
    // partner fields that would silently overwrite the 2dsphere index.
    const updateData = {};
    for (const key of ["name", "address", "description", "cuisine", "timing", "image"]) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    // If the partner moves the pin, rebuild the GeoJSON location so the
    // 2dsphere index and $geoNear queries pick up the new position.
    if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
      const lat = Number(req.body.latitude);
      const lng = Number(req.body.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ message: "latitude and longitude must be numbers" });
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      if (lat === 0 && lng === 0) {
        return res.status(400).json({ message: "Store location cannot be [0,0]" });
      }
      updateData.location = {
        type: "Point",
        coordinates: [lng, lat],
      };
      updateData.needsLocation = false;
    }

    const updated = await updateStoreDAO(req.params.id, updateData);
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
  try {
    const store = await getStoreByIdDAO(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (store.partner._id.toString() !== req.partner._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Flip the current status — frontend sends no body, it's a pure toggle
    const newStatus = !store.isOpen;
    const updated = await toggleStoreStatusDAO(req.params.id, newStatus);
    return res.status(200).json({
      message: `Store is now ${newStatus ? "open" : "closed"}`,
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
