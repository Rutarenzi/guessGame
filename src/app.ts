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
    

    // Helper to check type 

    function checkTypes(obj: any): obj is { minNumber?: number; maxNumber?: number; guess?: number } {
        return (
          (obj && typeof obj.minNumber === 'number' && typeof obj.maxNumber === 'number' && typeof obj.guess === 'undefined') ||
          (obj && typeof obj.guess === 'number' && typeof obj.minNumber === 'undefined' && typeof obj.maxNumber === 'undefined')
        );
      }


    // Get available Games
    app.get('/games',(req:any,res:any)=>{
        return res.status(200).json(GameStorage.values())
    })
     
    //  Create new game
    app.post('/games',(req:any, res: any)=>{
        if(!checkTypes(req.body)) return res.status(400).json({message: "only number allowed"});
    
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
              return  res.status(201).json(game);
              }
          }else{
            return res.status(400).json({message: 'Please provide two number minNumber and maxNumber'})
          }

         
    });
     app.put('/games/:id/edit',(req:any,res:any)=>{
        if(!checkTypes(req.body)) return res.status(400).json({message: "only number allowed"});
        
        const gameId = req.params.id;
        const gameExist = GameStorage.get(gameId);
        if('None' in gameExist ){
            return res.status(404).json({message: 'Game not found'});
        } 
        const { minNumber, maxNumber } = req.body;
        
          if(minNumber && maxNumber){
        
            if((minNumber < 0) || (minNumber >= maxNumber) || ((maxNumber - minNumber) < 10)){
                return res.status(400).json({message:'Invalid game boundaries!Check game tutorial'}) 
              }else {
               
              const game:Game = {
                ...gameExist.Some,
                minNumber,
                  maxNumber,
                  updateAt: getCurrentDate()

              }
              GameStorage.insert(game.id,game);
              return  res.status(201).json(game);
              }
          }else{
            return res.status(400).json({message: 'Please provide two number minNumber and maxNumber'})
          }
     })
    //Get single game

    app.get('/games/:id',(req:any,res:any)=>{
      
        const gameId = req.params.id;
        const gameExist = GameStorage.get(gameId);
        if('None' in gameExist ){
            return res.status(404).json({message: 'Game not found'});
        } 
        return res.status(200).json(gameExist.Some)
    })
    app.delete('/games/:id',(req:any,res:any)=>{
      
        const gameId = req.params.id;
        const gameRemoved = GameStorage.remove(gameId);
        if('None' in gameRemoved){
            return res.status(404).json({message: "Game not found to be deleted"})
        } else{
            return res.status(200).json({message: "Game deleted successfully"});
        }
    })


    app.put('/games/:id/play',(req:any, res:any)=>{
        if(!checkTypes(req.body)) return res.status(400).json({message: "only number allowed"});
        const gameId = req.params.id;
        const gameExist = GameStorage.get(gameId);
    
        if('None' in gameExist ){
            return res.status(404).json({message: 'Game not found'});
        } 

        const game= gameExist.Some 
        const { guess } = req.body;
        const randomNumber = Math.floor(Math.random()*(game.maxNumber - game.minNumber+1)) + game.minNumber;
        let result  = "lose";
        if(guess == randomNumber) {
            result = 'win';
            game.points += 5;
            game.consecutiveLosses = 0;
               
        } else {
            game.consecutiveLosses = game.consecutiveLosses + 1; 
            if(game.consecutiveLosses >= 3) {
                GameStorage.remove(gameId);
                return res.status(400).json({ message: "Game terminated due to consecutive losses"});
            }
                
        
        GameStorage.insert(gameId,game);
        return res.status(200).json({ result, totalScore:game.points});

}});

     // Play number with its either sides two neighbors
     app.post('/games/:id/neighbors',(req:any, res:any)=>{
        const gameId = req.params.id;
        if(!checkTypes(req.body)) return res.status(400).json({message: "only number allowed"});
        const gameExist = GameStorage.get(gameId);
        let result = 'lose';
        const borderArray = [];
        if('None' in gameExist ){
            return res.status(404).json({ message: 'Game not found' });
        } 
        
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
        } else {
            game.consecutiveLosses++;
            if (game.consecutiveLosses >= 3) {
                GameStorage.remove(gameId);
                return res.status(400).json({ message: 'Game terminated due to consecutive losses' });
            }

        }

        GameStorage.insert(gameId,game);
        return res.status(200).json({ result, totalScore:game.points,borderArray});
     }); 
     
     
        return app.listen();
})

const getCurrentDate=()=>{
    const timeStamp = new Number(ic.time());
    return new Date(timeStamp.valueOf()/1000_000)
}