import mongoose from "mongoose";
import config from "../config/config.js";

const foodPartnerSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,

    },
    password:{
        type:String,
    }
},{timestamps:true})

const foodPartnerModel = mongoose.model('FoodPartner', foodPartnerSchema);

export default foodPartnerModel;

