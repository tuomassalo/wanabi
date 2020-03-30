import * as AWS from 'aws-sdk'
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client'
import * as dynamodbClient from 'serverless-dynamodb-client'
import * as engine from 'wanabi-engine'

type TConnectionId = string

const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT,
  sslEnabled: !process.env.APIG_ENDPOINT?.startsWith('http://'),
})

const dynamodb: DocumentClient = dynamodbClient.doc

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
async function scanGames(scanParams = {}): Promise<engine.Game[]> {
  const games = (await scan<engine.TCompleteGameState>(gameTable, scanParams))
    .sort((a, b) =>
      a.playedActions[a.playedActions.length - 1].timestamp > b.playedActions[b.playedActions.length - 1].timestamp
        ? -1
        : 1,
    )
    .map(game => new engine.Game({from: 'SERIALIZED_GAME', game}))

  const allConnections = new Set(await getAllConnections())
  console.warn(333, {allConnections})
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
    console.warn(334, game.players)
  }

  return games
}

async function getAllConnections(): Promise<TConnectionId[]> {
  return (await scan<any>(connectionTable, {AttributesToGet: ['connectionId']})).map(item => item.connectionId)
}
async function deleteGame(gameId: engine.TGameId) {
  await dynamodb.delete({TableName: gameTable, Key: {gameId}}).promise()
}

async function sendGamesState(toConnections: TConnectionId[]) {
  const games = await scanGames()

  const allConnections = new Set(await getAllConnections())

  console.warn({allConnections})

  // set isConnected for all players in all games
  for (const game of games) {
    for (const p of game.players) {
      if (allConnections.has(p.id)) {
        p.isConnected = true
      } else {
        p.isConnected = false
        p.id = 'NONE'
      }
    }
  }

  console.warn('sending game state to', ...toConnections)

  console.warn(...toConnections.map(cId => JSON.stringify(games.map(g => g.getState(cId)))))

  await Promise.all(
    toConnections.map(cId => {
      const data: engine.WebsocketServerMessage = {
        msg: 'M_GamesState',
        games: games.map(g => g.getState(cId)),
        timestamp: new Date().toISOString(),
      }

      return apig.postToConnection({ConnectionId: cId, Data: JSON.stringify(data)}).promise()
    }),
  )
}
async function broadcastGamesState() {
  return await sendGamesState(await getAllConnections())
}
async function updateGame(game: engine.Game, prevTimestamp: string) {
  const newData = JSON.parse(JSON.stringify(game)) as engine.TCompleteGameState

  // workaround: avoid setting null values to dynamodb
  delete newData.turn0.turnsLeft
  // if (isNaN(newData.turnsLeft as number)) delete newData.turnsLeft
  delete newData.gameId // never changes
  const updateKeys = Object.keys(newData)
  const newDataWithColons = Object.fromEntries(updateKeys.map(k => [':' + k, newData[k]]))

  console.warn({prevTimestamp, updateKeys}, newDataWithColons)

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
}

async function _getGame(gameId: engine.TGameId): Promise<engine.Game> {
  const game = (await scanGames()).find(g => g.gameId === gameId) // TODO: do this on server
  if (!game) throw new Error('No game found')

  return game
  // return new engine.Game({from: 'SERIALIZED_GAME', game: game.toJSON()})
}

export async function getGamesState({}: engine.WS_getGamesStateParams, connectionId: string) {
  await sendGamesState([connectionId])
  // const data: engine.WebsocketServerMessage = {
  //   msg: 'M_GamesState',
  //   games: (await _getGamesState(connectionId)).map(t => new engine.Turn(t).getState(connectionId)),
  //   timestamp: new Date().toISOString(),
  // }
  // await apig.postToConnection({ConnectionId: connectionId, Data: JSON.stringify(data)}).promise()
}

export async function createGame({firstPlayerName}: engine.WS_createGameParams, connectionId: string) {
  const turn0 = engine.Game.createPendingGame(firstPlayerName, connectionId)

  if (firstPlayerName === 'BOBBY_TABLES' && process.env.IS_OFFLINE) {
    console.warn('Wiping dev tables.')

    const ids = await scanGames()
    console.warn({ids})

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
  const player = game.players[playerIdx] // HACK: part of player state lives at turn[0]

  console.warn(111, player)
  if (!player) {
    throw new Error('No such player')
  }

  if (player.isConnected) {
    throw new Error('Player is already connected from another connection')
  }
  if ((await getAllConnections()).some(cId => cId === player.id)) {
    throw new Error('This connection is already occupied by another player')
  }

  player.id = connectionId
  player.isConnected = true

  console.warn(222, player)
  console.warn(2222, game.players[playerIdx])

  await updateGame(game, game.currentTurn.timestamp)

  // send updated game state to all players
  await broadcastGamesState()
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
