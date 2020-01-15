import {Game} from '../src/game'

import {createDeck, knownCard} from './helpers'

describe('A new empty game', () => {
  let pg, pg2
  it('should look emptyish with only one player', () => {
    pg = Game.createPendingGame('Athos')
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
          completeHandCards: [],
          idx: 0,
          isMe: true,
          mysteryHandCards: [],
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
    pg2 = Game.joinPendingGame(pg, 'Porthos')
    expect(pg2.getState(pg2.players[0].id)).toEqual({
      action: {type: 'START'},
      discardPile: [],
      gameId: jasmine.any(String),
      hintCount: 9,
      inTurn: 0,
      players: [
        {
          completeHandCards: [],
          idx: 0,
          isMe: true,
          mysteryHandCards: [],
          name: 'Athos',
        },
        {
          completeHandCards: [],
          idx: 0,
          isMe: false,
          mysteryHandCards: [],
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
          completeHandCards: [],
          idx: 0,
          isMe: true,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          name: 'Athos',
        },
        {
          completeHandCards: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          idx: 0,
          isMe: false,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
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
