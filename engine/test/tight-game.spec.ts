import {createTightGame, knownCard} from './helpers'

describe('A tight three-player game', () => {
  const g = createTightGame()
  // console.warn('HAND0', g.getState(g.players[1].id).players[0].hand)
  // console.warn('HAND1', g.getState(g.players[0].id).players[1].hand)
  it('should have proper state after 2*24 turns', () => {
    // p0 always plays the oldest card from hand, p1 always discards
    for (let i = 1; i <= 24; i++) {
      g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
      g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    }
    expect(g.getState(g.players[1].id)).toEqual({
      gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 60 - 2 * 5 - 2 * 24, // === 2
      discardPile: Array(24).fill(knownCard()),
      hintCount: 9,
      woundCount: 0,
      table: {
        A: 'A1,A2,A3,A4,A5'.split(','),
        B: 'B1,B2,B3,B4,B5'.split(','),
        C: 'C1,C2,C3,C4,C5'.split(','),
        D: 'D1,D2,D3,D4,D5'.split(','),
        E: 'E1,E2,E3,E4'.split(','),
        X: [],
      },
      turnNumber: 48,
      inTurn: 0,
      turnsLeft: null,
      score: 24,
      status: 'RUNNING',
      players: [
        {
          name: 'Jekyll',
          idx: 0,
          isConnected: true,
          isMe: false,
          hand: [
            {color: 'E', num: 5, hints: []},
            {color: 'X', num: 1, hints: []},
            {color: 'X', num: 2, hints: []},
            {color: 'X', num: 3, hints: []},
            {color: 'X', num: 4, hints: []},
          ],
        },
        {
          name: 'Hyde',
          idx: 1,
          isConnected: true,
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
        turnsLeft: null,
      }),
    )
  })
  it('should start countdown when the stock is emptied', () => {
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual({
      gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 0,
      discardPile: 'A4,A3,A2,A1,A1,B4,B3,B2,B1,B1,C4,C3,C2,C1,C1,D4,D3,D2,D1,D1,E4,E3,E2,E1,E1'.split(','),
      hintCount: 9,
      woundCount: 0,
      table: {
        A: 'A1,A2,A3,A4,A5'.split(','),
        B: 'B1,B2,B3,B4,B5'.split(','),
        C: 'C1,C2,C3,C4,C5'.split(','),
        D: 'D1,D2,D3,D4,D5'.split(','),
        E: 'E1,E2,E3,E4,E5'.split(','),
        X: [],
      },
      turnNumber: 50,
      inTurn: 0,
      turnsLeft: 2, // === number of players
      score: 25,
      status: 'RUNNING',
      players: [
        {
          hand: [
            {color: 'X', hints: [], num: 1},
            {color: 'X', hints: [], num: 2},
            {color: 'X', hints: [], num: 3},
            {color: 'X', hints: [], num: 4},
            {color: 'X', hints: [], num: 5},
          ],
          idx: 0,
          isConnected: true,
          isMe: false,
          name: 'Jekyll',
        },
        {
          idx: 1,
          isConnected: true,
          isMe: true,
          hand: [
            {
              color: 'X',
              hints: [],
              possibleCards: [
                {value: 'X1', weight: 2},
                {value: 'X2', weight: 1},
                {value: 'X3', weight: 1},
                {value: 'X4', weight: 1},
              ],
            },
            {
              color: 'X',
              hints: [],
              possibleCards: [
                {value: 'X1', weight: 2},
                {value: 'X2', weight: 1},
                {value: 'X3', weight: 1},
                {value: 'X4', weight: 1},
              ],
            },
            {
              color: 'X',
              hints: [],
              possibleCards: [
                {value: 'X1', weight: 2},
                {value: 'X2', weight: 1},
                {value: 'X3', weight: 1},
                {value: 'X4', weight: 1},
              ],
            },
            {
              color: 'X',
              hints: [],
              possibleCards: [
                {value: 'X1', weight: 2},
                {value: 'X2', weight: 1},
                {value: 'X3', weight: 1},
                {value: 'X4', weight: 1},
              ],
            },
            {
              color: 'X',
              hints: [],
              possibleCards: [
                {value: 'X1', weight: 2},
                {value: 'X2', weight: 1},
                {value: 'X3', weight: 1},
                {value: 'X4', weight: 1},
              ],
            },
          ],
          name: 'Hyde',
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
