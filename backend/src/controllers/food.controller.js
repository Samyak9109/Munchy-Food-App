import foodModel from "../models/food.model.js";
import uploadToImagekit from "../services/storage.service.js";

export const createFood = async (req, res) => {
  const { name, description, price, category } = req.body;

  try {
    if (!name || !description || !price || !category) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (!req.files?.image) {
      return res.status(400).json({ message: "Food image is required" });
    }

    const imageUrl = await uploadToImagekit(req.files.image[0]);
    const videoUrl = req.files?.video
      ? await uploadToImagekit(req.files.video[0])
      : null;

    const food = await foodModel.create({
      name,
      description,
      price,
      category,
      image: imageUrl,
      //video: videoUrl,
      foodPartner: req.foodPartner._id,
    });

    return res
      .status(201)
      .json({ message: "Food item created successfully", food });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating food item",
      error: error.message,
    });
  }
};
