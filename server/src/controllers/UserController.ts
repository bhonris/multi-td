import { Request, Response } from "express";
import { UserService } from "../services/UserService";

const userService = new UserService();

export class UserController {
  register = async (req: Request, res: Response) => {
    try {
      const { username, password, email } = req.body;

      if (!username || !password || !email) {
        return res
          .status(400)
          .json({ error: "Username, password and email are required" });
      }

      const existingUser = await userService.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await userService.createUser({
        username,
        password,
        email,
      });
      res
        .status(201)
        .json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const user = await userService.validateUser(username, password);

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        token: userService.generateToken(user),
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        stats: user.stats,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      const user = await userService.updateUser(userId, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        stats: user.stats,
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  };
}
