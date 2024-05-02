import { 
    Server,
    StableBTreeMap, 
    ic 
}  from 'azle';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

class Game  {
    id: string;
    minNumber: number;
    maxNumber: number;
    level: number;
    points: number;
    consecutiveLosses: number;
    createdAt: Date;
    updateAt: Date | null;
}

const GameStorage = StableBTreeMap<string,Game>(0);

export default Server(()=>{
    const app = express();
    app.use(express.json());

    // Helper Functions
    function getCurrentDate(): Date {
        return new Date();
    }

    function gameNotFound(res: any): any {
        return res.status(404).json({ message: 'Game not found' });
    }

    function validateGameBoundaries(minNumber: number, maxNumber: number): boolean {
        return minNumber >= 0 && maxNumber > minNumber && (maxNumber - minNumber) >= 10;
    }
    
    // Get available Games
    // Routes for managing games
    app.post('/games', (req, res) => {
        const { minNumber, maxNumber } = req.body;
        if (!minNumber || !maxNumber) {
            return res.status(400).json({ message: 'Please provide both minNumber and maxNumber' });
        }
        if (!validateGameBoundaries(minNumber, maxNumber)) {
            return res.status(400).json({ message: 'Invalid game boundaries! Check game tutorial' });
        }

        const game = new Game(uuidv4(), minNumber, maxNumber, 1, 0, 0, getCurrentDate(), null);
        GameStorage.set(game.id, game);
        res.status(201).json(game);
    });

    app.get('/games/:id', (req, res) => {
        const game = GameStorage.get(req.params.id);
        if (!game) return gameNotFound(res);
        res.status(200).json(game);
    });

    app.delete('/games/:id', (req, res) => {
        const game = GameStorage.get(req.params.id);
        if (!game) return gameNotFound(res);

        GameStorage.delete(req.params.id);
        res.status(200).json({ message: 'Game deleted successfully' });
    });

    app.put('/games/:id/play', (req, res) => {
        const game = GameStorage.get(req.params.id);
        if (!game) return gameNotFound(res);

        const guess = req.body.guess;
        const randomNumber = Math.floor(Math.random() * (game.maxNumber - game.minNumber + 1)) + game.minNumber;
        let result = 'lose';

        if (guess === randomNumber) {
            game.points += 5;
            game.consecutiveLosses = 0;
            result = 'win';
        } else {
            game.consecutiveLosses += 1;
            if (game.consecutiveLosses >= 3) {
                GameStorage.delete(req.params.id);
                return res.status(400).json({ message: "Game terminated due to consecutive losses" });
            }
        }

        GameStorage.set(game.id, game);
        res.status(200).json({ result, totalScore: game.points });
    });
  
    //  Create new game
    app.post('/games',(req:any, res: any)=>{
         const { minNumber, maxNumber } = req.body;
        
          if(minNumber && maxNumber){

            if((minNumber < 0) || (minNumber >= maxNumber) || ((maxNumber - minNumber) < 10)){
                return res.status(400).json({message:'Invalid game boundaries!Check game tutorial'}) 
              }else {
                 const game :Game= {
                  id: uuidv4(),
                  minNumber,
                  maxNumber,
                  level: 1,
                  points: 0,
                  consecutiveLosses: 0,
                  createdAt: getCurrentDate(),
                  updateAt: getCurrentDate()
              };
              GameStorage.insert(game.id,game);
              return  res.status(200).json(game);
              }
          }else{
            return res.status(400).json({message: 'Please provide two number minNumber and maxNumber',number:`${maxNumber}`})
          }

         
    });


    app.put('/games/:id/play',(req:any, res:any)=>{
      
        const gameId = req.params.id;
        const gameExist = GameStorage.get(gameId);
        if('None' in gameExist ){
            return res.status(404).json({message: 'Game not found'});
        } else {
            const game= gameExist.Some 
            const { guess } = req.body;
            const randomNumber = Math.floor(Math.random()*(game.maxNumber - game.minNumber+1)) + game.minNumber;
            let result  = "lose";
            if(guess == randomNumber) {
                result = 'win';
                game.points += 5;
                game.consecutiveLosses = 0;
                GameStorage.insert(gameId,game);
            } else {
                game.consecutiveLosses = game.consecutiveLosses + 1;
                GameStorage.insert(gameId,game);
                if(game.consecutiveLosses >= 3) {
                    GameStorage.remove(gameId);
                    return res.status(400).json({ message: "Game terminated due to consecutive losses"});
                }
            }
            return res.status(200).json({ result, totalScore:game.points});

}});

     // Play number with its either sides two neighbors
     app.post('/games/:id/neighbors',(req:any, res:any)=>{
        const gameId = req.params.id;
        const gameExist = GameStorage.get(gameId);
        let result = 'lose';
        const borderArray = [];
        if('None' in gameExist ){
            return res.status(404).json({ message: 'Game not found' });
        } else {
            const { guess } = req.body;
            const game = gameExist.Some;
            
            for(let i = Math.max(game.minNumber, guess-2); i <= Math.min(game.maxNumber,guess+2); i++){
                borderArray.push(i);              
            }
            const randomNumber = Math.floor(Math.random() * (game.maxNumber - game.minNumber + 1)) + game.minNumber;
          
            if (borderArray.includes(randomNumber)){
                result = 'win';
                game.points += 1;
                game.consecutiveLosses = 0;
                GameStorage.insert(gameId,game);
            } else {
                game.consecutiveLosses++;
                GameStorage.insert(gameId,game);
                if (game.consecutiveLosses >= 3) {
                    GameStorage.remove(gameId);
                    return res.status(400).json({ message: 'Game terminated due to consecutive losses' });
                }

            }

        }
        return res.status(200).json({ result, borderArray });
     }); 
     
     
        return app.listen();
})
