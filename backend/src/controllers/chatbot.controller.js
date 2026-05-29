import { getChatbotResponse } from "../services/chatbot.service.js";
import { getAllFoodDAO } from "../dao/food.dao.js";
import { getNearbyStoresDAO } from "../dao/map.dao.js";

export const chat = async (req, res) => {
  const { message, lat, lng, conversationHistory = [] } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // fetch all available food items from DB
    const foodItems = await getAllFoodDAO();

    // fetch nearby stores if user shared location
    let nearbyStores = [];
    if (lat && lng) {
      nearbyStores = await getNearbyStoresDAO(lng, lat, 10); // 10km radius
    }

    // get response from Gemini via LangChain
    const response = await getChatbotResponse(
      message,
      foodItems,
      nearbyStores,
      conversationHistory,
    );

    return res.status(200).json({
      message: response,
      // send back history so frontend can maintain conversation
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: response },
      ],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Chatbot error", error: error.message });
  }
};
