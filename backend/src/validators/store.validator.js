import { body } from "express-validator";
import { handleValidationErrors } from "./auth.validator.js"; // reuse from auth

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // validates HH:MM format

export const validateCreateStore = [
  body("name")
    .trim() // ❌ was: .trim (missing parentheses)
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 }) // ❌ was: missing comma between min and max
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

  body("timing.open")
    .notEmpty()
    .withMessage("Opening time is required")
    .matches(timeRegex)
    .withMessage("Opening time must be in HH:MM format"),

  body("timing.close")
    .notEmpty()
    .withMessage("Closing time is required")
    .matches(timeRegex)
    .withMessage("Closing time must be in HH:MM format"),

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
