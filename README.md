# GuessGame

The GuessGame is a game that allows people to guess the right number within their own limit. It helps individuals test their ability to choose correctly and their level of luck. It is simple and designed to be played by people of any age and does not require a strong background in mathematics.

## Features

- Player

 - Open Game(create)
 - View open games or single game
 - Play the game by providing the guess
 - or play by providing the guess and have access to its neighbors
 - Terminate the game(delete)

 ## Installation 

 Follow these steps to install the project

- Clone the repository
- install dependencies using `npm install`
- Run the project using `dfx start --host 127.0.0.1:8000 --clean --background`
- deploy locally `dfx deploy`


## Usage 
Once the project is up and running. Use Postman or other similar tools to make Http request to the endpoint.

# Endpoints
- `POST /games` : Create the game
- `GET /games`   : Get open games
- `GET /games/:id`: Get single open game
- `DELETE /games/:id`: Terminate the game

- `POST /games/:id/play`: Play game with one guess
- `POST /games/:id/neighbors`: Play game with a guess and its either side 2 number each.

## Example

Object to create game: 
```
 { minNumber:20, maxNumber: 30 }

```

Object to play the game: 
```
 { guess: 15 }
 
```



## Game Tutorial

Player  open a game by entering a minimum and maximum number.
Make sure the difference between the two numbers is at least 10 and the minimum number is not negative or greater than the maximum number.

=> Input a number and if it matches the randomly generated number within the specified range, then you win; otherwise you lose
=> Other option;input single number. The game generates an array of 5 numbers(include your guess) centered around the input number, 2 number each side if they are within game's limits. if random generate number includes in array then you win otherwise you loss


