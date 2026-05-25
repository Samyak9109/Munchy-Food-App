import bcrypt from "bcrypt"; // ❌ was: brcrypt (typo)
import crypto from "crypto";

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const hashOTP = async (otp) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
  } catch (error) {
    throw new Error(`OTP hashing failed: ${error.message}`);
  }
};

export const verifyOTP = async (incomingOTP, hashedOTP) => {
  try {
    return await bcrypt.compare(incomingOTP, hashedOTP);
  } catch (error) {
    throw new Error(`OTP verification failed: ${error.message}`);
  }
};
