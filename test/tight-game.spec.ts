import {c, createTightGame, knownCard, cards} from './helpers'

describe('A tight three-player game', () => {
  const g = createTightGame()
  it('should have proper state after 2*24 turns', () => {
    // p0 always plays the oldest card from hand, p1 always discards
    for (let i = 1; i <= 24; i++) {
      g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
      g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    }
    expect(g.getState(g.players[1].id)).toEqual({
      stockSize: 60 - 2 * 5 - 2 * 24, // === 2
      discardPile: Array(24).fill(knownCard()),
      hintCount: 9,
      woundCount: 0,
      table: {
        A: [c.A1, c.A2, c.A3, c.A4, c.A5],
        B: [c.B1, c.B2, c.B3, c.B4, c.B5],
        C: [c.C1, c.C2, c.C3, c.C4, c.C5],
        D: [c.D1, c.D2, c.D3, c.D4, c.D5],
        E: [c.E1, c.E2, c.E3, c.E4],
        X: [],
      },
      turn: 48,
      inTurn: 0,
      turnsLeft: Infinity,
      score: 24,
      status: 'RUNNING',
      players: [
        {
          name: 'Jekyll',
          idx: 0,
          isMe: false,
          hand: cards('E5,X1,X2,X3,X4'),
        },
        {
          name: 'Hyde',
          idx: 1,
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should not start countdown before the stock is emptied', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual(
      jasmine.objectContaining({
        stockSize: 1,
        turnsLeft: Infinity,
      }),
    )
  })
  it('should start countdown when the stock is emptied', () => {
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual({
      stockSize: 0,
      discardPile: Array(25).fill(knownCard()),
      hintCount: 9,
      woundCount: 0,
      table: {
        A: [c.A1, c.A2, c.A3, c.A4, c.A5],
        B: [c.B1, c.B2, c.B3, c.B4, c.B5],
        C: [c.C1, c.C2, c.C3, c.C4, c.C5],
        D: [c.D1, c.D2, c.D3, c.D4, c.D5],
        E: [c.E1, c.E2, c.E3, c.E4, c.E5],
        X: [],
      },
      turn: 50,
      inTurn: 0,
      turnsLeft: 2, // === number of players
      score: 25,
      status: 'RUNNING',
      players: [
        {
          name: 'Jekyll',
          idx: 0,
          isMe: false,
          hand: cards('X1,X2,X3,X4,X5'),
        },
        {
          name: 'Hyde',
          idx: 1,
          isMe: true,
          hand: [
            {
              hints: [],
              possibleCards: [
                {color: 'X', num: 1, weight: 3},
                {color: 'X', num: 2, weight: 2},
                {color: 'X', num: 3, weight: 2},
                {color: 'X', num: 4, weight: 2},
                {color: 'X', num: 5, weight: 1},
              ],
            },
            {
              hints: [],
              possibleCards: [
                {color: 'X', num: 1, weight: 3},
                {color: 'X', num: 2, weight: 2},
                {color: 'X', num: 3, weight: 2},
                {color: 'X', num: 4, weight: 2},
                {color: 'X', num: 5, weight: 1},
              ],
            },
            {
              hints: [],
              possibleCards: [
                {color: 'X', num: 1, weight: 3},
                {color: 'X', num: 2, weight: 2},
                {color: 'X', num: 3, weight: 2},
                {color: 'X', num: 4, weight: 2},
                {color: 'X', num: 5, weight: 1},
              ],
            },
            {
              hints: [],
              possibleCards: [
                {color: 'X', num: 1, weight: 3},
                {color: 'X', num: 2, weight: 2},
                {color: 'X', num: 3, weight: 2},
                {color: 'X', num: 4, weight: 2},
                {color: 'X', num: 5, weight: 1},
              ],
            },
            {
              hints: [],
              possibleCards: [
                {color: 'X', num: 1, weight: 3},
                {color: 'X', num: 2, weight: 2},
                {color: 'X', num: 3, weight: 2},
                {color: 'X', num: 4, weight: 2},
                {color: 'X', num: 5, weight: 1},
              ],
            },
          ],
        },
      ],
    })
  })
  it('should change to FINISHED when out of turns', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual(
      jasmine.objectContaining({
        stockSize: 0,
        turnsLeft: 1,
        status: 'RUNNING',
      }),
    )
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual(
      jasmine.objectContaining({
        stockSize: 0,
        turnsLeft: 0,
        status: 'FINISHED',
      }),
    )
  })
})
