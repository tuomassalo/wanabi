import {WebSocketClient} from '../src/websocketclient'

let gameId: string
let ws1: WebSocketClient, ws2: WebSocketClient

beforeAll(() => {
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
          players: [{completeHandCards: [], idx: 0, isMe: true, mysteryHandCards: [], name: 'BOBBY_TABLES'}],
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
          players: [{completeHandCards: [], idx: 0, isMe: false, mysteryHandCards: [], name: 'BOBBY_TABLES'}],
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
            {completeHandCards: [], idx: 0, isMe: false, mysteryHandCards: [], name: 'BOBBY_TABLES'},
            {completeHandCards: [], idx: 0, isMe: true, mysteryHandCards: [], name: 'Beatrice'},
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
    })
    setTimeout(done, 100)
  })
})

// test('startGame', done => {
//   expect.assertions(1)
//   ws1.startGame({gameId})
//   ws1.on('msg', msg => {
//     expect(msg).toEqual({
//       games: [
//         {
//           action: {type: 'START'},
//           discardPile: [],
//           gameId: jasmine.any(String),
//           hintCount: 9,
//           inTurn: 0,
//           players: [
//             {completeHandCards: [], idx: 0, isMe: false, mysteryHandCards: [], name: 'BOBBY_TABLES'},
//             {completeHandCards: [], idx: 0, isMe: false, mysteryHandCards: [], name: 'Beatrice'},
//           ],
//           score: 0,
//           status: 'RUNNING',
//           stockSize: 50,
//           table: {A: [], B: [], C: [], D: [], E: [], X: []},
//           timestamp: jasmine.any(String),
//           turnNumber: 0,
//           turnsLeft: null,
//           woundCount: 0,
//         },
//       ],
//       msg: 'M_GamesState',
//     })
//     setTimeout(done, 100)
//   })
// })
