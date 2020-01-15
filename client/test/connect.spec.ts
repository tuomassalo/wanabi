// import {WebSocketClient} from '../src/websocketclient'

// import * as WebSocket from 'ws'

import {WebSocketClient} from '../src/websocketclient'

test('connect, createGame', done => {
  expect.assertions(1)
  const ws = new WebSocketClient()
  // NB: needs the closure.
  ws.on('closing', () => done())
  ws.on('msg', msg => {
    expect(msg).toEqual({
      games: [
        {
          action: {type: 'START'},
          discardPile: [],
          gameId: jasmine.any(String),
          hintCount: 9,
          inTurn: 0,
          players: [{completeHandCards: [], idx: 0, isMe: false, mysteryHandCards: [], name: 'Foo'}],
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
    ws.disconnect()
  })
  ws.createGame({firstPlayerName: 'Foo'})
})
