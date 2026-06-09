import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import config from "../config/config.js";

// initialize Gemini model
const model = new ChatGoogleGenerativeAI({
  model: config.GEMINI_MODEL,
  apiKey: config.GEMINI_API_KEY,
  temperature: 0.7, // creativity level — 0 = factual, 1 = creative
});

// system prompt — tells Gemini who it is and what it does
const SYSTEM_PROMPT = `You are Munchy AI, a friendly food recommendation assistant for the Munchy app.
Your job is to:
1. Recommend food items based on the user's mood or preferences
2. Suggest nearby restaurants when asked
3. Answer food-related questions
4. Keep responses concise, friendly and helpful

You will be given:
- User's message
- Available food items from the database
- Nearby stores (if user shares location)
- User's order history (if available)

Always recommend from the available food items provided.
If no food items match, suggest the closest alternatives.
Format food recommendations clearly with name and price.
Never make up food items that aren't in the provided list.`;

export const getChatbotResponse = async (
  userMessage,
  foodItems,
  nearbyStores,
  conversationHistory = [],
) => {
  try {
    // build messages array with history
    const messages = [
      new SystemMessage(SYSTEM_PROMPT),

      // inject DB context as a system message
      new SystemMessage(`
        Available food items:
        ${foodItems.map((f) => `- ${f.name} (₹${f.price}) — ${Array.isArray(f.category) ? f.category.join(", ") : f.category}`).join("\n")}

        Nearby stores:
        ${nearbyStores.map((s) => `- ${s.name} — ${s.address} (${(s.distance / 1000).toFixed(1)}km away)`).join("\n")}
      `),

      // inject conversation history for memory
      ...conversationHistory.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),

      // current user message
      new HumanMessage(userMessage),
    ];

    const response = await model.invoke(messages);
    return response.content;
  } catch (error) {
    throw new Error(`Chatbot error: ${error.message}`);
  }
};

export const getFallbackResponse = (userMessage, foodItems) => {
  if (!foodItems.length) {
    return "I could not find any available dishes right now. Please check again shortly.";
  }

  const names = foodItems
    .slice(0, 3)
    .map((food) => `${food.name} (₹${food.price})`)
    .join(", ");

  return `Based on "${userMessage}", try ${names}. These are available right now.`;
};
