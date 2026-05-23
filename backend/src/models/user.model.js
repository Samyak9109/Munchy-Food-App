const mongoose = require('mongoose');
const config = require('../config/config');

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

module.exports = userModel;

