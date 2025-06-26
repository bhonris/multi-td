import dotenv from "dotenv";
import "module-alias/register";
dotenv.config();

import cors from "cors";
import express, { Express } from "express";
import http from "http";
import { Server } from "socket.io";
import { setupRoutes } from "./routes";
// Import both socket service implementations
import { setupSocket } from "./services/socketService";

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
setupRoutes(app);

// Log which services are active
console.log("Setting up socket services...");

// Socket setup - Use primary implementation
setupSocket(io);

// For testing, we can uncomment this to use the new implementation
// setupSocketNew(io);
console.log("Socket services initialized");

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io, server };
