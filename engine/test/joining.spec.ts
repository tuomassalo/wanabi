import {Game} from '../src/game'

import {knownCard} from './helpers'
import {range} from 'lodash'

describe('A new empty game', () => {
  let pg: Game, pg2: Game
  it('should look emptyish with only one player', () => {
    pg = Game.createPendingGame({firstPlayerName: 'Athos'}, 'bogus_id_athos')
    expect(pg.COMPAT_getMaskedTurnState(pg.players[0].id)).toEqual({
      action: {
        type: 'START',
      },
      discardPile: [],
      hintCount: 8,
      inTurn: 0,
      maskedPlayerViews: [
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
    expect(pg2.COMPAT_getMaskedTurnState(pg2.players[0].id)).toEqual({
      action: {type: 'START'},
      discardPile: [],
      hintCount: 8,
      inTurn: 0,
      maskedPlayerViews: [
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
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id)).toEqual({
      action: {type: 'START'},
      discardPile: [],
      hintCount: 8,
      inTurn: 0,
      maskedPlayerViews: [
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

describe('A randomized game', () => {
  it('should look random', () => {
    const playerNameOrders = range(0, 100).map(() => {
      const pg = Game.createPendingGame({firstPlayerName: 'First'}, 'bogus_id_first')
      const pg2 = Game.joinPendingGame(pg, 'Second', 'bogus_id_second')
      const pg3 = Game.setPendingGameParams(pg2, {
        maxHintCount: 8,
        maxWoundCount: 3,
        shufflePlayers: 'SHUFFLE_RANDOMIZE',
      })
      const g = Game.startPendingGame(pg3)
      return g.players.map(p => p.name).join(',')
    })

    expect(playerNameOrders.filter(o => o === 'First,Second').length).toBeGreaterThan(0)
    expect(playerNameOrders.filter(o => o === 'Second,First').length).toBeGreaterThan(0)
  })
})
describe('An anonymized game', () => {
  it('should look anonymized', () => {
    const pg = Game.createPendingGame({firstPlayerName: 'First'}, 'bogus_id_first')
    const pg2 = Game.joinPendingGame(pg, 'Second', 'bogus_id_second')
    const pg3 = Game.setPendingGameParams(pg2, {
      maxHintCount: 8,
      maxWoundCount: 3,
      shufflePlayers: 'SHUFFLE_RANDOMIZE_AND_ANONYMIZE',
    })
    const g = Game.startPendingGame(pg3)
    expect(g.players.map(p => p.name)).toEqual(['Player 1', 'Player 2'])
  })
})
