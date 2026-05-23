const app = require('./src/app');
const connectDB = require('./src/config/database')
const config  = require('./src/config/config')

const PORT = config.PORT || 3000;

async function startServer() {
  await connectDB();             // ensure DB is up first
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();