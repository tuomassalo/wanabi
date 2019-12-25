import {c, knownCard, createDeck} from './helpers'
import {Game} from '../src/game'

describe('An ongoing game', () => {
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
  it('should have proper state after 2*6 turns, before hinting', () => {
    // p0 always plays the oldest card from hand, p1 always discards
    for (let i = 1; i <= 6; i++) {
      g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
      g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    }
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
      inTurn: 0,
      turnsLeft: Infinity,
      score: 5,
      status: 'RUNNING',
      players: [
        {
          name: 'Thelma',
          idx: 0,
          isMe: false,
          hand: [c.A1, c.C1, c.B3, c.D4, c.X1],
        },
        {
          name: 'Louise',
          idx: 1,
          isMe: true,
          hand: [{}, {}, {}, {}, {}],
        },
      ],
    })
  })
})
