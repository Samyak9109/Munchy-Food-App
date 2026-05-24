import foodPartnerModel from "../models/foodPartner.model.js";
import jwt from "jsonwebtoken";

async function authFoodPartner(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Please login to access this resource" });
  }

  try {
    const token = authHeader.split(" ")[1]; // extract token from "Bearer <token>"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "partner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const foodPartner = await foodPartnerModel.findById(decoded.userId); // was decoded.id
    if (!foodPartner) {
      return res.status(401).json({ message: "Account not found" });
    }

    req.foodPartner = foodPartner;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function authCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  next()
}


export default {
  authFoodPartner,
  authCustomer,
};
