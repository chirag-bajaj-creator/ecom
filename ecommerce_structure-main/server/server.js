require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const { initWebSocket } = require('./src/websocket/deliverySocket');

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  // Attach WebSocket server
  initWebSocket(server);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`WebSocket ready on ws://localhost:${env.PORT}/ws`);
  });
};

startServer();
