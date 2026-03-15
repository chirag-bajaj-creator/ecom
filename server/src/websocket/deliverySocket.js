const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const url = require("url");

let wss = null;

const initWebSocket = (server) => {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const params = url.parse(req.url, true).query;
    const token = params.token;
    const type = params.type; // "delivery" or "tracking"
    const orderId = params.orderId; // for customer tracking

    if (!token) {
      ws.close(4001, "Token required");
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

      if (type === "delivery") {
        // Delivery boy connection
        ws.deliveryBoyUserId = decoded.userId;
        ws.connectionType = "delivery";
        console.log(`Delivery boy connected: ${decoded.userId}`);
      } else if (type === "tracking" && orderId) {
        // Customer tracking connection
        ws.orderId = orderId;
        ws.connectionType = "tracking";
        console.log(`Customer tracking order: ${orderId}`);
      } else {
        ws.close(4002, "Invalid connection type");
        return;
      }

      // Heartbeat to keep connection alive
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        if (ws.connectionType === "delivery") {
          console.log(`Delivery boy disconnected: ${ws.deliveryBoyUserId}`);
        } else {
          console.log(`Customer tracking disconnected: ${ws.orderId}`);
        }
      });

      ws.on("error", (err) => {
        console.error("WebSocket error:", err.message);
      });
    } catch (err) {
      ws.close(4003, "Invalid token");
    }
  });

  // Heartbeat interval — close dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeat);
  });

  console.log("WebSocket server initialized on /ws");
  return wss;
};

const getWss = () => wss;

module.exports = { initWebSocket, getWss };
