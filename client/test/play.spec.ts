import {WebSocketClient} from '../src/websocketclient'
import * as game from 'wanabi-engine'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

let gameId: string
let ws1: WebSocketClient, ws2: WebSocketClient

beforeAll(async () => {
  await new Promise(r => setTimeout(r, 100)) // fix obscure race when running all tests
  ws1 = new WebSocketClient()
  ws2 = new WebSocketClient()
})
afterEach(() => {
  ws1.removeAllListeners()
  ws2.removeAllListeners()
})

test('connect, createGame', done => {
  expect.assertions(2)
  ws1.createGame({firstPlayerName: 'BOBBY_TABLES'}) // this wipes the tables in dev
  ws1.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'START'},
          discardPile: [],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 0,
          players: [{hand: [], idx: 0, isConnected: true, isMe: true, name: 'BOBBY_TABLES'}],
          score: 0,
          status: 'WAITING_FOR_PLAYERS',
          stockSize: 0,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 0,
          turnsLeft: null,
          woundCount: 0,
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
})

test('joinGame', done => {
  expect.assertions(1)
  ws2.joinGame({newPlayerName: 'Beatrice', gameId})
  ws2.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'START'},
          discardPile: [],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 0,
          players: [
            {hand: [], idx: 0, isConnected: true, isMe: false, name: 'BOBBY_TABLES'},
            {hand: [], idx: 1, isConnected: true, isMe: true, name: 'Beatrice'},
          ],
          score: 0,
          status: 'WAITING_FOR_PLAYERS',
          stockSize: 0,
          table: {A: [], B: [], C: [], D: [], E: [], X: []},
          timestamp: jasmine.any(String),
          turnNumber: 0,
          turnsLeft: null,
          woundCount: 0,
        },
      ],
      msg: 'M_GamesState',
      timestamp: jasmine.any(String),
    })
    setTimeout(done, 100)
  })
})

test('startGame', done => {
  expect.assertions(1)
  ws1.startGame({gameId})
  ws1.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'START'},
          discardPile: [],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 0,
          players: [
            {
              idx: 0,
              isConnected: true,
              isMe: true,
              hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
              name: 'BOBBY_TABLES',
            },
            {
              hand: [
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), actionability: jasmine.any(String), hints: []},
              ],
              idx: 1,
              isConnected: true,
              isMe: false,
              name: 'Beatrice',
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
      ],
      msg: 'M_GamesState',
      timestamp: jasmine.any(String),
    })
    setTimeout(done, 1000)
  })
})

test('act', async done => {
  const msgs: any[] = []
  ws1.on('msg', msg => {
    msgs.push(msg)
  })

  async function getTurnState(): Promise<game.TMaskedTurnState> {
    while (msgs.length === 0) {
      await new Promise(r => setTimeout(r, 10))
    }
    return msgs.shift().games[0]
  }

  let turn

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

  setTimeout(done, 1000)
})
