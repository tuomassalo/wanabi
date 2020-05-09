import {createTightGame} from './helpers'
import {TColor, TNum} from '../src/card'

describe('A tight three-player game', () => {
  const g = createTightGame()
  it('should have proper state after 2*24 turns', () => {
    // p0 always plays the oldest card from hand, p1 always discards
    for (let i = 1; i <= 24; i++) {
      g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
      g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    }

    const possibleCards = [
      {count: 1, prob: 1 / 12, value: 'E1', actionability: 'DISCARDABLE'},
      {count: 1, prob: 1 / 12, value: 'E5', actionability: 'PLAYABLE'},
      {count: 3, prob: 1 / 4, value: 'X1', actionability: 'PLAYABLE'},
      {count: 2, prob: 1 / 6, value: 'X2', actionability: 'UNPLAYABLE'},
      {count: 2, prob: 1 / 6, value: 'X3', actionability: 'UNPLAYABLE'},
      {count: 2, prob: 1 / 6, value: 'X4', actionability: 'UNPLAYABLE'},
      {count: 1, prob: 1 / 12, value: 'X5', actionability: 'UNDISCARDABLE'},
    ]

    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual({
      action: {card: 'E1', cardIdx: 0, type: 'DISCARD'},
      discardPile: `
          A4 A3 A2 A1 A1
          B4 B3 B2 B1 B1
          C4 C3 C2 C1 C1
          D4 D3 D2 D1 D1
          E4 E3 E2 E1
        `
        .trim()
        .split(/\s+/),
      // gameId: jasmine.any(String),
      hintCount: 8,
      inTurn: 0,
      maskedPlayerViews: [
        {
          extraMysticalHand: [
            {hints: [], possibleCards},
            {hints: [], possibleCards},
            {hints: [], possibleCards},
            {hints: [], possibleCards},
            {hints: [], possibleCards},
          ],
          hand: [
            {color: 'E', hints: [], num: 5, actionability: 'PLAYABLE'},
            {color: 'X', hints: [], num: 1, actionability: 'PLAYABLE'},
            {color: 'X', hints: [], num: 2, actionability: 'UNPLAYABLE'},
            {color: 'X', hints: [], num: 3, actionability: 'UNPLAYABLE'},
            {color: 'X', hints: [], num: 4, actionability: 'UNPLAYABLE'},
          ],
          isMe: false,
        },
        {
          hand: Array(5).fill({
            hints: [],
            possibleCards: [
              {count: 1, prob: 21 / 155, value: 'E1', actionability: 'DISCARDABLE'},
              {count: 2, prob: 10 / 31, value: 'X1', actionability: 'PLAYABLE'},
              {count: 1, prob: 21 / 155, value: 'X2', actionability: 'UNPLAYABLE'},
              {count: 1, prob: 21 / 155, value: 'X3', actionability: 'UNPLAYABLE'},
              {count: 1, prob: 21 / 155, value: 'X4', actionability: 'UNPLAYABLE'},
              {count: 1, prob: 21 / 155, value: 'X5', actionability: 'UNDISCARDABLE'},
            ],
          }),
          isMe: true,
        },
      ],
      score: 24,
      status: 'RUNNING',
      stockSize: 2,
      table: {
        A: ['A1', 'A2', 'A3', 'A4', 'A5'],
        B: ['B1', 'B2', 'B3', 'B4', 'B5'],
        C: ['C1', 'C2', 'C3', 'C4', 'C5'],
        D: ['D1', 'D2', 'D3', 'D4', 'D5'],
        E: ['E1', 'E2', 'E3', 'E4'],
        X: [],
      },
      timestamp: jasmine.any(String),
      turnNumber: 48,
      turnsLeft: null,
      woundCount: 0,
    })
  })
  it('should not start countdown before the stock is emptied', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual(
      jasmine.objectContaining({
        stockSize: 1,
        turnsLeft: null,
      }),
    )
  })
  it('should start countdown when the stock is emptied', () => {
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})

    const possibleCards = [
      {count: 1, prob: 1 / 5, value: 'X1', actionability: 'PLAYABLE'},
      {count: 1, prob: 1 / 5, value: 'X2', actionability: 'UNPLAYABLE'},
      {count: 1, prob: 1 / 5, value: 'X3', actionability: 'UNPLAYABLE'},
      {count: 1, prob: 1 / 5, value: 'X4', actionability: 'UNPLAYABLE'},
      {count: 1, prob: 1 / 5, value: 'X5', actionability: 'UNDISCARDABLE'},
    ]

    // p0 has X1..X5
    expect(
      g
        .COMPAT_getMaskedTurnState(g.players[1].id)
        .maskedPlayerViews[0].hand.map(c => (c.color as TColor) + (c.num as TNum))
        .join(','),
    ).toEqual('X1,X2,X3,X4,X5')

    // p1 has X4,X3,X2,X1,X1
    expect(
      g
        .COMPAT_getMaskedTurnState(g.players[0].id)
        .maskedPlayerViews[1].hand.map(c => (c.color as TColor) + (c.num as TNum))
        .join(','),
    ).toEqual('X4,X3,X2,X1,X1')

    // The stock is empty, so p0 knows their hand but not positions
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).maskedPlayerViews[0].hand.map(c => c.possibleCards)).toEqual(
      Array(5).fill([
        {actionability: 'PLAYABLE', count: 1, prob: 0.2, value: 'X1'},
        {actionability: 'UNPLAYABLE', count: 1, prob: 0.2, value: 'X2'},
        {actionability: 'UNPLAYABLE', count: 1, prob: 0.2, value: 'X3'},
        {actionability: 'UNPLAYABLE', count: 1, prob: 0.2, value: 'X4'},
        {actionability: 'UNDISCARDABLE', count: 1, prob: 0.2, value: 'X5'},
      ]),
    )

    // So does p1
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand.map(c => c.possibleCards)).toEqual(
      Array(5).fill([
        {actionability: 'PLAYABLE', count: 2, prob: 0.4, value: 'X1'},
        {actionability: 'UNPLAYABLE', count: 1, prob: 0.2, value: 'X2'},
        {actionability: 'UNPLAYABLE', count: 1, prob: 0.2, value: 'X3'},
        {actionability: 'UNPLAYABLE', count: 1, prob: 0.2, value: 'X4'},
      ]),
    )

    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: {card: 'E1', cardIdx: 0, type: 'DISCARD'},
      stockSize: 0,
      discardPile: `
          A4 A3 A2 A1 A1
          B4 B3 B2 B1 B1
          C4 C3 C2 C1 C1
          D4 D3 D2 D1 D1
          E4 E3 E2 E1 E1
        `
        .trim()
        .split(/\s+/),
      hintCount: 8,
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
      maskedPlayerViews: [
        {
          extraMysticalHand: [
            {hints: [], color: 'X', possibleCards},
            {hints: [], color: 'X', possibleCards},
            {hints: [], color: 'X', possibleCards},
            {hints: [], color: 'X', possibleCards},
            {hints: [], color: 'X', possibleCards},
          ],
          hand: [
            {color: 'X', hints: [], num: 1, actionability: 'PLAYABLE'},
            {color: 'X', hints: [], num: 2, actionability: 'UNPLAYABLE'},
            {color: 'X', hints: [], num: 3, actionability: 'UNPLAYABLE'},
            {color: 'X', hints: [], num: 4, actionability: 'UNPLAYABLE'},
            {color: 'X', hints: [], num: 5, actionability: 'UNDISCARDABLE'},
          ],
          isMe: false,
        },
        {
          isMe: true,
          hand: Array(5).fill({
            color: 'X',
            hints: [],
            possibleCards: [
              {value: 'X1', prob: 2 / 5, count: 2, actionability: 'PLAYABLE'},
              {value: 'X2', prob: 1 / 5, count: 1, actionability: 'UNPLAYABLE'},
              {value: 'X3', prob: 1 / 5, count: 1, actionability: 'UNPLAYABLE'},
              {value: 'X4', prob: 1 / 5, count: 1, actionability: 'UNPLAYABLE'},
            ],
          }),
        },
      ],
    })
  })
  it('should change to FINISHED when out of turns', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual(
      jasmine.objectContaining({
        turnNumber: 51,
        stockSize: 0,
        turnsLeft: 1,
        status: 'RUNNING',
      }),
    )
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual(
      jasmine.objectContaining({
        turnNumber: 52,
        stockSize: 0,
        turnsLeft: 0,
        status: 'FINISHED',
      }),
    )
  })
})
