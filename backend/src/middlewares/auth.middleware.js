import foodPartnerModel from "../models/foodPartner.model.js"
import jwt from "jsonwebtoken";

export const authFoodPartner = async (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message:"Please login to access this resource"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const foodPartner = await foodPartnerModel.findById(decoded.id);    
        req.foodPartner = foodPartner;
        next();
    } catch (error) {
        return res.status(401).json({
            message:"Invalid token"
        })
    }       

}
