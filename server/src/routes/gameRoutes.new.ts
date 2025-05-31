import express, { RequestHandler } from "express";
import { GameController } from "../controllers/GameController";

const router = express.Router();
const gameController = new GameController();

// Get game state
const getGameHandler: RequestHandler = (req, res) => {
  return gameController.getGameState(req, res);
};
router.get("/:gameId", getGameHandler);

// Create a new game
router.post("/", (req: Request, res: Response) => {
  return gameController.createGame(req, res);
});

// Join a game
router.post("/:gameId/join", (req: Request, res: Response) => {
  return gameController.joinGame(req, res);
});

export const gameRoutes = router;
