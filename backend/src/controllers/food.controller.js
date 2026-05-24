import foodModel from "../models/food.model.js";
import uploadToImagekit from "../services/storage.service.js";

export const createFood = async (req, res) => {
  const { name, description, price, category } = req.body; // remove video from here

  try {
    // validate required fields from body
    if (!name || !description || !price || !category) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // validate required file
    if (!req.files?.video) {
      return res.status(400).json({ message: "Food video is required" });
    }

    // upload files to imagekit
    const videoUrl = await uploadToImagekit(req.files.video[0]);
    const imageUrl = req.files?.image
      ? await uploadToImagekit(req.files.image[0])
      : null;

    const food = await foodModel.create({
      name,
      description,
      price,
      category,
      image: imageUrl,
      video: videoUrl,
      foodPartner: req.foodPartner._id,
    });

    return res
      .status(201)
      .json({ 
        message: "Food item created successfully", food 
      });
  } catch (error) {
    console.error("Food creation error:", error);
    return res
      .status(500)
      .json({ message: "Error creating food item", error: error.message });
  }
};
