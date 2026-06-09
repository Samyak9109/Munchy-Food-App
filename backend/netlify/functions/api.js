import serverless from "serverless-http";
import app from "../../src/app.js";
import connectDB from "../../src/config/database.js";

const expressHandler = serverless(app, {
  basePath: "/.netlify/functions/api",
});

export const handler = async (event, context) => {
  await connectDB();
  return expressHandler(event, context);
};
