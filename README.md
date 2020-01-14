# Dev

This repo has three different subprojects:

- `engine/` - the game logic, shared between client and server.

- `client/` - React app for actually playing the game.

- `server/` - Serverless server code. (Yes.)

## Engine

```
cd engine
npm i
npm tsc
npm run test

```

## Client

```
# Run react dev web server
cd client
npm i
npm link ../engine
npm run start
```

## Server

First, add aws creds.

```
cd server
npm i

# first run only: install local dynamodb (creates `.dynamodb` directory)
sls dynamodb install
npm link ../engine

# Start the serverless-offline services: api gateway and dynamodb
npm run localbackend

# To try broadcasting a message to all listening clients
npm run localbroadcast
```

### Deploy

[TODO!]

```
# Deploy to AWS first
npm run sls -- deploy

```
