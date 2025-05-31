import express, { Request, Response } from "express";
import { UserController } from "../controllers/UserController";

const router = express.Router();
const userController = new UserController();

// Register a new user
router.post("/register", (req: Request, res: Response) => {
  return userController.register(req, res);
});

// Login user
router.post("/login", (req: Request, res: Response) => {
  return userController.login(req, res);
});

// Get user profile
router.get("/profile/:userId", function (req: Request, res: Response) {
  return userController.getProfile(req, res);
});

// Update user profile
router.put("/profile/:userId", function (req: Request, res: Response) {
  return userController.updateProfile(req, res);
});

export const userRoutes = router;
