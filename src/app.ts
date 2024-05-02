import {
  Server,
  StableBTreeMap,
  ic,
} from 'azle';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Class representing a game.
 */
class Game {
  /**
   * Create a game.
   * @param {number} minNumber - The minimum number allowed in the game.
   * @param {number} maxNumber - The maximum number allowed in the game.
   * @param {number} [level=1] - The level of the game.
   * @param {number} [points=0] - The points scored in the game.
   * @param {number} [consecutiveLosses=0] - The number of consecutive losses in the game.
   * @param {Date} [createdAt=getCurrentDate()] - The date and time when the game was created.
   * @param {Date|null} [updatedAt=null] - The date and time when the game was last updated.
   */
  constructor(
    minNumber: number,
    maxNumber: number,
    level = 1,
    points = 0,
    consecutiveLosses = 0,
    createdAt = getCurrentDate(),
    updatedAt = null
  ) {
    if (minNumber < 0 || minNumber >= maxNumber || (maxNumber - minNumber) < 10) {
      throw new Error('Invalid game boundaries! Check game tutorial');
    }

    this.id = uuidv4();
    this.minNumber = minNumber;
    this.maxNumber = maxNumber;
    this.level = level;
    this.points = points;
    this.consecutiveLosses = consecutiveLosses;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

const GameStorage = StableBTreeMap<string, Game>(0);

/**
 * Function to get the current date.
 * @returns {Date} - The current date and time.
 */
const getCurrentDate = (): Date => {
  const timeStamp = new Number(ic.time());
  return new Date(timeStamp.valueOf() / 1000_000);
};

export default Server(async () => {
  const app = express();
  app.use(express.json());

  /**
   * Helper function to check types of request body.
   * @param {Object} obj - The object to be checked.
   * @returns {boolean} - True if object contains correct types, false otherwise.
   */
  function checkTypes(obj: any): obj is { minNumber?: number; maxNumber?: number; guess?: number } {
    return (
      (obj && typeof obj.minNumber === 'number' && typeof obj.maxNumber === 'number' && typeof obj.guess === 'undefined') ||
      (obj && typeof obj.guess === 'number' && typeof obj.minNumber === 'undefined' && typeof obj.maxNumber === 'undefined')
    );
  }

  // Get available Games
  app.get('/games', (req, res) => {
    return res.status(200).json(Array.from(GameStorage.values()));
  });

  // Create new game
  app.post('/games', async (req, res) => {
    if (!checkTypes(req.body)) {
      return res.status(400).json({ message: 'Only number allowed' });
    }

    const { minNumber, maxNumber } = req.body;

    try {
      const game = new Game(minNumber, maxNumber);
      await GameStorage.insert(game.id, game);
      return res.status(201).json(game);
    } catch (error) {
      console.error(error); // Log the error for debugging
      return res.status(400).json({ message: 'Failed to create game' });
    }
  });

  // Get single game
  app.get('/games/:id', (req, res) => {
    const gameId = req.params.id;
    const game = GameStorage.get(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    return res.status(200).json(game);
  });

  // Delete game
  app.delete('/games/:id', async (req, res) => {
    const gameId = req.params.id;
    const removed = await GameStorage.remove(gameId);

    if (!removed) {
      return res.status(404).json({ message: 'Game not found' });
    }

    return res.status(200).json({ message: 'Game deleted successfully' });
  });

  // Play the exact number
  app.put('/games/:id/play', async (req, res) => {
    if (!checkTypes(req.body)) {
      return res.status(400).json({ message: 'Only number allowed' });
    }

    const gameId = req.params.id;
    const game = GameStorage.get(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const { guess } = req.body;
    const randomNumber = Math.floor(Math.random() * (game.maxNumber - game.minNumber + 1)) + game.minNumber;
    let result = 'lose';

    if (guess === randomNumber) {
      result = 'win';
      game.points += 5;
      game.consecutiveLosses = 0;
    } else {
      game.consecutiveLosses++;
      if (game.consecutiveLosses >= 3) {
        await GameStorage.remove(gameId);
        return res.status(400).json({ message: 'Game terminated due to consecutive losses' });
      }
    }

    await GameStorage.insert(gameId, game);
    return res.status(200).json({ result, totalScore: game.points });
  });

  // Play a number within a range (neighbors)
  app.post('/games/:id/neighbors', async (req, res) => {
    if (!checkTypes(req.body)) {
      return res.status(400).json({ message: 'Only number allowed' });
    }

    const gameId = req.params.id;
    const game = GameStorage.get(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const { guess } = req.body;
    const randomNumber = Math.floor(Math.random() * (game.maxNumber - game.minNumber + 1)) + game.minNumber;
    let result = 'lose';
    const borderArray = [];

    for (let i = Math.max(game.minNumber, guess - 2); i <= Math.min(game.maxNumber, guess + 2); i++) {
      borderArray.push(i);
    }

    if (borderArray.includes(randomNumber)) {
      result = 'win';
      game.points += 1;
      game.consecutiveLosses = 0;
    } else {
      game.consecutiveLosses++;
      if (game.consecutiveLosses >= 3) {
        await GameStorage.remove(gameId);
        return res.status(400).json({ message: 'Game terminated due to consecutive losses' });
      }
    }

    await GameStorage.insert(gameId, game);
    return res.status(200).json({ result, totalScore: game.points, borderArray });
  });

  return app.listen();
});
