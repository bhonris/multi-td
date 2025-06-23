import express, { RequestHandler, Router } from "express";
import { UserController } from "../controllers/UserController";

const router = express.Router();
const userController = new UserController();

// Register a new user
const registerHandler: RequestHandler = async (req, res) => {
  await userController.register(req, res);
};
router.post("/register", registerHandler);

// Login user
const loginHandler: RequestHandler = async (req, res) => {
  await userController.login(req, res);
};
router.post("/login", loginHandler);

// Get user profile
const getProfileHandler: RequestHandler = async (req, res) => {
  await userController.getProfile(req, res);
};
router.get("/profile/:userId", getProfileHandler);

// Update user profile
const updateProfileHandler: RequestHandler = async (req, res) => {
  await userController.updateProfile(req, res);
};
router.put("/profile/:userId", updateProfileHandler);

export const userRoutes: Router = router;
