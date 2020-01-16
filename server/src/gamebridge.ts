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
async function scanGames(scanParams = {}) {
  return await scan<engine.TCompleteTurnState>(gameTable, scanParams)
}

async function getAllConnections() {
  return (await scan<any>(connectionTable, {AttributesToGet: ['connectionId']})).map(item => item.connectionId)
}

async function broadcastGamesState() {
  const turns = await scanGames()

  await Promise.all(
    (await getAllConnections()).map(cId => {
      const data: engine.WebsocketServerMessage = {
        msg: 'M_GamesState',
        games: turns
          .filter(t => t.status === 'WAITING_FOR_PLAYERS' || t.players.some(p => p.id === cId))
          .map(t => engine.Turn.deserialize(t).getState(cId)),
        timestamp: new Date().toISOString(),
      }

      return apig.postToConnection({ConnectionId: cId, Data: JSON.stringify(data)}).promise()
    }),
  )
}

async function updateGame(turn: engine.Turn, prevTimestamp: string) {
  const newData = JSON.parse(JSON.stringify(turn))
  if (!newData.turnsLeft) delete newData.turnsLeft
  delete newData.gameId // never changes
  const updateKeys = Object.keys(newData)
  const newDataWithColons = Object.fromEntries(updateKeys.map(k => [':' + k, newData[k]]))

  await dynamodb
    .update({
      TableName: gameTable,
      Key: {gameId: turn.gameId},
      UpdateExpression: 'SET ' + updateKeys.map(k => `#X_${k} = :${k}`).join(', '),
      ExpressionAttributeNames: {
        '#X_timestamp': 'timestamp',
        ...Object.fromEntries(Object.keys(newData).map(k => [`#X_${k}`, k])),
      },
      ExpressionAttributeValues: {
        ...newDataWithColons,
        ':oldTimestamp': prevTimestamp,
      },
      ConditionExpression: '#X_timestamp = :oldTimestamp',
    })
    .promise()
}

async function _getGame(gameId: engine.TGameId): Promise<engine.Game> {
  const turn = (await scanGames()).find(t => t.gameId === gameId)
  if (!turn) throw new Error('No turn found')

  return new engine.Game({from: 'SERIALIZED_TURNS', turns: [turn]})
}
async function _getGamesState(playerId: TPlayerId): Promise<engine.TCompleteTurnState[]> {
  const turns = await scanGames()

  return turns.filter(t => t.status === 'WAITING_FOR_PLAYERS' || t.players.some(p => p.id === playerId))
}

export async function getGamesState({}: engine.WS_getGamesStateParams, connectionId: string) {
  const data: engine.WebsocketServerMessage = {
    msg: 'M_GamesState',
    games: (await _getGamesState(connectionId)).map(t => engine.Turn.deserialize(t).getState(connectionId)),
    timestamp: new Date().toISOString(),
  }
  await apig.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(data)}).promise()
}

export async function createGame({firstPlayerName}: engine.WS_createGameParams, connectionId: string) {
  const turn0 = engine.Game.createPendingGame(firstPlayerName, connectionId)

  if (firstPlayerName === 'BOBBY_TABLES' && process.env.IS_OFFLINE) {
    console.warn('Wiping dev tables.')

    for (const {gameId} of await scanGames({AttributesToGet: ['gameId']})) {
      await dynamodb.delete({TableName: gameTable, Key: {gameId}}).promise()
    }
  }

  await dynamodb.put({TableName: gameTable, Item: JSON.parse(JSON.stringify(turn0))}).promise()

  // send updated state to all players
  await broadcastGamesState()
}
export async function joinGame({gameId, newPlayerName}: engine.WS_joinGameParams, connectionId: string) {
  const pendingGame = await _getGame(gameId)
  if (pendingGame.currentTurn.status !== 'WAITING_FOR_PLAYERS') throw new Error('GAME_ALREADY_STARTED')

  const pendingGameTurn = pendingGame.currentTurn
  const g = engine.Game.joinPendingGame(pendingGameTurn, newPlayerName, connectionId)

  // save game status to db
  await updateGame(g, pendingGameTurn.timestamp)

  // send updated game state to all players
  await broadcastGamesState()
}

export async function startGame({gameId}: engine.WS_startGameParams, connectionId: string) {
  const pendingGameTurn = (await _getGame(gameId)).currentTurn
  const g = engine.Game.startPendingGame(pendingGameTurn)

  // save game status to db
  await updateGame(g.currentTurn, pendingGameTurn.timestamp)

  // send updated game state to all players
  await broadcastGamesState()
}

export async function act({gameId, actionParams}: engine.WS_actParams, connectionId: string) {
  const g = await _getGame(gameId)
  const prevTimestamp = g.currentTurn.timestamp
  g.act(connectionId, actionParams)

  // save game status to db
  await updateGame(g.currentTurn, prevTimestamp)

  // send updated game state to all players
  await broadcastGamesState()
}
