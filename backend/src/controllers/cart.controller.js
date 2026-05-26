import {
  createCartDAO,
  getCartByUserDAO,
  addItemToCartDAO,
  updateItemQtyDAO,
  removeItemFromCartDAO,
  clearCartDAO,
  updateTotalPriceDAO,
} from "../dao/cart.dao.js";
import { getFoodByIdDAO } from "../dao/food.dao.js";

// ── HELPER: recalculate total price ─────────────────────────
const recalculateTotal = async (userId) => {
  const cart = await getCartByUserDAO(userId);
  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  await updateTotalPriceDAO(userId, total);
  return total;
};

// ── GET CART ─────────────────────────────────────────────────
export const getCart = async (req, res) => {
  try {
    const cart = await getCartByUserDAO(req.user._id);
    if (!cart)
      return res.status(200).json({ message: "Cart is empty", cart: null });
    return res.status(200).json({ cart });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching cart", error: error.message });
  }
};

// ── ADD TO CART ──────────────────────────────────────────────
export const addToCart = async (req, res) => {
  const { foodId, quantity = 1 } = req.body;

  try {
    // get food details
    const food = await getFoodByIdDAO(foodId);
    if (!food) return res.status(404).json({ message: "Food item not found" });
    if (!food.isAvailable)
      return res.status(400).json({ message: "Food item is not available" });

    let cart = await getCartByUserDAO(req.user._id);

    if (!cart) {
      // create new cart for this store
      cart = await createCartDAO(req.user._id, food.store._id);
    } else {
      // check if ordering from same store
      if (cart.store._id.toString() !== food.store._id.toString()) {
        return res.status(400).json({
          message:
            "Cannot order from different stores in same cart. Clear cart first.",
        });
      }

      // check if item already in cart — update qty instead
      const existingItem = cart.items.find(
        (item) => item.food._id.toString() === foodId,
      );

      if (existingItem) {
        await updateItemQtyDAO(
          req.user._id,
          foodId,
          existingItem.quantity + quantity,
        );
        await recalculateTotal(req.user._id);
        const updated = await getCartByUserDAO(req.user._id);
        return res.status(200).json({ message: "Cart updated", cart: updated });
      }
    }

    // add new item to cart
    await addItemToCartDAO(req.user._id, {
      food: foodId,
      quantity,
      price: food.price, // price from DB — not from frontend
    });

    await recalculateTotal(req.user._id);
    const updated = await getCartByUserDAO(req.user._id);
    return res
      .status(200)
      .json({ message: "Item added to cart", cart: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding to cart", error: error.message });
  }
};

// ── UPDATE QUANTITY ──────────────────────────────────────────
export const updateQty = async (req, res) => {
  const { foodId, quantity } = req.body;

  try {
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    await updateItemQtyDAO(req.user._id, foodId, quantity);
    await recalculateTotal(req.user._id);

    const updated = await getCartByUserDAO(req.user._id);
    return res.status(200).json({ message: "Quantity updated", cart: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating quantity", error: error.message });
  }
};

// ── REMOVE ITEM ──────────────────────────────────────────────
export const removeItem = async (req, res) => {
  try {
    await removeItemFromCartDAO(req.user._id, req.params.foodId);
    await recalculateTotal(req.user._id);

    const updated = await getCartByUserDAO(req.user._id);
    return res
      .status(200)
      .json({ message: "Item removed from cart", cart: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error removing item", error: error.message });
  }
};

// ── CLEAR CART ───────────────────────────────────────────────
export const clearCart = async (req, res) => {
  try {
    await clearCartDAO(req.user._id);
    return res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error clearing cart", error: error.message });
  }
};
