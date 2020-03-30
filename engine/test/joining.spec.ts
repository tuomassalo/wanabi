import {Game, Turn} from '../src/game'

import {knownCard} from './helpers'

describe('A new empty game', () => {
  let pg: Game, pg2: Game
  it('should look emptyish with only one player', () => {
    pg = Game.createPendingGame('Athos', 'bogus_id_athos')
    expect(pg.getTurnState(pg.players[0].id)).toEqual({
      action: {
        type: 'START',
      },
      discardPile: [],
      hintCount: 9,
      inTurn: 0,
      playerHandViews: [
        {
          isMe: true,
          hand: [],
        },
      ],
      score: 0,
      status: 'WAITING_FOR_PLAYERS',
      stockSize: 60,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      timestamp: jasmine.any(String),
      turnNumber: 0,
      turnsLeft: null,
      woundCount: 0,
    })
  })
  it('should accept more players', () => {
    pg2 = Game.joinPendingGame(pg, 'Porthos', 'bogus_id_porthos')
    expect(pg2.getTurnState(pg2.players[0].id)).toEqual({
      action: {type: 'START'},
      discardPile: [],
      hintCount: 9,
      inTurn: 0,
      playerHandViews: [
        {
          hand: [],
          isMe: true,
        },
        {
          hand: [],
          extraMysticalHand: [],
          isMe: false,
        },
      ],
      score: 0,
      status: 'WAITING_FOR_PLAYERS',
      stockSize: 60,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      timestamp: jasmine.any(String),
      turnNumber: 0,
      turnsLeft: null,
      woundCount: 0,
    })
  })
  it('should start when starting it', () => {
    const g = Game.startPendingGame(pg2)
    expect(g.getTurnState(g.players[0].id)).toEqual({
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
          extraMysticalHand: jasmine.any(Array),
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
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
    })
  })
})
