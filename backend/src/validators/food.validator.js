import { body, validationResult } from "express-validator";

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ALLOWED_CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
  "drinks",
  "desserts",
];

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const validateCreateFood = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must be under 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 500 })
    .withMessage("Description must be under 500 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ gt: 0, max: 10000 })
    .withMessage("Price must be a positive number under 10,000"),

  body("category").custom((value) => {
    if (!value) {
      throw new Error("At least one category is required");
    }

    const categories = Array.isArray(value) ? value : [value];

    const invalidCategories = categories.filter(
      (c) => !ALLOWED_CATEGORIES.includes(c),
    );

    if (invalidCategories.length > 0) {
      throw new Error(`Invalid categories: ${invalidCategories.join(", ")}`);
    }

    return true;
  }),

  body().custom((_, { req }) => {
    if (!req.files?.image) {
      throw new Error("Food image is required");
    }

    const image = req.files.image[0];

    if (!ALLOWED_IMAGE_TYPES.includes(image.mimetype)) {
      throw new Error("Invalid image format. Allowed: jpeg, png, webp");
    }

    if (image.size > MAX_IMAGE_SIZE) {
      throw new Error("Image size must be under 5MB");
    }

    return true;
  }),

  body().custom((_, { req }) => {
    if (req.files?.video) {
      const video = req.files.video[0];

      if (!ALLOWED_VIDEO_TYPES.includes(video.mimetype)) {
        throw new Error("Invalid video format. Allowed: mp4, webm, quicktime");
      }

      if (video.size > MAX_VIDEO_SIZE) {
        throw new Error("Video size must be under 100MB");
      }
    }

    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    next();
  },
];
