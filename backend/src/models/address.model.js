import mongoose from "mongoose";

const addressSchema = new mongoose.Schema( 
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },

    fullAddress: {
      type: String,
      required: true,
    },

    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }, 
);

const addressModel = mongoose.model("Address", addressSchema); 

export default addressModel;
