import {Game, Turn} from '../src/game'

import {knownCard} from './helpers'

describe('A new empty game', () => {
  let pg: Game, pg2: Game
  it('should look emptyish with only one player', () => {
    pg = Game.createPendingGame('Athos', 'bogus_id_athos')
    expect(pg.getState(pg.players[0].id)).toEqual({
      action: {
        type: 'START',
      },
      discardPile: [],
      gameId: jasmine.any(String),
      hintCount: 9,
      inTurn: 0,
      players: [
        {
          idx: 0,
          isConnected: true,
          isMe: true,
          hand: [],
          name: 'Athos',
        },
      ],
      score: 0,
      status: 'WAITING_FOR_PLAYERS',
      stock: undefined,
      stockSize: 0,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      timestamp: jasmine.any(String),
      turnNumber: 0,
      turnsLeft: null,
      woundCount: 0,
    })
  })
  it('should accept more players', () => {
    pg2 = Game.joinPendingGame(pg, 'Porthos', 'bogus_id_porthos')
    expect(pg2.getState(pg2.players[0].id)).toEqual({
      action: {type: 'START'},
      discardPile: [],
      gameId: jasmine.any(String),
      hintCount: 9,
      inTurn: 0,
      players: [
        {
          hand: [],
          idx: 0,
          isConnected: true,
          isMe: true,
          name: 'Athos',
        },
        {
          hand: [],
          extraMysticalHand: [],
          idx: 1,
          isConnected: true,
          isMe: false,
          name: 'Porthos',
        },
      ],
      score: 0,
      status: 'WAITING_FOR_PLAYERS',
      stock: undefined,
      stockSize: 0,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      timestamp: jasmine.any(String),
      turnNumber: 0,
      turnsLeft: null,
      woundCount: 0,
    })
  })
  it('should start when starting it', () => {
    const g = Game.startPendingGame(pg2)
    expect(g.getState(g.players[0].id)).toEqual({
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
          name: 'Athos',
        },
        {
          extraMysticalHand: jasmine.any(Array),
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          idx: 1,
          isConnected: true,
          isMe: false,
          name: 'Porthos',
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
    })
  })
})
