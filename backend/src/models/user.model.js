import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // User's full name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // User email
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password (can be null for Google OAuth users)
    password: {
      type: String,
      default: null,
    },

    googleId: {
      type: String,
      default: null,
    },

    // Profile picture URL
    avatar: {
      type: String,
      default: null,
    },

    // Optional phone number
    phone: {
      type: String,
      default: null,
    },

    // Email verification status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Fixed role value
    role: {
      type: String,
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Adds createdAt & updatedAt automatically
    timestamps: true,
  },
);

const userModel = mongoose.model("User", userSchema);

export default userModel;
