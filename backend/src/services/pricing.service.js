import config from "../config/config.js";

/**
 * Pricing service: handles all money calculations server-side.
 * All amounts are computed in paise (smallest currency unit) to avoid floating-point errors.
 * The TAX_RATE is a decimal (e.g., 0.05 for 5%).
 */

/**
 * Compute order totals from cart items.
 * Reloads food prices from DB to prevent tampering.
 * @param {Array} cartItems - Array of {food: ObjectId, quantity: Number}
 * @param {Model} FoodModel - Mongoose Food model
 * @returns {Promise<{subtotalPaise, taxPaise, totalPaise, items}>}
 */
export async function computeOrderTotals(cartItems, FoodModel) {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  // Load all food documents by ID (handling unpopulated ObjectId or populated object)
  const foodIds = cartItems
    .map((item) => (item.food?._id ? item.food._id : item.food))
    .filter(Boolean);
  const foods = await FoodModel.find({ _id: { $in: foodIds } });

  if (foods.length !== cartItems.length) {
    throw new Error("Some food items not found");
  }

  // Build a map for quick lookup
  const foodMap = new Map(foods.map((f) => [f._id.toString(), f]));

  // Validate each item and compute subtotal
  let subtotalPaise = 0;
  const items = [];

  for (const cartItem of cartItems) {
    const rawFood = cartItem.food;
    const foodId = (rawFood?._id ? rawFood._id : rawFood)?.toString();
    const food = foodMap.get(foodId);

    if (!food) {
      throw new Error(`Food item ${foodId} not found`);
    }

    if (!food.isAvailable) {
      throw new Error(`${food.name} is currently unavailable`);
    }

    // Price in rupees from DB, convert to paise
    const pricePaise = Math.round(food.price * 100);
    const itemTotalPaise = pricePaise * cartItem.quantity;

    subtotalPaise += itemTotalPaise;

    items.push({
      food: food._id,
      name: food.name,
      quantity: cartItem.quantity,
      price: food.price, // Store in rupees for display
    });
  }

  // Compute tax in paise
  const taxPaise = Math.round(subtotalPaise * config.TAX_RATE);
  const totalPaise = subtotalPaise + taxPaise;

  return {
    subtotalPaise,
    taxPaise,
    totalPaise,
    subtotal: subtotalPaise / 100,
    tax: taxPaise / 100,
    total: totalPaise / 100,
    items,
  };
}

/**
 * Validate that all cart items belong to the same store and the store is open.
 * @param {Array} foods - Array of Food documents
 * @param {ObjectId} expectedStoreId - The store ID from cart
 * @param {Model} StoreModel - Mongoose Store model
 * @returns {Promise<void>}
 */
export async function validateStoreAndAvailability(
  foods,
  expectedStoreId,
  StoreModel,
) {
  // Check all foods belong to the same store
  const storeIds = new Set(foods.map((f) => f.store.toString()));

  if (storeIds.size > 1) {
    throw new Error("Cart contains items from multiple stores");
  }

  const storeId = Array.from(storeIds)[0];

  if (storeId !== expectedStoreId.toString()) {
    throw new Error("Cart store mismatch");
  }

  // Check store is open
  const store = await StoreModel.findById(storeId);

  if (!store) {
    throw new Error("Store not found");
  }

  if (!store.isOpen) {
    throw new Error(`${store.name} is currently closed`);
  }

  return store;
}
