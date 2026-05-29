import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import partnerModel from "../models/partner.model.js";
import sessionModel from "../models/session.model.js";
import userModel from "../models/user.model.js";
import otpModel from "../models/otp.model.js";
import { generateOTP, hashOTP, verifyOTP } from "../services/otp.service.js";
import sendEmail from "../services/email.service.js";

function getModelByRole(role) {
  if (role === "user") return userModel;
  if (role === "partner") return partnerModel;
  return null;
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueTokens(account, role, req, res) {
  const refreshToken = jwt.sign(
    { userId: account._id, role },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );

  const session = await sessionModel.create({
    userId: account._id,
    role,
    refreshToken: hashRefreshToken(refreshToken),
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = jwt.sign(
    { userId: account._id, sessionID: session._id, role },
    config.JWT_SECRET,
    { expiresIn: "15m" },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
}

// ── REGISTER USER ───────────────────────────────────────────────
async function registerUser(req, res) {
  const { name, email, password } = req.body;

  try {
    // delete unverified account so user can re-register
    await userModel.findOneAndDelete({ email, isVerified: false });

    if (await userModel.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    await userModel.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });

    const otp = generateOTP();

    await otpModel.create({
      email,
      otp: await hashOTP(otp),
      purpose: "register",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendEmail(
      email,
      "Verify your Munchy account",
      `<h2>Welcome to Munchy!</h2>
       <p>Your verification code is: <strong>${otp}</strong></p>
       <p>This code expires in 10 minutes.</p>`,
    );

    return res.status(201).json({
      message: "Registration successful. Please check your email for OTP.",
      email,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
}

// ── REGISTER PARTNER ────────────────────────────────────────────
async function registerPartner(req, res) {
  const { name, email, password, phone } = req.body;

  try {
    // delete unverified account so partner can re-register
    await partnerModel.findOneAndDelete({ email, isVerified: false });

    if (await partnerModel.findOne({ email })) {
      return res.status(400).json({ message: "Account already exists" });
    }

    await partnerModel.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      phone,
    });

    const otp = generateOTP();

    await otpModel.create({
      email,
      otp: await hashOTP(otp),
      purpose: "register",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendEmail(
      email,
      "Verify your Munchy partner account",
      `<h2>Welcome to Munchy!</h2>
       <p>Your verification code is: <strong>${otp}</strong></p>
       <p>This code expires in 10 minutes.</p>`,
    );

    return res.status(201).json({
      message: "Registration successful. Please check your email for OTP.",
      email,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error registering partner", error: error.message });
  }
}

// ── VERIFY EMAIL (shared for user + partner) ─────────────────────
async function verifyEmail(req, res) {
  const { email, otp } = req.body;
  const role = req.path.includes("partner") ? "partner" : "user";
  const model = getModelByRole(role);

  try {
    const otpRecord = await otpModel.findOne({
      email,
      purpose: "register",
      used: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // check expiry
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // verify OTP
    const isValid = await verifyOTP(otp, otpRecord.otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // mark account as verified
    const account = await model.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true },
    );

    // issue tokens now that email is verified
    const accessToken = await issueTokens(account, role, req, res);

    return res.status(200).json({
      message: "Email verified successfully",
      account: {
        id: account._id,
        username: account.name,
        email: account.email,
        role,
      },
      accessToken,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying email", error: error.message });
  }
}

// ── LOGIN (shared for user + partner) ───────────────────────────
async function login(req, res) {
  const { email, password } = req.body;
  const role = req.path.includes("partner") ? "partner" : "user";
  const model = getModelByRole(role);

  try {
    const account = await model.findOne({ email });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (!account.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email first" });
    }

    if (!account.isActive) {
      return res.status(403).json({ message: "Account has been deactivated" });
    }

    if (!(await bcrypt.compare(password, account.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = await issueTokens(account, role, req, res);

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
    return res
      .status(500)
      .json({ message: "Error logging in", error: error.message });
  }
}

// ── LOGOUT ──────────────────────────────────────────────────────
async function logout(req, res) {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const session = await sessionModel.findOne({
      refreshToken: hashRefreshToken(incomingRefreshToken),
      revoked: false,
    });

    if (!session) {
      return res.status(400).json({ message: "Invalid or revoked session" });
    }

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
}
async function googleAuthCallback(req, res) {
  try {
    const account = req.user; 
    const role = req.path.includes("partner") ? "partner" : "user";

    if (!account.isActive) {
      return res.status(403).json({ message: "Account has been deactivated" });
    }

    const accessToken = await issueTokens(account, role, req, res);

   
    return res.redirect(
      `${config.FRONTEND_URL}/auth/success?token=${accessToken}&role=${role}`,
    );
  } catch (error) {
    return res.redirect(`${config.FRONTEND_URL}/auth/error`);
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const role = req.path.includes("partner") ? "partner" : "user";
  const model = getModelByRole(role);

  try {
    const account = await model.findOne({ email });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const otp = generateOTP();

    await otpModel.create({
      email,
      otp: await hashOTP(otp),
      purpose: "resetPassword",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendEmail(
      email,
      "OTP for PassWord Reset",
      `<h2>Welcome to Munchy!</h2>
       <p>Your verification code is: <strong>${otp}</strong></p>
       <p>This code expires in 10 minutes.</p>`,
    );

    return res.status(200).json({
      message: "Password reset OTP sent to your email",
      email,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error sending OTP", error: error.message });
  }
}

async function resetPassword(req, res) {

  const { email, otp, newPassword } = req.body;
  const role = req.path.includes("partner") ? "partner" : "user";
  const model = getModelByRole(role);

  try {
    const otpRecord = await otpModel.findOne({
      email,
      purpose: "resetPassword",
      used: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // check expiry
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // verify OTP
    const isValid = await verifyOTP(otp, otpRecord.otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await model.findOneAndUpdate({ email }, { password: hashedPassword });

    const account = await model.findOne({ email });
    await sessionModel.updateMany({ userId: account._id }, { revoked: true });

    return res
      .status(200)
      .json({ message: "Password reset successfully. Please login again." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
}


// exports
export { registerUser, registerPartner, verifyEmail, login, logout, googleAuthCallback, forgotPassword, resetPassword };
