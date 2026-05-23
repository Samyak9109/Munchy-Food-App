import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import config from "./src/config/config.js";

const PORT = config.PORT || 3000;

async function startServer() {
  await connectDB();             // ensure DB is up first
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
