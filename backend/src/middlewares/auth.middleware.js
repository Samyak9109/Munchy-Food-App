import partnerModel from "../models/partner.model.js"; 
import userModel from "../models/user.model.js"; 
import jwt from "jsonwebtoken";

async function authPartner(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Please login to access this resource" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const partner = await partnerModel.findById(decoded.userId);
    if (!partner) {
      return res.status(401).json({ message: "Account not found" });
    }

    req.partner = partner; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function authCustomer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Please login to access this resource" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "user") {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await userModel.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "Account not found" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export default { authPartner, authCustomer };
