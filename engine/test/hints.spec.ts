import {createDeck} from './helpers'
import {Game} from '../src/game'

function createTestGame() {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Thelma', 'Louise'],
    deck: createDeck(
      // p0 p1 p0 p1 p0 p1 (p0 plays and p1 discards)
      `  A1 B1 A1 B1 A2 C1
         A3 A4 A4 B5 D1 X1` +
        // hands after 2*6 turns:
        // p0 p1
        `  A1 B1
           C1 B2
           B3 B2
           D4 D4
           X1 X2`,
    ),
  })
  // p0 always plays the oldest card from hand, p1 always discards
  for (let i = 1; i <= 6; i++) {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
  }
  return g
}

describe('An ongoing game', () => {
  it('should have proper state after 2*6 turns, before hinting', () => {
    const g = createTestGame()
    expect(g.getState(g.players[1].id)).toEqual({
      gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 60 - 2 * 5 - 2 * 6, // === 16
      discardPile: 'B1,A1,B1,C1,A4,B5,X1'.split(','),
      hintCount: 9,
      woundCount: 1, // one wound
      table: {
        A: 'A1,A2,A3,A4'.split(','),
        B: [],
        C: [],
        D: ['D1'],
        E: [],
        X: [],
      },
      turnNumber: 2 * 6,
      inTurn: 0,
      turnsLeft: null,
      score: 5,
      status: 'RUNNING',
      players: jasmine.any(Array),
    })
    expect(g.players.map(p => '' + p.hand.cards.map(hc => hc.color + hc.num))).toEqual([
      'A1,C1,B3,D4,X1',
      'B1,B2,B2,D4,X2',
    ])
  })
  it('should show hints for p1', () => {
    const g = createTestGame()
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 5})
    expect(g.getState(g.players[1].id).hintCount).toEqual(8)
    expect(g.getState(g.players[1].id).players[1].mysteryHandCards).toEqual([
      {hints: [{turnNumber: 12, is: 5, result: false}]},
      {hints: [{turnNumber: 12, is: 5, result: false}]},
      {hints: [{turnNumber: 12, is: 5, result: false}]},
      {hints: [{turnNumber: 12, is: 5, result: false}]},
      {hints: [{turnNumber: 12, is: 5, result: false}]},
    ])
    // we are not interested in the results here
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})

    // give another hint
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'B'})
    expect(g.getState(g.players[1].id).hintCount).toEqual(6)

    // still not enough hints
    expect(g.getState(g.players[1].id).players[1].mysteryHandCards).toEqual([
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: true},
        ],
      },
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: true},
        ],
      },
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: true},
        ],
      },
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: false},
        ],
      },
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: false},
        ],
      },
    ])

    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 2})
    expect(g.getState(g.players[1].id).hintCount).toEqual(4)

    // now we have enough hints to possibly identify some cards
    expect(g.getState(g.players[1].id).players[1].mysteryHandCards).toEqual([
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: true},
          {turnNumber: 16, is: 2, result: false},
        ],
      },
      {
        num: 2,
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: true},
          {turnNumber: 16, is: 2, result: true},
        ],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'X2', weight: 1},
        ],
      },
      {
        num: 2,
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: true},
          {turnNumber: 16, is: 2, result: true},
        ],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'X2', weight: 1},
        ],
      },
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: false},
          {turnNumber: 16, is: 2, result: false},
        ],
      },
      {
        hints: [
          {turnNumber: 12, is: 5, result: false},
          {turnNumber: 14, is: 'B', result: false},
          {turnNumber: 16, is: 2, result: true},
        ],
        num: 2,
        possibleCards: [
          {value: 'A2', weight: 1},
          {value: 'C2', weight: 2},
          {value: 'D2', weight: 2},
          {value: 'E2', weight: 2},
        ],
      },
    ])
  })
})
