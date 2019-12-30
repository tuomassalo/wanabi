import {c, knownCard, createDeck} from './helpers'
import {Game} from '../src/game'

function createTestGame() {
  const g = new Game(['Thelma', 'Louise'], {
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
      stockSize: 60 - 2 * 5 - 2 * 6, // === 16
      discardPile: [c.B1, c.A1, c.B1, c.C1, c.A4, c.B5, c.X1],
      hintCount: 9,
      woundCount: 1, // one wound
      table: {
        A: [c.A1, c.A2, c.A3, c.A4],
        B: [],
        C: [],
        D: [c.D1],
        E: [],
        X: [],
      },
      turn: 2 * 6,
      inTurn: 0,
      turnsLeft: Infinity,
      score: 5,
      status: 'RUNNING',
      players: jasmine.any(Array),
    })
    expect(g.players.map(p => '' + p.hand.cards)).toEqual(['A1,C1,B3,D4,X1', 'B1,B2,B2,D4,X2'])
  })
  it('should show hints for p1', () => {
    const g = createTestGame()
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 5})
    expect(g.getState(g.players[1].id).hintCount).toEqual(8)
    expect(g.getState(g.players[1].id).players[1].hand).toEqual([
      {hints: [{turn: 12, is: 5, result: false}]},
      {hints: [{turn: 12, is: 5, result: false}]},
      {hints: [{turn: 12, is: 5, result: false}]},
      {hints: [{turn: 12, is: 5, result: false}]},
      {hints: [{turn: 12, is: 5, result: false}]},
    ])
    // we are not interested in the results here
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})

    // give another hint
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'B'})
    expect(g.getState(g.players[1].id).hintCount).toEqual(6)

    // still not enough hints
    expect(g.getState(g.players[1].id).players[1].hand).toEqual([
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: true},
        ],
      },
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: true},
        ],
      },
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: true},
        ],
      },
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: false},
        ],
      },
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: false},
        ],
      },
    ])

    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 2})
    expect(g.getState(g.players[1].id).hintCount).toEqual(4)

    // now we have enough hints to possibly identify some cards
    expect(g.getState(g.players[1].id).players[1].hand).toEqual([
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: true},
          {turn: 16, is: 2, result: false},
        ],
      },
      {
        num: 2,
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: true},
          {turn: 16, is: 2, result: true},
        ],
        possibleCards: [
          {color: 'B', num: 2, weight: 2},
          {color: 'X', num: 2, weight: 2},
        ],
      },
      {
        num: 2,
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: true},
          {turn: 16, is: 2, result: true},
        ],
        possibleCards: [
          {color: 'B', num: 2, weight: 2},
          {color: 'X', num: 2, weight: 2},
        ],
      },
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: false},
          {turn: 16, is: 2, result: false},
        ],
      },
      {
        hints: [
          {turn: 12, is: 5, result: false},
          {turn: 14, is: 'B', result: false},
          {turn: 16, is: 2, result: true},
        ],
        num: 2,
        possibleCards: [
          {color: 'A', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 2},
          {color: 'D', num: 2, weight: 2},
          {color: 'E', num: 2, weight: 2},
        ],
      },
    ])
  })
})
