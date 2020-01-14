# Dev

This repo has three different subprojects:

- `client/` - React app for actually playing the game.

- `server/` - Serverless server code. (Yes.)

- `engine/` - the game logic, shared between client and server.

## Client

```
# Run react dev web server
cd client && npm i && npm run start
```

## Server

First, add aws creds.

```
cd server
npm i

# first run only: install local dynamodb (creates `.dynamodb` directory)
sls dynamodb install

# Start the serverless-offline services: api gateway and dynamodb
npm run localbackend

# To try broadcasting a message to all listening clients
npm run localbroadcast
```

## Engine

```
cd engine
npm i
npm run test

```

### Deploy

[TODO!]

```
# Deploy to AWS first
npm run sls -- deploy

```
