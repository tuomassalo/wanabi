import {WebSocketClient} from '../src/websocketclient'
import * as game from 'wanabi-engine'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

let gameId: string
let ws1: WebSocketClient, ws2: WebSocketClient, ws3: WebSocketClient

const msgQueues: {[key: string]: game.M_GamesState[]} = {ws1: [], ws2: [], ws3: []}

beforeAll(async () => {
  await new Promise(r => setTimeout(r, 100)) // fix obscure race when running all tests
  ws1 = new WebSocketClient()
  ws2 = new WebSocketClient()
  ws3 = new WebSocketClient()

  ws1.on('msg', (msg: game.M_GamesState) => {
    msgQueues.ws1.push(msg)
  })
  ws2.on('msg', (msg: game.M_GamesState) => {
    msgQueues.ws2.push(msg)
  })
  ws3.on('msg', (msg: game.M_GamesState) => {
    msgQueues.ws3.push(msg)
  })

  // https://github.com/facebook/react/issues/11098#issuecomment-412682721
  // window.addEventListener('error', (event: any) => event.preventDefault())
})
beforeEach(() => {
  msgQueues.ws1 = []
  msgQueues.ws2 = []
  msgQueues.ws3 = []
})

// poll for new messages
async function waitMsg(websocketName: 'ws1' | 'ws2' | 'ws3'): Promise<game.M_GamesState> {
  const q = msgQueues[websocketName]
  let waitedFor = 0
  // console.warn(`waiting for ${websocketName}...`)

  while (q.length === 0) {
    if (waitedFor > 6000) {
      throw new Error(`TIMEOUT waiting ${websocketName}`)
    }
    await new Promise(r => setTimeout(r, 10))
    waitedFor += 10
  }
  // console.warn(`got a response in ${waitedFor} ms.`)
  return q.shift() as game.WebsocketServerMessage
}

test('connect, createGame', async done => {
  ws1.createGame({firstPlayerName: 'BOBBY_TABLES'}) // this wipes the tables in dev
  const msg = await waitMsg('ws1')
  expect(msg).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'START'},
          discardPile: [],
          hintCount: 9,
          inTurn: 0,
          playerHandViews: [{hand: [], isMe: true}],
          score: 0,
          status: 'WAITING_FOR_PLAYERS',
          stockSize: 60,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 0,
          turnsLeft: null,
          woundCount: 0,
        },
        players: [{id: jasmine.any(String), idx: 0, isConnected: true, name: 'BOBBY_TABLES'}],
        playedActions: [{action: {type: 'START'}, timestamp: jasmine.any(String)}],
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

test('getGamesState', async done => {
  ws2.getGamesState({})
  const msg = await waitMsg('ws2')
  expect(msg).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'START'},
          discardPile: [],
          hintCount: 9,
          inTurn: 0,
          playerHandViews: [],
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
        players: [{id: 'REDACTED', idx: 0, isConnected: true, name: 'BOBBY_TABLES'}],
      },
    ],
    msg: 'M_GamesState',
    timestamp: jasmine.any(String),
  })
  setTimeout(done, 100)
})

test('joinGame', async done => {
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

test('startGame', async done => {
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
          {id: 'REDACTED', idx: 1, isConnected: true, name: 'Beatrice'},
        ],
      },
    ],
    msg: 'M_GamesState',
    timestamp: jasmine.any(String),
  })
  setTimeout(done, 100)
})

test('act', async done => {
  ws1.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 2}})
  expect(await waitMsg('ws1')).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'DISCARD', card: jasmine.any(String), cardIdx: 2},
          discardPile: [jasmine.any(String)],
          hintCount: 9,
          inTurn: 1,
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
          stockSize: 49,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 1,
          turnsLeft: null,
          woundCount: 0,
        },
        playedActions: [
          {action: {type: 'START'}, timestamp: jasmine.any(String)},
          {action: {type: 'DISCARD', cardIdx: 2, card: jasmine.any(String)}, timestamp: jasmine.any(String)},
        ],
        players: [
          {id: jasmine.any(String), idx: 0, isConnected: true, name: 'BOBBY_TABLES'},
          {id: 'REDACTED', idx: 1, isConnected: true, name: 'Beatrice'},
        ],
      },
    ],

    msg: 'M_GamesState',
    timestamp: jasmine.any(String),
  })
  expect(await waitMsg('ws2')).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'DISCARD', card: jasmine.any(String), cardIdx: 2},
          discardPile: [jasmine.any(String)],
          hintCount: 9,
          inTurn: 1,
          playerHandViews: [
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
            {
              isMe: true,
              hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
            },
          ],
          score: 0,
          status: 'RUNNING',
          stockSize: 49,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 1,
          turnsLeft: null,
          woundCount: 0,
        },
        playedActions: [
          {action: {type: 'START'}, timestamp: jasmine.any(String)},
          {action: {type: 'DISCARD', cardIdx: 2, card: jasmine.any(String)}, timestamp: jasmine.any(String)},
        ],
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

test('An outsider sees the started game, but cannot see any hands', async done => {
  ws3.getGamesState({})
  expect(await waitMsg('ws3')).toEqual({
    games: [
      {
        gameId: jasmine.any(String),
        currentTurn: {
          action: {type: 'DISCARD', card: jasmine.any(String), cardIdx: 2},
          discardPile: [jasmine.any(String)],
          hintCount: 9,
          inTurn: 1,
          playerHandViews: [], // NB: no hands are shown
          score: 0,
          status: 'RUNNING',
          stockSize: 49,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 1,
          turnsLeft: null,
          woundCount: 0,
        },
        playedActions: [
          {action: {type: 'START'}, timestamp: jasmine.any(String)},
          {action: {type: 'DISCARD', cardIdx: 2, card: jasmine.any(String)}, timestamp: jasmine.any(String)},
        ],
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

test('An "outsider" can join a game if someone disconnects', async done => {
  // ws2 disconnects, ws3 replaces them.

  await new Promise(r => setTimeout(r, 100))
  ws2.disconnect()
  await new Promise(r => setTimeout(r, 100))

  const msg = await waitMsg('ws3')

  expect(msg.games[0].players).toEqual([
    {id: 'REDACTED', idx: 0, isConnected: true, name: 'BOBBY_TABLES'},
    {id: 'REDACTED', idx: 1, isConnected: false, name: 'Beatrice'}, // NB: not connected!
  ])

  await new Promise(r => setTimeout(r, 100))
  ws3.rejoinGame({gameId: msg.games[0].gameId, playerIdx: 1})

  const msg2 = await waitMsg('ws3')
  expect(msg2.games[0].players).toEqual([
    {id: 'REDACTED', idx: 0, isConnected: true, name: 'BOBBY_TABLES'},
    {id: jasmine.any(String), idx: 1, isConnected: true, name: 'Beatrice'},
  ])

  expect(msg2.games[0].currentTurn.playerHandViews).toEqual([
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
    {
      hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
      isMe: true,
    },
  ])

  setTimeout(done, 100)
})
