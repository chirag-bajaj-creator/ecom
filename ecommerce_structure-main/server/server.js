const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
};

startServer();
