import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import foodPartnerModel from "../models/foodPartner.model.js";
import sessionModel from "../models/session.model.js";
import userModel from "../models/user.model.js";

// Get model based on role
function getModelByRole(role) {
  if (role === "user") return userModel;
  if (role === "partner") return foodPartnerModel;
  return null;
}

// Hash refresh token before storing
function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ================= REGISTER USER =================
async function registerUser(req, res) {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    if (await userModel.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await userModel.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });

    // Create refresh token
    const refreshToken = jwt.sign(
      { userId: user._id, role: "user" },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save session
    const session = await sessionModel.create({
      userId: user._id,
      role: "user",
      refreshToken: hashRefreshToken(refreshToken),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Create access token
    const accessToken = jwt.sign(
      { userId: user._id, sessionID: session._id, role: "user" },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Store refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      account: {
        id: user._id,
        username: user.name,
        email: user.email,
        role: "user",
      },
      accessToken,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
}

// ================= REGISTER PARTNER =================
async function registerFoodPartner(req, res) {
  const { name, email, password } = req.body;

  try {
    // Check if partner exists
    if (await foodPartnerModel.findOne({ email })) {
      return res.status(400).json({ message: "Account already exists" });
    }

    // Create partner
    const partner = await foodPartnerModel.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: partner._id, role: "partner" },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save session
    const session = await sessionModel.create({
      userId: partner._id,
      role: "partner",
      refreshToken: hashRefreshToken(refreshToken),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Generate access token
    const accessToken = jwt.sign(
      { userId: partner._id, sessionID: session._id, role: "partner" },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Save cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Food partner registered successfully",
      account: {
        id: partner._id,
        username: partner.name,
        email: partner.email,
        role: "partner",
      },
      accessToken,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error registering food partner",
      error: error.message,
    });
  }
}

// ================= LOGIN =================
async function login(req, res) {
  const { email, password } = req.body;

  // Detect role from route
  const role = req.path.includes("partner") ? "partner" : "user";
  const model = getModelByRole(role);

  try {
    // Find account
    const account = await model.findOne({ email });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Verify password
    if (!(await bcrypt.compare(password, account.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create refresh token
    const refreshToken = jwt.sign(
      { userId: account._id, role },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save session
    const session = await sessionModel.create({
      userId: account._id,
      role,
      refreshToken: hashRefreshToken(refreshToken),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Create access token
    const accessToken = jwt.sign(
      { userId: account._id, sessionID: session._id, role },
      config.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Store cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Logged in successfully",
      account: {
        id: account._id,
        username: account.name,
        email: account.email,
        role,
      },
      accessToken,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
}

// ================= LOGOUT =================
async function logout(req, res) {
  const incomingRefreshToken = req.cookies.refreshToken;

  // No token found
  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Find active session
    const session = await sessionModel.findOne({
      refreshToken: hashRefreshToken(incomingRefreshToken),
      revoked: false,
    });

    if (!session) {
      return res.status(400).json({
        message: "Invalid or revoked session",
      });
    }

    // Revoke session
    session.revoked = true;
    await session.save();

    // Remove cookie
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logged out successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error logging out",
      error: error.message,
    });
  }
}

export {
  registerUser,
  registerFoodPartner,
  login,
  logout,
};
