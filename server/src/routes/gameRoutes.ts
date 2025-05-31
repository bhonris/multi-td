import express, { RequestHandler } from "express";
import { GameController } from "../controllers/GameController";

const router = express.Router();
const gameController = new GameController();

// Get game state
const getGameHandler: RequestHandler = async (req, res) => {
  await gameController.getGameState(req, res);
};
router.get("/:gameId", getGameHandler);

// Create a new game
const createGameHandler: RequestHandler = async (req, res) => {
  await gameController.createGame(req, res);
};
router.post("/", createGameHandler);

// Join a game
const joinGameHandler: RequestHandler = async (req, res) => {
  await gameController.joinGame(req, res);
};
router.post("/:gameId/join", joinGameHandler);

export const gameRoutes = router;
