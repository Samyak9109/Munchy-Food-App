# Munchy — Full Project Context Document
> Paste this into a new Claude session to continue with full context.

---

## What is Munchy?
A full-scale Zomato clone built as a MERN stack resume project with two extra features:
1. **Instagram-like Reels** — food partners upload short video reels for their food items
2. **AI Chatbot** — recommends food based on the user's mood

The app does **NOT** deliver food. Users order online and **pick up themselves**.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js v22 |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Password hashing | bcrypt (passwords), SHA-256/crypto (refresh tokens) |
| File uploads | Multer (memoryStorage) + ImageKit (@imagekit/nodejs) |
| Email | Nodemailer (not built yet) |
| Maps | Not decided yet (Google Maps API or OpenStreetMap) |
| Payment | Not decided yet (Razorpay recommended for India) |
| AI Chatbot | Not decided yet |
| Module system | ES Modules (import/export) — NOT CommonJS |

---

## Key Architecture Decisions
1. **ES Modules** — all files use `import/export`, not `require/module.exports`
2. **DAO pattern** — all DB queries go through DAO files, controllers never touch models directly
3. **Validators as middleware** — validation runs before controller via Express middleware chain
4. **Role-based auth** — JWT contains `userId`, `role` ("user" or "partner"), `sessionID`
5. **Sessions in DB** — refresh tokens stored as SHA-256 hashes in sessionModel for revocation
6. **Access token** — 15min expiry, sent in response body, passed in `Authorization: Bearer` header
7. **Refresh token** — 7d expiry, sent as HttpOnly cookie
8. **ImageKit upload** — multer memoryStorage → write buffer to temp file → fs.createReadStream → ImageKit (Blob and buffer methods don't work with current SDK version)
9. **Separate login routes** — `/api/auth/user/login` and `/api/auth/partner/login` — same controller, role derived from URL via `req.path.includes("partner")`
10. **Video required, image optional** — app is reel-based, every food item needs a video

---

## Completed Files

### config/config.js
```javascript
// reads all env variables — structure assumed, not shown in session
// keys used: JWT_SECRET, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT
```

### models/session.model.js
```javascript
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    role: {
      type: String,
      enum: ["user", "partner"],
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
```

### models/food.model.js
```javascript
import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: [String],
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snacks", "drinks", "desserts"],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Please provide at least one category",
      },
    },
    image: { type: String },           // optional
    video: { type: String, required: true }, // required — app is reel-based
    foodPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodPartner",
      required: true,
    },
    isAvailable: { type: Boolean, default: true },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Food", foodSchema);
```

### controllers/auth.controller.js
```javascript
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sessionModel from "../models/session.model.js";
import foodPartnerModel from "../models/foodPartner.model.js";

function getModelByRole(role) {
  if (role === "user")    return userModel;
  if (role === "partner") return foodPartnerModel;
  return null;
}

// SHA-256 for refresh tokens — deterministic so we can look it up in DB
// bcrypt is non-deterministic (new salt every call) so can't be used for DB lookup
function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function registerUser(req, res) {
  const { name, email, password } = req.body;
  try {
    if (await userModel.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await userModel.create({
      name, email,
      password: await bcrypt.hash(password, 10),
    });
    const refreshToken = jwt.sign({ userId: user._id, role: "user" }, config.JWT_SECRET, { expiresIn: "7d" });
    const session = await sessionModel.create({
      userId: user._id, role: "user",
      refreshToken: hashRefreshToken(refreshToken),
      ip: req.ip, userAgent: req.headers["user-agent"],
    });
    const accessToken = jwt.sign(
      { userId: user._id, sessionID: session._id, role: "user" },
      config.JWT_SECRET, { expiresIn: "15m" }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, secure: true, sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({
      message: "User registered successfully",
      account: { id: user._id, username: user.name, email: user.email, role: "user" },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error registering user", error: error.message });
  }
}

async function registerFoodPartner(req, res) {
  const { name, email, password } = req.body;
  try {
    if (await foodPartnerModel.findOne({ email })) {
      return res.status(400).json({ message: "Account already exists" });
    }
    const partner = await foodPartnerModel.create({
      name, email,
      password: await bcrypt.hash(password, 10),
    });
    const refreshToken = jwt.sign({ userId: partner._id, role: "partner" }, config.JWT_SECRET, { expiresIn: "7d" });
    const session = await sessionModel.create({
      userId: partner._id, role: "partner",
      refreshToken: hashRefreshToken(refreshToken),
      ip: req.ip, userAgent: req.headers["user-agent"],
    });
    const accessToken = jwt.sign(
      { userId: partner._id, sessionID: session._id, role: "partner" },
      config.JWT_SECRET, { expiresIn: "15m" }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, secure: true, sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({
      message: "Food partner registered successfully",
      account: { id: partner._id, username: partner.name, email: partner.email, role: "partner" },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error registering food partner", error: error.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  // role derived from URL — /user/login or /partner/login
  const role = req.path.includes("partner") ? "partner" : "user";
  const model = getModelByRole(role);
  try {
    const account = await model.findOne({ email });
    if (!account) return res.status(404).json({ message: "Account not found" });
    if (!await bcrypt.compare(password, account.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const refreshToken = jwt.sign({ userId: account._id, role }, config.JWT_SECRET, { expiresIn: "7d" });
    const session = await sessionModel.create({
      userId: account._id, role,
      refreshToken: hashRefreshToken(refreshToken),
      ip: req.ip, userAgent: req.headers["user-agent"],
    });
    const accessToken = jwt.sign(
      { userId: account._id, sessionID: session._id, role },
      config.JWT_SECRET, { expiresIn: "15m" }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, secure: true, sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      message: "Logged in successfully",
      account: { id: account._id, username: account.name, email: account.email, role },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error: error.message });
  }
}

async function logout(req, res) {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) return res.status(401).json({ message: "Unauthorized" });
  try {
    const session = await sessionModel.findOne({
      refreshToken: hashRefreshToken(incomingRefreshToken),
      revoked: false,
    });
    if (!session) return res.status(400).json({ message: "Invalid or already revoked session" });
    session.revoked = true;
    await session.save();
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error logging out", error: error.message });
  }
}

export { registerUser, registerFoodPartner, login, logout };
```

### middlewares/auth.middleware.js
```javascript
import foodPartnerModel from "../models/foodPartner.model.js";
import jwt from "jsonwebtoken";

export const authFoodPartner = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please login to access this resource" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "partner") {
      return res.status(403).json({ message: "Access denied" });
    }
    const foodPartner = await foodPartnerModel.findById(decoded.userId);
    if (!foodPartner) return res.status(401).json({ message: "Account not found" });
    req.foodPartner = foodPartner;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
```

### middlewares/multer.middleware.js
```javascript
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

export default upload;
```

### utils/imagekit.js
```javascript
import config from "../config/config.js";
import ImageKit from "@imagekit/nodejs";
import fs from "fs";
import os from "os";
import path from "path";

const client = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  publicKey: config.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT,
});

export const uploadToImagekit = async (file) => {
  // IMPORTANT: Blob and buffer methods don't work with current SDK
  // Must write to temp file and stream — only method that works
  const tempPath = path.join(os.tmpdir(), `${Date.now()}_${file.originalname}`);
  try {
    fs.writeFileSync(tempPath, file.buffer);
    const result = await client.files.upload({
      file: fs.createReadStream(tempPath),
      fileName: `${Date.now()}_${file.originalname}`,
      folder: "/food-delivery",
      useUniqueFileName: true,
    });
    return result.url;
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
};

export const checkImageKitHealth = async () => {
  try {
    await client.files.list({ limit: 1 });
    return true;
  } catch (error) {
    throw new Error("ImageKit connection failed");
  }
};
```

### dao/food.dao.js
```javascript
import foodModel from "../models/food.model.js";

export const createFoodDAO = async (foodData) => await foodModel.create(foodData);
export const getAllFoodDAO = async () => await foodModel.find({ isAvailable: true });
export const getFoodByIdDAO = async (id) => await foodModel.findById(id);
export const getFoodByPartnerDAO = async (partnerId) => await foodModel.find({ foodPartner: partnerId, isAvailable: true });
export const getFoodByCategoryDAO = async (category) => await foodModel.find({ category: { $in: [category] }, isAvailable: true });
export const updateFoodDAO = async (id, updateData) => await foodModel.findByIdAndUpdate(id, updateData, { new: true });
export const deleteFoodDAO = async (id) => await foodModel.findByIdAndDelete(id);
export const toggleFoodAvailabilityDAO = async (id, isAvailable) => await foodModel.findByIdAndUpdate(id, { isAvailable }, { new: true });
```

### validators/food.validator.js
```javascript
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_CATEGORIES  = ["breakfast", "lunch", "dinner", "snacks", "drinks", "desserts"];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const validateCreateFood = (req, res, next) => {
  const { name, description, price, category } = req.body;
  const errors = [];

  if (!name || name.trim() === "") errors.push("Name is required");
  else if (name.length > 100) errors.push("Name must be under 100 characters");

  if (!description || description.trim() === "") errors.push("Description is required");
  else if (description.length > 500) errors.push("Description must be under 500 characters");

  if (!price) errors.push("Price is required");
  else if (isNaN(price) || Number(price) <= 0) errors.push("Price must be a positive number");
  else if (Number(price) > 10000) errors.push("Price cannot exceed 10,000");

  if (!category) {
    errors.push("At least one category is required");
  } else {
    const categories = Array.isArray(category) ? category : [category];
    const invalidCategories = categories.filter(c => !ALLOWED_CATEGORIES.includes(c));
    if (invalidCategories.length > 0) {
      errors.push(`Invalid categories: ${invalidCategories.join(", ")}. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`);
    }
  }

  if (!req.files?.video) {
    errors.push("Video is required");
  } else {
    const video = req.files.video[0];
    if (!ALLOWED_VIDEO_TYPES.includes(video.mimetype)) errors.push("Invalid video format. Allowed: mp4, webm, quicktime");
    if (video.size > MAX_VIDEO_SIZE) errors.push("Video size must be under 100MB");
  }

  if (req.files?.image) {
    const image = req.files.image[0];
    if (!ALLOWED_IMAGE_TYPES.includes(image.mimetype)) errors.push("Invalid image format. Allowed: jpeg, png, webp");
    if (image.size > MAX_IMAGE_SIZE) errors.push("Image size must be under 5MB");
  }

  if (errors.length > 0) return res.status(400).json({ message: "Validation failed", errors });
  next();
};
```

### controllers/food.controller.js
```javascript
import { uploadToImagekit } from "../utils/imagekit.js";
import { createFoodDAO } from "../dao/food.dao.js";

export const createFood = async (req, res) => {
  const { name, description, price, category } = req.body;
  try {
    const videoUrl = await uploadToImagekit(req.files.video[0]);
    const imageUrl = req.files?.image ? await uploadToImagekit(req.files.image[0]) : null;
    const food = await createFoodDAO({
      name, description, price, category,
      image: imageUrl,
      video: videoUrl,
      foodPartner: req.foodPartner._id,
    });
    return res.status(201).json({ message: "Food item created successfully", food });
  } catch (error) {
    console.error("Food creation error:", error);
    return res.status(500).json({ message: "Error creating food item", error: error.message });
  }
};
```

### routes/auth.routes.js
```javascript
import express from "express";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/user/register",    authController.registerUser);
router.post("/partner/register", authController.registerFoodPartner);
router.post("/user/login",       authController.login);
router.post("/partner/login",    authController.login);
router.post("/logout",           authController.logout);

export default router;
```

### routes/food.routes.js
```javascript
import express from "express";
import { authFoodPartner } from "../middlewares/auth.middleware.js";
import * as foodController from "../controllers/food.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { validateCreateFood } from "../validators/food.validator.js";

const router = express.Router();

// flow: auth → multer → validate → controller
router.post("/addFood",
  authFoodPartner,
  upload.fields([{ name: "video", maxCount: 1 }, { name: "image", maxCount: 1 }]),
  validateCreateFood,
  foodController.createFood
);

export default router;
```

---

## package.json
```json
{
  "name": "munchy-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "@imagekit/nodejs": "latest",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.6",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5",
    "nodemailer": "^6.9.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## .env keys needed
```
PORT=5000
MONGO_URI=
JWT_SECRET=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_URL_ENDPOINT=
EMAIL_USER=
EMAIL_PASS=
RAZORPAY_KEY_ID=           (when payment is added)
RAZORPAY_KEY_SECRET=       (when payment is added)
GOOGLE_MAPS_API_KEY=       (when map is added)
```

---

## Models Still To Build
```
address.model.js
  - user        → ObjectId ref User
  - label       → String enum [home, work, other]
  - coordinates → { lat: Number, lng: Number }
  - fullAddress → String
  - isDefault   → Boolean default false

cart.model.js
  - user        → ObjectId ref User
  - store       → ObjectId ref Store
  - items       → [{ food: ObjectId ref Food, quantity: Number, price: Number }]
  - totalPrice  → Number default 0

order.model.js
  - user        → ObjectId ref User
  - store       → ObjectId ref Store
  - items       → [{ food: ObjectId ref Food, quantity: Number, price: Number }]
  - totalPrice  → Number
  - status      → String enum [placed, confirmed, ready, pickedup, cancelled]
  - payment     → ObjectId ref Payment
  - pickupTime  → Date
  - otp         → String (hashed 6-digit, for pickup verification)

review.model.js
  - user        → ObjectId ref User
  - food        → ObjectId ref Food
  - store       → ObjectId ref Store
  - rating      → Number min 1 max 5
  - comment     → String

reel.model.js
  - food        → ObjectId ref Food
  - partner     → ObjectId ref FoodPartner
  - video       → String (imagekit url)
  - caption     → String
  - likes       → Number default 0
  - views       → Number default 0

comment.model.js
  - reel        → ObjectId ref Reel
  - user        → ObjectId ref User
  - text        → String

like.model.js
  - reel        → ObjectId ref Reel
  - user        → ObjectId ref User
  (unique compound index on reel + user — one like per user per reel)

favorite.model.js
  - user        → ObjectId ref User
  - store       → ObjectId ref Store

payment.model.js
  - user        → ObjectId ref User
  - order       → ObjectId ref Order
  - amount      → Number
  - status      → String enum [pending, success, failed]
  - method      → String enum [card, upi, cash]
  - gateway     → String
  - gatewayId   → String

store.model.js
  - partner     → ObjectId ref FoodPartner
  - name        → String required
  - description → String
  - image       → String
  - coordinates → { lat: Number, lng: Number }
  - address     → String
  - timing      → { open: String, close: String }
  - isOpen      → Boolean default false
  - rating      → { average: Number default 0, count: Number default 0 }

otp.model.js
  - email       → String required
  - otp         → String required (hashed with bcrypt)
  - purpose     → String enum [register, resetPassword, orderPickup]
  - expiresAt   → Date (10 min from creation)
  - used        → Boolean default false
```

---

## Full API Routes Plan
```
AUTH /api/auth
  POST /user/register
  POST /partner/register
  POST /user/login
  POST /partner/login
  POST /logout
  POST /forgot-password      (sends OTP to email)
  POST /reset-password       (verifies OTP + sets new password)
  POST /verify-email         (OTP on registration)

USER /api/user
  GET  /profile
  PUT  /profile
  POST /address
  GET  /address
  PUT  /address/:id
  DELETE /address/:id

STORE /api/store
  GET  /                     all stores
  GET  /:id                  single store
  GET  /:id/menu             store food menu
  GET  /nearby               stores near user coordinates
  PUT  /                     partner updates own store (auth: partner)

FOOD /api/food
  POST /addFood              (auth: partner) ✅ done
  GET  /                     all food
  GET  /:id                  single food item
  PUT  /:id                  partner updates food (auth: partner)
  DELETE /:id                partner deletes food (auth: partner)
  PATCH /:id/availability    toggle available/unavailable (auth: partner)

CART /api/cart               (auth: user)
  GET  /                     get user cart
  POST /add                  add item to cart
  PUT  /update               update item quantity
  DELETE /remove/:foodId     remove item
  DELETE /clear              clear entire cart

ORDER /api/order
  POST /place                user places order (auth: user)
  GET  /                     user's order history (auth: user)
  GET  /:id                  single order details
  PATCH /:id/cancel          user cancels order (auth: user)
  GET  /partner/orders       partner sees incoming orders (auth: partner)
  PATCH /partner/:id/status  partner updates status (auth: partner)
  PATCH /partner/:id/verify  partner verifies pickup OTP (auth: partner)

REVIEW /api/review
  POST /                     add review (auth: user)
  GET  /food/:foodId         reviews for a food item
  GET  /store/:storeId       reviews for a store
  DELETE /:id                delete own review (auth: user)

REEL /api/reel
  POST /                     partner uploads reel (auth: partner)
  GET  /                     all reels feed
  GET  /store/:storeId       reels by store
  POST /:id/like             like/unlike reel (auth: user)
  POST /:id/comment          comment on reel (auth: user)
  GET  /:id/comments         get reel comments

PAYMENT /api/payment
  POST /initiate             create payment order (auth: user)
  POST /verify               verify payment (auth: user)
  GET  /history              payment history (auth: user)

MAP /api/map
  GET  /directions           route from user to store
  GET  /nearby               stores within X km radius

CHATBOT /api/chatbot
  POST /                     send mood → get food recommendations (auth: user)

HEALTH /api/health
  GET  /upload               check imagekit connection
```

---

## Order Pickup OTP Flow
```
1. User places order → system generates 6-digit OTP
2. OTP hashed with bcrypt → stored in order.otp
3. Raw OTP emailed to user
4. User arrives at store → shows OTP to partner
5. Partner enters OTP in app → POST /order/partner/:id/verify
6. System bcrypt.compare(incoming, stored) → if match → status = pickedup
7. Confirmation email sent to both user and partner
```

---

## Email Templates Needed
```
1. Welcome / email verification OTP   → on register
2. Order placed                       → to user
3. Order confirmed                    → partner accepted
4. Order ready for pickup             → food is ready
5. Order picked up                    → confirmed pickup
6. Password reset OTP                 → forgot password flow
```

---

## Build Order (what's done vs what's next)
```
✅ Step 1  — Auth (register, login, logout) with sessions
✅ Step 2  — Food model + create food with ImageKit upload
⬜ Step 3  — All remaining models
⬜ Step 4  — Auth validators + email verification OTP
⬜ Step 5  — Store CRUD (partner)
⬜ Step 6  — Full Food CRUD (update, delete, toggle availability)
⬜ Step 7  — Cart
⬜ Step 8  — Order + pickup OTP flow
⬜ Step 9  — Payment integration
⬜ Step 10 — Reviews
⬜ Step 11 — Reels + likes + comments
⬜ Step 12 — Favorites
⬜ Step 13 — Map feature
⬜ Step 14 — AI Chatbot
⬜ Step 15 — Password reset flow
⬜ Step 16 — Email utils for all events
```

---

## Known Issues / Gotchas
1. **ImageKit SDK** — `toFile` is not available in current version. Only `fs.createReadStream` works. Always write buffer to temp file first, then stream.
2. **bcrypt for refresh tokens** — DO NOT use bcrypt to hash refresh tokens for DB storage/lookup. Use SHA-256 (crypto) — it's deterministic so lookup works. bcrypt is only for passwords.
3. **Duplicate function names in JS** — JS silently overwrites the first with the second. Always use unique function names.
4. **Category as array** — food category is `[String]` not `String`. Frontend must send as array. Query with `$in` or `$all`.
5. **role in JWT** — every token contains `{ userId, role, sessionID }`. Middleware must check `decoded.userId` not `decoded.id`.
6. **ES Modules** — project uses `"type": "module"` in package.json. All imports must include `.js` extension.
