# GameNightAssistantNg
## Game Night Assistant - front-end in Angular
The Game Night Assistant App for Home Assistant invites you to keep score on game night - it doesn't play the games for you, it's not online multiplayer or packed with cutting-edge AI, it's just a score-keeping tool... with added Home Assistant goodness. Basically, depending on the chosen game scoreboard, you can trigger your Home Assistant scripts based on game events, like running a script that flashes your lights red when a player is eliminated, or green when a player scores 100 points, or switching on a kettle's smart plug when the game is over. That sort of thing.

## Deployment note for the developer
`npm run dev` to build the FE and push built FE files to my local HA add-ons folder share via `deploy.js` node script that's triggered in `package.json`'s build script config. And... *breathe*. The backend repo is here: https://github.com/robchilcottdev/game-night-assistant
