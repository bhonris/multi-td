import express, { RequestHandler, Router } from "express";
import {
  createGame,
  getGameState,
  joinGame,
} from "../controllers/GameController";

const router = express.Router();

// Get game state
const getGameHandler: RequestHandler = async (req, res) => {
  await getGameState(req, res);
};
router.get("/:gameId", getGameHandler);

// Create a new game
const createGameHandler: RequestHandler = async (req, res) => {
  await createGame(req, res);
};
router.post("/", createGameHandler);

// Join a game
const joinGameHandler: RequestHandler = async (req, res) => {
  await joinGame(req, res);
};
router.post("/:gameId/join", joinGameHandler);

export const gameRoutes: Router = router;
