import * as AWS from 'aws-sdk'
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client'
import * as dynamodbClient from 'serverless-dynamodb-client'
import * as engine from 'wanabi-engine'
import pako from 'pako'

type TConnectionId = string

const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT,
  sslEnabled: !process.env.APIG_ENDPOINT?.startsWith('http://'),
})
async function send(connectionId: TConnectionId, data: engine.WebsocketServerMessage) {
  // const compressedData = Buffer.from(pako.deflate(JSON.stringify(data), {to: 'string'})).toString('base64')
  const compressedData = pako.deflate(JSON.stringify(data), {to: 'string'})
  console.warn(`Sending ${data.msg} to ${connectionId} (${compressedData.length} bytes)`)

  return apig.postToConnection({ConnectionId: connectionId, Data: compressedData}).promise()
}

const dynamodb: DocumentClient = dynamodbClient.doc

const connectionTable = 'WanabiConnections'
const gameTable = 'WanabiGames'

async function scan<I>(
  tableName: string,
  scanParams: any,
  ExclusiveStartKey?: AWS.DynamoDB.DocumentClient.Key,
): Promise<I[]> {
  // const t0 = +new Date()

  const {Items, LastEvaluatedKey} = await dynamodb
    .scan({TableName: tableName, ...scanParams, ExclusiveStartKey})
    .promise()

  if (!Items) throw new Error('No Items')

  // get more if the result was paginated
  if (LastEvaluatedKey) Items.push(...(await scan<I>(tableName, scanParams, LastEvaluatedKey)))

  // const elapsedTime = +new Date() - t0
  // console.warn(`SCAN_TIME: ${elapsedTime} ms`, tableName, scanParams)

  return Items as I[]
}
async function scanGames(scanParams = {}): Promise<engine.Game[]> {
  const games = (await scan<engine.TCompleteGameState>(gameTable, scanParams))
    .sort((a, b) =>
      a.playedActions[a.playedActions.length - 1].timestamp > b.playedActions[b.playedActions.length - 1].timestamp
        ? -1
        : 1,
    )
    .map(game => new engine.Game({from: 'SERIALIZED_GAME', game}))

  const allConnections = new Set(await getAllConnections())

  for (const game of games) {
    // update isConnected for all players

    for (const player of game.players) {
      if (allConnections.has(player.id)) {
        player.isConnected = true
      } else {
        player.isConnected = false
        player.id = 'NONE'
      }
    }
  }

  return games
}

async function getAllConnections(): Promise<TConnectionId[]> {
  return (await scan<any>(connectionTable, {AttributesToGet: ['connectionId']})).map(item => item.connectionId)
}
async function deleteGame(gameId: engine.TGameId) {
  await dynamodb.delete({TableName: gameTable, Key: {gameId}}).promise()
}

async function broadcastGamesState() {
  await sendState()
}
async function sendState(onlySendToConnectionId?: TConnectionId) {
  const games = await scanGames()

  const allConnections = new Set(await getAllConnections())

  const connectionToGame: {[key: string]: engine.Game} = {}

  // console.warn({allConnections})

  // set isConnected for all players in all games
  for (const game of games) {
    for (const p of game.players) {
      if (allConnections.has(p.id)) {
        connectionToGame[p.id] = game
        p.isConnected = true
      } else {
        p.isConnected = false
        p.id = 'NONE'
      }
    }
  }

  const sendGame = (cId: TConnectionId, game: engine.Game) =>
    send(cId, {
      msg: 'M_GameState',
      game: game.getState(cId),
      timestamp: new Date().toISOString(),
    })

  const sendGames = (cId: TConnectionId) =>
    send(cId, {
      msg: 'M_GamesState',
      games: games.map(g => g.getState(cId)),
      timestamp: new Date().toISOString(),
    })

  if (onlySendToConnectionId) {
    if (connectionToGame[onlySendToConnectionId]) {
      await sendGame(onlySendToConnectionId, connectionToGame[onlySendToConnectionId])
    } else {
      await sendGames(onlySendToConnectionId)
    }
  } else {
    // send current game status to everyone connected to a certain game
    await Promise.all(Object.entries(connectionToGame).map(([cId, game]) => sendGame(cId, game)))

    // send overall status to everyone else
    await Promise.all([...allConnections].filter(cId => !connectionToGame[cId]).map(sendGames))
  }
}
async function updateGame(game: engine.Game, prevTimestamp: string) {
  const newData = JSON.parse(JSON.stringify(game)) as engine.TCompleteGameState

  // workaround: avoid setting null values to dynamodb
  delete newData.turn0.turnsLeft
  // if (isNaN(newData.turnsLeft as number)) delete newData.turnsLeft
  delete newData.gameId // never changes
  const updateKeys = Object.keys(newData)
  const newDataWithColons = Object.fromEntries(updateKeys.map(k => [':' + k, newData[k]]))

  // console.warn({prevTimestamp, updateKeys}, newDataWithColons)

  // const t0 = +new Date()

  await dynamodb
    .update({
      TableName: gameTable,
      Key: {gameId: game.gameId},
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

  // const elapsedTime = +new Date() - t0
  // console.warn(`UPDATE_TIME: ${elapsedTime} ms`, {gameId: game.gameId})
}

async function _getGame(gameId: engine.TGameId): Promise<engine.Game> {
  // throws if not found?
  const game = (await dynamodb.get({TableName: gameTable, Key: {gameId}}).promise()).Item as engine.TCompleteGameState
  if (!game) throw new Error('No game found')

  return new engine.Game({from: 'SERIALIZED_GAME', game})
  // return new engine.Game({from: 'SERIALIZED_GAME', game: game.toJSON()})
}

async function _sendTurnHistory(game: engine.Game, connectionId: TConnectionId) {
  await send(connectionId, {
    msg: 'M_GameHistory',
    gameId: game.gameId,
    previousTurns: game.getPreviousTurns(connectionId),
  })
}

export async function keepalive({}: engine.WS_keepaliveParams, connectionId: string) {
  console.warn('Got keepalive msg from ', connectionId)
}
export async function getGamesState({}: engine.WS_getGamesStateParams, connectionId: string) {
  await sendState(connectionId)
  // const data: engine.WebsocketServerMessage = {
  //   msg: 'M_GamesState',
  //   games: (await _getGamesState(connectionId)).map(t => new engine.Turn(t).getState(connectionId)),
  //   timestamp: new Date().toISOString(),
  // }
  // await apig.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(data)}).promise()
}

export async function createGame(params: engine.WS_createGameParams, connectionId: string) {
  const turn0 = engine.Game.createPendingGame(params, connectionId)

  if (params.firstPlayerName === 'BOBBY_TABLES' && process.env.IS_OFFLINE) {
    console.warn('Wiping dev tables.')

    for (const {gameId} of await scanGames()) {
      await deleteGame(gameId)
    }
  }

  await dynamodb.put({TableName: gameTable, Item: JSON.parse(JSON.stringify(turn0))}).promise()

  // send updated state to all players
  await broadcastGamesState()
}
export async function joinGame({gameId, newPlayerName}: engine.WS_joinGameParams, connectionId: string) {
  const pendingGame = await _getGame(gameId)
  if (pendingGame.currentTurn.status !== 'WAITING_FOR_PLAYERS') throw new Error('GAME_ALREADY_STARTED')

  const g = engine.Game.joinPendingGame(pendingGame, newPlayerName, connectionId)

  // save game status to db
  await updateGame(g, pendingGame.currentTurn.timestamp)

  // send updated game state to all players
  await broadcastGamesState()
}

export async function startGame({gameId}: engine.WS_startGameParams, connectionId: string) {
  const pendingGame = await _getGame(gameId)
  const g = engine.Game.startPendingGame(pendingGame)

  // save game status to db
  await updateGame(g, pendingGame.currentTurn.timestamp)

  // send updated game state to all players
  await broadcastGamesState()
}

export async function act({gameId, actionParams}: engine.WS_actParams, connectionId: string) {
  const g = await _getGame(gameId)
  const prevTimestamp = g.currentTurn.timestamp
  g.act(connectionId, actionParams)

  // save game status to db
  await updateGame(g, prevTimestamp)

  // send updated game state to all players
  await broadcastGamesState()
}

export async function rejoinGame({gameId, playerIdx}: engine.WS_rejoinGameParams, connectionId: string) {
  const game = await _getGame(gameId)
  const player = game.players[playerIdx]

  if (!player) {
    throw new Error('No such player')
  }

  if (player.isConnected) {
    // This is commented out to allow "force rejoin"
    // throw new Error('Player is already connected from another connection')
    console.warn('Force rejoining', {playerIdx, old: player.id, new: connectionId})
  }

  if ((await getAllConnections()).some(cId => cId === player.id)) {
    throw new Error('This connection is already occupied by another player')
  }

  player.id = connectionId
  player.isConnected = true

  await updateGame(game, game.currentTurn.timestamp)

  // send updated game state to all players
  await broadcastGamesState()

  // Send turn history to the player who joined. But first, fetch the game so we have
  // the current connection - otherwise getState would return an outsider view.)
  const gameWithUpdatedConnectionId = await _getGame(gameId)
  await _sendTurnHistory(gameWithUpdatedConnectionId, connectionId)
}

export async function purgeGames() {
  const allConnections = new Set(await getAllConnections())

  // purge non-started games that have no connected players
  const purgeGames = (await scanGames()).filter(
    game => game.currentTurn.status === 'WAITING_FOR_PLAYERS' && game.players.every(p => !allConnections.has(p.id)),
  )

  await Promise.all(purgeGames.map(game => deleteGame(game.gameId)))

  await broadcastGamesState()
}
