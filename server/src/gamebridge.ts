import * as AWS from 'aws-sdk'
import * as engine from 'wanabi-engine'
import {TPlayerId} from 'wanabi-engine/dist/player'

// const AWS = require('aws-sdk')
const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT,
  sslEnabled: false,
})
const dynamodb = new AWS.DynamoDB.DocumentClient({endpoint: 'http://localhost:8000'})

const connectionTable = 'WanabiConnections'
const gameTable = 'WanabiGames'

async function scan(tableName: string, scanParams: any, ExclusiveStartKey?: AWS.DynamoDB.DocumentClient.Key) {
  const {Items, LastEvaluatedKey} = await dynamodb
    .scan({TableName: tableName, ...scanParams, ExclusiveStartKey})
    .promise()

  if (!Items) throw new Error('No Items')

  // get more if the result was paginated
  if (LastEvaluatedKey) Items.push(...(await scan(tableName, scanParams, LastEvaluatedKey)))

  return Items
}

async function getAllConnections() {
  return (await scan(connectionTable, {AttributesToGet: ['connectionId']})).map(item => item.connectionId)
}

async function broadcastMsg(data: engine.WebsocketServerMessage) {
  await Promise.all(
    (await getAllConnections()).map(cId =>
      apig.postToConnection({ConnectionId: cId, Data: JSON.stringify(data)}).promise(),
    ),
  )
}
async function sendStateToPlayers(game: engine.Game) {
  for (const p of game.players) {
    const data: engine.WebsocketServerMessage = {msg: 'M_GameState', currentTurn: game.getState(p.id)}
    await apig.postToConnection({ConnectionId: p.id, Data: JSON.stringify(data)}).promise()
  }
}

function tmpCreateBogusGame() {
  return new engine.Game({from: 'NEW_TEST_GAME', playerNames: ['Foo', 'Bar']})
}

// async function _getGame(gameId: engine.TGameId): Promise<engine.Game> {
//   const {Items, LastEvaluatedKey} = await dynamodb
//     .scan({TableName: gameTable, AttributesToGet: ['connectionId'], ExclusiveStartKey})
//     .promise()

//   if (!Items) {
//     throw new Error('No Items')
//   }
//   const connections = Items.map(({connectionId}) => connectionId)
//   if (LastEvaluatedKey) {
//     connections.push(...(await getAllConnections(LastEvaluatedKey)))
//   }

//   return tmpCreateBogusGame() // TMP!
// }
async function _getGames(playerId: TPlayerId): Promise<engine.Game[]> {
  // TODO: get from db
  return [tmpCreateBogusGame()]
}

export async function getGamesState({}: engine.WS_getGamesStateParams, connectionId: string) {
  const data: engine.WebsocketServerMessage = {
    msg: 'M_GamesState',
    games: (await _getGames(connectionId)).map(g => g.getState(connectionId)),
  }
  await apig.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(data)}).promise()
}

export async function getGameState({gameId}: engine.WS_getGameStateParams, connectionId: string) {
  const g = await _getGame(gameId)
  const data: engine.WebsocketServerMessage = {msg: 'M_GameState', currentTurn: g.getState(connectionId)}
  await apig.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(data)}).promise()
}

export async function createGame({firstPlayerName}: engine.WS_createGameParams, connectionId: string) {
  const g = engine.Game.createPendingGame(firstPlayerName, connectionId)
  // TODO: save game status to db

  // send updated state to all players
  await broadcastMsg({msg: 'M_GamesState', games: [g.getState('')]})
}
export async function joinGame({newPlayerName}: engine.WS_joinGameParams, connectionId: string) {
  const g = engine.Game.createPendingGame(newPlayerName, connectionId)
  // TODO: save game status to db

  // send updated game state to all players
  await broadcastMsg({msg: 'M_GamesState', games: [g.getState('')]})
}

export async function act({gameId, actionParams}: engine.WS_actParams, connectionId: string) {
  const g = await _getGame(gameId)
  g.act(connectionId, actionParams)

  // send updated game state to all players
  await sendStateToPlayers(g)
}
