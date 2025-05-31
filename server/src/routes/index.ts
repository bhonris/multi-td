import { Express } from "express";
import { gameRoutes } from "./gameRoutes";
import { userRoutes } from "./userRoutes";

export const setupRoutes = (app: Express) => {
  app.use("/api/game", gameRoutes);
  app.use("/api/users", userRoutes);

  // Health check route
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
};
