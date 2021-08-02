# Dev

This repo has three different subprojects:

- `engine/` - the game logic, shared between client and server.

- `client/` - React app for actually playing the game.

- `server/` - Serverless server code. (Yes.)

## Engine

```
cd engine
npm i
npx tsc --watch
npm run test

```

## Client

```
# Run react dev web server
cd client
npm i
npm run start
```

## Server

First, add aws creds.

```
cd server
npm i

# first run only: install local dynamodb (creates `.dynamodb` directory)
sls dynamodb install

npx tsc --watch

# Run `socat` (for allowing local network to join)
socat TCP-LISTEN:13001,fork TCP:127.0.0.1:3001

# Start the serverless-offline services: api gateway and dynamodb
npm run localbackend

# To try broadcasting a message to all listening clients
npm run localbroadcast
```

### Deploy

```

./deploy.sh

```

### Saving and restoring local games:

```
aws dynamodb scan --table-name WanabiGames --endpoint-url http://localhost:3003 > mygames.json

aws dynamodb put-item --table-name WanabiGames --endpoint-url http://localhost:3003 --item "$(jq '.Items[0]' < mygames.json)"
```

## Known bugs

- If there are no hints left, mystery view cannot be turned off after hovering (at least on Safari)

- Some bugs related to mystery views and browsing the history while a new turn is added

- When browsing the history, hint hover tooltips show wrong information

- In some (unknown) situations, a disconnect is not detected, and the player cannot reconnect

- Browsing the history after ending a 30 point game is impossible without a reload
