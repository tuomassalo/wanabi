import {WebSocketClient} from '../src/websocketclient'

let gameId: string
let ws1: WebSocketClient, ws2: WebSocketClient, ws3: WebSocketClient

beforeAll(() => {
  ws1 = new WebSocketClient()
  ws2 = new WebSocketClient()
  ws3 = new WebSocketClient()
})
afterEach(() => {
  ws1.removeAllListeners()
  ws2.removeAllListeners()
  ws3.removeAllListeners()
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

test('getGamesState', done => {
  expect.assertions(1)
  ws2.getGamesState({})
  ws2.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'START'},
          discardPile: [],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 0,
          players: [{hand: [], idx: 0, isConnected: true, isMe: false, name: 'BOBBY_TABLES'}],
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
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
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

test('act', done => {
  let assertionsLeft = 2
  expect.assertions(2)
  ws1.act({gameId, actionParams: {type: 'DISCARD', cardIdx: 2}})
  ws1.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'DISCARD', card: jasmine.any(String), cardIdx: 2},
          discardPile: [jasmine.any(String)],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 1,
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
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
              ],
              idx: 1,
              isConnected: true,
              isMe: false,
              name: 'Beatrice',
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
      ],

      msg: 'M_GamesState',
      timestamp: jasmine.any(String),
    })
    if (!--assertionsLeft) setTimeout(done, 100)
  })
  ws2.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'DISCARD', card: jasmine.any(String), cardIdx: 2},
          discardPile: [jasmine.any(String)],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 1,
          players: [
            {
              hand: [
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
                {num: jasmine.any(Number), color: jasmine.any(String), hints: []},
              ],
              idx: 0,
              isConnected: true,
              isMe: false,
              name: 'BOBBY_TABLES',
            },
            {
              idx: 1,
              isConnected: true,
              isMe: true,
              hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
              name: 'Beatrice',
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
      ],

      msg: 'M_GamesState',
      timestamp: jasmine.any(String),
    })
    if (!--assertionsLeft) setTimeout(done, 100)
  })
})

test('An outsider sees the started game, but cannot see any hands', done => {
  expect.assertions(1)
  ws3.getGamesState({})
  ws3.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'DISCARD', card: jasmine.any(String), cardIdx: 2},
          discardPile: [jasmine.any(String)],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 1,
          players: [
            // NB: no hands are shown
            {hand: [], idx: 0, isConnected: true, isMe: false, name: 'BOBBY_TABLES'},
            {hand: [], idx: 1, isConnected: true, isMe: false, name: 'Beatrice'},
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
      ],
      msg: 'M_GamesState',
      timestamp: jasmine.any(String),
    })
    setTimeout(done, 100)
  })
})
