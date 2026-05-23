import mongoose from "mongoose";
import config from "../config/config.js";

const userSchema = new mongoose.Schema({
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

const userModel = mongoose.model('User',userSchema);

export default userModel;
