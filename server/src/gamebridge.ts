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

async function scan<I>(
  tableName: string,
  scanParams: any,
  ExclusiveStartKey?: AWS.DynamoDB.DocumentClient.Key,
): Promise<I[]> {
  const {Items, LastEvaluatedKey} = await dynamodb
    .scan({TableName: tableName, ...scanParams, ExclusiveStartKey})
    .promise()

  if (!Items) throw new Error('No Items')

  // get more if the result was paginated
  if (LastEvaluatedKey) Items.push(...(await scan<I>(tableName, scanParams, LastEvaluatedKey)))

  return Items as I[]
}

async function getAllConnections() {
  return (await scan<any>(connectionTable, {AttributesToGet: ['connectionId']})).map(item => item.connectionId)
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

async function _getGame(gameId: engine.TGameId): Promise<engine.Game> {
  const turn = (await scan<engine.TCompleteTurnState>(gameTable, {})).find(
    t => t.gameId === gameId && t.status === 'WAITING_FOR_PLAYERS',
  )
  if (!turn) throw new Error('No turn found')

  return new engine.Game({from: 'SERIALIZED_TURNS', turns: [turn]})
}
async function _getGamesState(playerId: TPlayerId): Promise<engine.TMaskedTurnState[]> {
  const turns = await scan<engine.TCompleteTurnState>(gameTable, {})

  const turnsInMyGames = turns.filter(t => t.status === 'WAITING_FOR_PLAYERS' || t.players.some(p => p.id === playerId))

  console.warn(111, turnsInMyGames[0].players, playerId)

  const ret = turnsInMyGames.map(t => new engine.Game({from: 'SERIALIZED_TURNS', turns: [t]}).getState(playerId))

  console.warn(222, ret[0].players, playerId)

  return ret
}

export async function getGamesState({}: engine.WS_getGamesStateParams, connectionId: string) {
  const data: engine.WebsocketServerMessage = {
    msg: 'M_GamesState',
    games: await _getGamesState(connectionId),
  }
  await apig.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(data)}).promise()
}

export async function getGameState({gameId}: engine.WS_getGameStateParams, connectionId: string) {
  const g = await _getGame(gameId)
  const data: engine.WebsocketServerMessage = {msg: 'M_GameState', currentTurn: g.getState(connectionId)}
  await apig.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(data)}).promise()
}

export async function createGame({firstPlayerName}: engine.WS_createGameParams, connectionId: string) {
  const turn0 = engine.Game.createPendingGame(firstPlayerName, connectionId)

  if (firstPlayerName === 'BOBBY_TABLES' && process.env.IS_OFFLINE) {
    console.warn('Wiping dev tables.')

    for (const {gameId} of await scan<any>(gameTable, {AttributesToGet: ['gameId']})) {
      await dynamodb.delete({TableName: gameTable, Key: {gameId}}).promise()
    }
  }

  await dynamodb.put({TableName: gameTable, Item: JSON.parse(JSON.stringify(turn0))}).promise()

  // send updated state to all players
  await broadcastMsg({msg: 'M_GamesState', games: [turn0.getState(connectionId)]})
}
export async function joinGame({gameId, newPlayerName}: engine.WS_joinGameParams, connectionId: string) {
  const g = engine.Game.joinPendingGame((await _getGame(gameId)).currentTurn, newPlayerName, connectionId)
  // TODO: save game status to db

  // send updated game state to all players
  await broadcastMsg({msg: 'M_GamesState', games: [g.getState(connectionId)]})
}

export async function act({gameId, actionParams}: engine.WS_actParams, connectionId: string) {
  const g = await _getGame(gameId)
  g.act(connectionId, actionParams)

  // send updated game state to all players
  await sendStateToPlayers(g)
}
