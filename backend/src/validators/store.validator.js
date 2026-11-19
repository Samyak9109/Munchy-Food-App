import { body } from "express-validator";
import { handleValidationErrors } from "./auth.validator.js"; // reuse from auth

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // validates HH:MM format

export const validateCreateStore = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters"),

  body("cuisine")
    .isArray({ min: 1 })
    .withMessage("At least one cuisine type is required"),

  // timing is optional — partner can update it later from store settings
  body("timing.open")
    .optional()
    .matches(timeRegex)
    .withMessage("Opening time must be in HH:MM format"),

  body("timing.close")
    .optional()
    .matches(timeRegex)
    .withMessage("Closing time must be in HH:MM format"),

  body("latitude")
    .notEmpty()
    .withMessage("latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("longitude")
    .notEmpty()
    .withMessage("longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  // reject [0,0] — not a valid store location
  body("latitude").custom((lat, { req }) => {
    if (Number(lat) === 0 && Number(req.body.longitude) === 0) {
      throw new Error("Store location cannot be [0,0]");
    }
    return true;
  }),

  handleValidationErrors,
];

export const validateUpdateStore = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters"),

  body("cuisine")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one cuisine type is required"),

  body("timing.open")
    .optional()
    .matches(timeRegex)
    .withMessage("Opening time must be in HH:MM format"),

  body("timing.close")
    .optional()
    .matches(timeRegex)
    .withMessage("Closing time must be in HH:MM format"),

  handleValidationErrors,
];
