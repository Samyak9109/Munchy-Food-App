import { body, validationResult } from "express-validator";

// reusable result handler — same for all validators
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// shared rules reused across validators
const nameRule = body("name")
  .trim()
  .notEmpty()
  .withMessage("Name is required")
  .isLength({ min: 2, max: 50 })
  .withMessage("Name must be between 2 and 50 characters");

const emailRule = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .isEmail()
  .withMessage("Invalid email format")
  .normalizeEmail();

const passwordRule = body("password")
  .notEmpty()
  .withMessage("Password is required")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/\d/)
  .withMessage("Password must contain at least one number")
  .matches(/[@$!%*?&]/)
  .withMessage("Password must contain at least one special character");

const phoneRule = body("phone")
  .notEmpty()
  .withMessage("Phone is required")
  .matches(/^\d{10}$/)
  .withMessage("Phone must be exactly 10 digits");

// ── VALIDATORS ───────────────────────────────────────────────

export const validateUserRegister = [
  nameRule,
  emailRule,
  passwordRule,
  handleValidationErrors,
];

export const validatePartnerRegister = [
  nameRule,
  emailRule,
  passwordRule,
  phoneRule, // partners must provide phone
  handleValidationErrors,
];

export const validateLogin = [
  emailRule,
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const validateForgotPassword = [emailRule, handleValidationErrors];
