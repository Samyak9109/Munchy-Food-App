import {
  getChatbotResponse,
  getFallbackResponse,
} from "../services/chatbot.service.js";
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

    const searchTerms = message
      .toLowerCase()
      .split(/\W+/)
      .filter((term) => term.length > 2);
    const matchingItems = foodItems.filter((food) => {
      const searchable = [
        food.name,
        food.description,
        ...(Array.isArray(food.category) ? food.category : [food.category]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchTerms.some((term) => searchable.includes(term));
    });
    const recommendations = (matchingItems.length ? matchingItems : foodItems)
      .slice(0, 4);

    let response;
    try {
      response = await getChatbotResponse(
        message,
        foodItems,
        nearbyStores,
        conversationHistory,
      );
    } catch (aiError) {
      console.error("Gemini request failed:", aiError.message);
      response = getFallbackResponse(message, recommendations);
    }

    return res.status(200).json({
      reply: response,
      recommendations,
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
