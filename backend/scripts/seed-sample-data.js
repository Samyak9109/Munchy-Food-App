import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import foodModel from "../src/models/food.model.js";
import partnerModel from "../src/models/partner.model.js";
import storeModel from "../src/models/store.model.js";

dotenv.config();

const SAMPLE_SUFFIX = "(Sample)";
const samplePartnerEmail =
  process.env.SEED_PARTNER_EMAIL || "sample.partner@munchy.local";
const samplePartnerPassword =
  process.env.SEED_PARTNER_PASSWORD || "SamplePartner123!";

const restaurants = [
  {
    name: `Spice Route Kitchen ${SAMPLE_SUFFIX}`,
    description:
      "North Indian comfort food, biryani, and street-food favorites prepared for quick pickup.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    address: "100 Feet Road, Indiranagar, Bengaluru, Karnataka",
    cuisine: ["North Indian", "Biryani", "Street Food"],
    coordinates: { lat: 12.9784, lng: 77.6408 },
    timing: { open: "10:00", close: "23:00" },
    isOpen: true,
    rating: { average: 4.6, count: 128 },
    menu: [
      {
        name: `Paneer Tikka Bowl ${SAMPLE_SUFFIX}`,
        description: "Smoky paneer tikka, jeera rice, onions, and mint chutney.",
        price: 249,
        category: ["lunch", "dinner"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=900&q=80",
        ratings: { average: 4.7, count: 42 },
      },
      {
        name: `Butter Chicken Combo ${SAMPLE_SUFFIX}`,
        description: "Creamy butter chicken served with rice and two rotis.",
        price: 329,
        category: ["lunch", "dinner"],
        isVeg: false,
        image:
          "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=80",
        ratings: { average: 4.8, count: 57 },
      },
      {
        name: `Veg Dum Biryani ${SAMPLE_SUFFIX}`,
        description: "Aromatic basmati rice layered with vegetables and spices.",
        price: 219,
        category: ["lunch", "dinner"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900&q=80",
        ratings: { average: 4.5, count: 36 },
      },
      {
        name: `Masala Chai ${SAMPLE_SUFFIX}`,
        description: "Freshly brewed tea with milk, ginger, cardamom, and spices.",
        price: 59,
        category: ["breakfast", "drinks"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=900&q=80",
        ratings: { average: 4.4, count: 21 },
      },
    ],
  },
  {
    name: `Green Bowl Cafe ${SAMPLE_SUFFIX}`,
    description:
      "Fresh salads, protein bowls, breakfast plates, smoothies, and vegetarian options.",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80",
    address: "5th Block, Koramangala, Bengaluru, Karnataka",
    cuisine: ["Healthy", "Cafe", "Continental"],
    coordinates: { lat: 12.9352, lng: 77.6245 },
    timing: { open: "08:00", close: "22:00" },
    isOpen: true,
    rating: { average: 4.4, count: 94 },
    menu: [
      {
        name: `Protein Power Bowl ${SAMPLE_SUFFIX}`,
        description: "Quinoa, grilled paneer, chickpeas, vegetables, and tahini.",
        price: 289,
        category: ["lunch", "dinner"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=900&q=80",
        ratings: { average: 4.6, count: 39 },
      },
      {
        name: `Avocado Toast ${SAMPLE_SUFFIX}`,
        description: "Sourdough toast with avocado, tomato, seeds, and herbs.",
        price: 239,
        category: ["breakfast", "snacks"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=900&q=80",
        ratings: { average: 4.3, count: 28 },
      },
      {
        name: `Mediterranean Salad ${SAMPLE_SUFFIX}`,
        description: "Lettuce, olives, cucumber, tomato, feta, and lemon dressing.",
        price: 259,
        category: ["lunch", "dinner"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&q=80",
        ratings: { average: 4.5, count: 31 },
      },
      {
        name: `Berry Smoothie ${SAMPLE_SUFFIX}`,
        description: "Mixed berries, banana, yogurt, and chia seeds.",
        price: 179,
        category: ["breakfast", "drinks"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=900&q=80",
        ratings: { average: 4.6, count: 24 },
      },
    ],
  },
  {
    name: `Midnight Bites ${SAMPLE_SUFFIX}`,
    description:
      "Burgers, pizza, loaded snacks, and desserts for evening and late-night cravings.",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80",
    address: "27th Main Road, HSR Layout, Bengaluru, Karnataka",
    cuisine: ["Fast Food", "Pizza", "Desserts"],
    coordinates: { lat: 12.9116, lng: 77.6389 },
    timing: { open: "12:00", close: "23:59" },
    isOpen: true,
    rating: { average: 4.3, count: 156 },
    menu: [
      {
        name: `Classic Smash Burger ${SAMPLE_SUFFIX}`,
        description: "Double chicken patty, cheese, pickles, onions, and house sauce.",
        price: 299,
        category: ["lunch", "dinner", "snacks"],
        isVeg: false,
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80",
        ratings: { average: 4.7, count: 63 },
      },
      {
        name: `Margherita Pizza ${SAMPLE_SUFFIX}`,
        description: "Stone-baked pizza with tomato, mozzarella, and fresh basil.",
        price: 279,
        category: ["lunch", "dinner", "snacks"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80",
        ratings: { average: 4.5, count: 48 },
      },
      {
        name: `Loaded Masala Fries ${SAMPLE_SUFFIX}`,
        description: "Crispy fries with masala seasoning, cheese sauce, and jalapenos.",
        price: 169,
        category: ["snacks"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900&q=80",
        ratings: { average: 4.2, count: 34 },
      },
      {
        name: `Chocolate Brownie Sundae ${SAMPLE_SUFFIX}`,
        description: "Warm chocolate brownie with vanilla ice cream and fudge sauce.",
        price: 199,
        category: ["desserts"],
        isVeg: true,
        image:
          "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900&q=80",
        ratings: { average: 4.8, count: 52 },
      },
    ],
  },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Add it to backend/.env.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PRODUCTION_SEED !== "true"
  ) {
    throw new Error(
      "Production seeding is disabled. Set ALLOW_PRODUCTION_SEED=true only for an intentional production seed.",
    );
  }

  await mongoose.connect(process.env.MONGO_URI);

  const password = await bcrypt.hash(samplePartnerPassword, 10);
  const partner = await partnerModel.findOneAndUpdate(
    { email: samplePartnerEmail },
    {
      $set: {
        name: `Munchy Demo Partner ${SAMPLE_SUFFIX}`,
        password,
        phone: "9999999999",
        isVerified: true,
        isActive: true,
        role: "partner",
      },
      $setOnInsert: {
        stores: [],
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );

  const storeIds = [];

  for (const restaurant of restaurants) {
    const { menu, coordinates, ...storeData } = restaurant;
    const store = await storeModel.findOneAndUpdate(
      { partner: partner._id, name: restaurant.name },
      {
        $set: {
          ...storeData,
          coordinates,
          location: {
            type: "Point",
            coordinates: [coordinates.lng, coordinates.lat],
          },
          partner: partner._id,
        },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );

    storeIds.push(store._id);

    for (const item of menu) {
      await foodModel.findOneAndUpdate(
        { store: store._id, name: item.name },
        {
          $set: {
            ...item,
            store: store._id,
            Partner: partner._id,
            isAvailable: true,
          },
        },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
      );
    }
  }

  await partnerModel.findByIdAndUpdate(partner._id, {
    $addToSet: { stores: { $each: storeIds } },
  });

  const [storedRestaurantCount, storedFoodCount] = await Promise.all([
    storeModel.countDocuments({
      _id: { $in: storeIds },
      name: { $regex: /\(Sample\)$/ },
    }),
    foodModel.countDocuments({
      store: { $in: storeIds },
      name: { $regex: /\(Sample\)$/ },
    }),
  ]);

  console.log(`Seeded ${storedRestaurantCount} sample restaurants.`);
  console.log(`Seeded ${storedFoodCount} sample menu items.`);
  console.log(`Sample partner email: ${samplePartnerEmail}`);
  console.log(`Sample partner password: ${samplePartnerPassword}`);
}

seed()
  .catch((error) => {
    console.error(`Sample seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
