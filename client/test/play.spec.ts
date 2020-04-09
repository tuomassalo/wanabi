import {WebSocketClient} from '../src/websocketclient'
import * as game from 'wanabi-engine'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

let gameId: string
let ws1: WebSocketClient, ws2: WebSocketClient

const msgQueues: {[key: string]: game.M_GamesState[]} = {ws1: [], ws2: []}

beforeAll(async () => {
  await new Promise((r) => setTimeout(r, 100)) // fix obscure race when running all tests
  ws1 = new WebSocketClient()
  ws2 = new WebSocketClient()

  ws1.on('msg', (msg: game.M_GamesState) => {
    msgQueues.ws1.push(msg)
  })
  ws2.on('msg', (msg: game.M_GamesState) => {
    msgQueues.ws2.push(msg)
  })

  // https://github.com/facebook/react/issues/11098#issuecomment-412682721
  // window.addEventListener('error', (event: any) => event.preventDefault())
})
beforeEach(() => {
  msgQueues.ws1 = []
  msgQueues.ws2 = []
})

// poll for new messages
// NB: actually this returns a game.WebsocketServerMessage, but usually
// we need a game.M_GamesState, so we pretend this returns such a thing.
async function waitMsg(websocketName: 'ws1' | 'ws2' | 'ws3'): Promise<game.M_GamesState> {
  const q = msgQueues[websocketName]
  let waitedFor = 0
  // console.warn(`waiting for ${websocketName}...`)

  while (q.length === 0) {
    if (waitedFor > 6000) {
      throw new Error(`TIMEOUT waiting ${websocketName}`)
    }
    await new Promise((r) => setTimeout(r, 10))
    waitedFor += 10
  }
  // console.warn(`got a response in ${waitedFor} ms.`)
  return q.shift() as game.M_GamesState
}

test('connect, createGame', async (done) => {
  ws1.createGame({firstPlayerName: 'BOBBY_TABLES'}) // this wipes the tables in dev
  const msg = await waitMsg('ws1')
  expect(msg).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'START'},
          discardPile: [],
          playerHandViews: [{hand: [], isMe: true}],
          hintCount: 9,
          inTurn: 0,
          score: 0,
          status: 'WAITING_FOR_PLAYERS',
          stockSize: 60,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 0,
          turnsLeft: null,
          woundCount: 0,
        },
        playedActions: [{action: {type: 'START'}, timestamp: jasmine.any(String)}],
        players: [{id: jasmine.any(String), idx: 0, isConnected: true, name: 'BOBBY_TABLES'}],
      },
    ],
    msg: 'M_GamesState',
    timestamp: jasmine.any(String),
  })
  gameId = msg.games[0].gameId

  expect(gameId).toMatch(/\w/)
  // this obscure delay is needed; otherwise messages get somehow garbled
  setTimeout(done, 100)
})

test('joinGame', async (done) => {
  ws2.joinGame({newPlayerName: 'Beatrice', gameId})
  expect(await waitMsg('ws2')).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'START'},
          discardPile: [],
          hintCount: 9,
          inTurn: 0,
          playerHandViews: [
            {extraMysticalHand: [], hand: [], isMe: false},
            {hand: [], isMe: true},
          ],
          score: 0,
          status: 'WAITING_FOR_PLAYERS',
          stockSize: 60,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 0,
          turnsLeft: null,
          woundCount: 0,
        },
        playedActions: [{action: {type: 'START'}, timestamp: jasmine.any(String)}],
        players: [
          {id: 'REDACTED', idx: 0, isConnected: true, name: 'BOBBY_TABLES'},
          {id: jasmine.any(String), idx: 1, isConnected: true, name: 'Beatrice'},
        ],
      },
    ],
    msg: 'M_GamesState',
    timestamp: jasmine.any(String),
  })
  setTimeout(done, 100)
})

test('startGame', async (done) => {
  ws1.startGame({gameId})
  expect(await waitMsg('ws1')).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'START'},
          discardPile: [],
          hintCount: 9,
          inTurn: 0,
          playerHandViews: [
            {
              isMe: true,
              hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
            },
            {
              extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
              hand: [
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
              ],
              isMe: false,
            },
          ],
          score: 0,
          status: 'RUNNING',
          stockSize: 50,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 0,
          turnsLeft: null,
          woundCount: 0,
        },
        playedActions: [{action: {type: 'START'}, timestamp: jasmine.any(String)}],
        players: [
          {id: jasmine.any(String), idx: 0, isConnected: true, name: 'BOBBY_TABLES'},
          {id: jasmine.any(String), idx: 1, isConnected: true, name: 'Beatrice'},
        ],
      },
    ],
    msg: 'M_GamesState',
    timestamp: jasmine.any(String),
  })
  setTimeout(done, 200)
})

test('act', async (done) => {
  let turn: game.TMaskedTurnState

  const getTurnState = async () => {
    return (await waitMsg('ws1')).games[0].currentTurn
  }

  for (let n = 0; n <= 23; n++) {
    ws1.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 0}})

    turn = await getTurnState()
    expect(turn.turnNumber).toEqual(2 * n + 1)
    expect(turn.stockSize).toEqual(50 - 2 * n - 1)
    ws2.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 0}})

    turn = await getTurnState()
    expect(turn.stockSize).toEqual(50 - 2 * n - 2)
  }

  ws1.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 0}})
  turn = await getTurnState()
  expect(turn.turnNumber).toEqual(49)
  expect(turn.stockSize).toEqual(1)
  expect(turn.turnsLeft).toBeNull()

  ws2.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 0}})
  turn = await getTurnState()
  expect(turn.stockSize).toEqual(0)

  // stock is now empty, so turnsLeft starts counting
  expect(turn.turnsLeft).toEqual(2)

  ws1.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 0}})
  turn = await getTurnState()
  expect(turn.turnsLeft).toEqual(1)

  ws2.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 0}})
  turn = await getTurnState()
  expect(turn.turnsLeft).toEqual(0)
  expect(turn.status).toEqual('FINISHED')

  setTimeout(done, 200)
})
