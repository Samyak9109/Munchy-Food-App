const mongoose = require('mongoose');
const config = require('../config/config');

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

module.exports = foodPartnerModel;

