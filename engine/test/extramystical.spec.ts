import {Game} from '../src/game'

import {createDeck} from './helpers'
import {TOtherPlayerHandViewState} from '../src/player'
import {TCardState} from '../src/card'

function newGame(deck: string) {
  return new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Cut', 'Copy', 'Paste'],
    deck: createDeck(deck),
  })
}

function getExtraMysticalHand(g: Game, ofPlayerIdx: number, asSeenByPlayerIdx: number) {
  return ((g.getTurnState(g.players[asSeenByPlayerIdx].id).playerHandViews[
    ofPlayerIdx
  ] as unknown) as TOtherPlayerHandViewState).extraMysticalHand
}

describe('A three-player game', () => {
  const g = newGame(
    // p0 p1 p2
    `  A1 A1 A5
       B1 B1 B1
       C1 C1 C1
       D1 D1 D1
       E1 E1 E1

       X5
    `,
  )
  it('After hinting "5", should show first "any 5"', () => {
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 2, is: 5})
    expect(getExtraMysticalHand(g, 2, 0)).toEqual([
      {
        actionability: 'UNDISCARDABLE',
        hints: [{is: 5, result: true, turnNumber: 0}],
        num: 5,
        possibleCards: [
          {count: 1, prob: 1 / 6, value: 'A5'},
          {count: 1, prob: 1 / 6, value: 'B5'},
          {count: 1, prob: 1 / 6, value: 'C5'},
          {count: 1, prob: 1 / 6, value: 'D5'},
          {count: 1, prob: 1 / 6, value: 'E5'},
          {count: 1, prob: 1 / 6, value: 'X5'},
        ],
      },
      {hints: [{is: 5, result: false, turnNumber: 0}]},
      {hints: [{is: 5, result: false, turnNumber: 0}]},
      {hints: [{is: 5, result: false, turnNumber: 0}]},
      {hints: [{is: 5, result: false, turnNumber: 0}]},
    ])
  })
  it('After hinting "A", should show first "A5/X5"', () => {
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 2, is: 'A'})
    expect(getExtraMysticalHand(g, 2, 0)).toEqual([
      {
        actionability: 'UNDISCARDABLE',
        hints: [
          {is: 5, result: true, turnNumber: 0},
          {is: 'A', result: true, turnNumber: 1},
        ],
        num: 5,
        possibleCards: [
          {count: 1, prob: 1 / 2, value: 'A5'},
          {count: 1, prob: 1 / 2, value: 'X5'},
        ],
      },
      {
        hints: [
          {is: 5, result: false, turnNumber: 0},
          {is: 'A', result: false, turnNumber: 1},
        ],
      },
      {
        hints: [
          {is: 5, result: false, turnNumber: 0},
          {is: 'A', result: false, turnNumber: 1},
        ],
      },
      {
        hints: [
          {is: 5, result: false, turnNumber: 0},
          {is: 'A', result: false, turnNumber: 1},
        ],
      },
      {
        hints: [
          {is: 5, result: false, turnNumber: 0},
          {is: 'A', result: false, turnNumber: 1},
        ],
      },
    ])
  })
  it('After p0 gets X5, p0 and p1 get different results', () => {
    // just a no-op
    g.act(g.players[2].id, {type: 'HINT', toPlayerIdx: 1, is: 3})

    // p0 discards a card, gets X5
    g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0})

    expect(
      (g.getTurnState(g.players[1].id).playerHandViews[0].hand as TCardState[]).map(c => c.color + c.num).join(','),
    ).toEqual('B1,C1,D1,E1,X5')

    // p0 still sees X5 as one option for p2's first card
    expect(getExtraMysticalHand(g, 2, 0)[0].possibleCards).toEqual([
      {count: 1, prob: 1 / 2, value: 'A5'},
      {count: 1, prob: 1 / 2, value: 'X5'},
    ])

    // p1 sees p0's X5, so they know that p2 also sees the X5, thus knowing that p2 knows their 5 is an A5.
    expect(getExtraMysticalHand(g, 2, 1)[0]).toEqual({
      actionability: 'UNDISCARDABLE',
      color: 'A',
      num: 5,
      hints: jasmine.any(Array),
    })
  })
  it('p0 gets hinted of their X5, then sees that p2 knows about their A5', () => {
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 5})
    g.act(g.players[2].id, {type: 'HINT', toPlayerIdx: 0, is: 'A'})

    // Now p0 knows they have A5/X5, and they see p2's A5, so it must be X5.
    expect(g.getTurnState(g.players[0].id).playerHandViews[0].hand[4]).toEqual({
      actionability: 'UNDISCARDABLE',
      color: 'X',
      num: 5,
      hints: jasmine.any(Array),
    })

    // Now p0 knows they have A5/X5, and they see p2's A5, so it must be X5.
    expect(getExtraMysticalHand(g, 2, 0)[0]).toEqual({
      actionability: 'UNDISCARDABLE',
      color: 'A',
      num: 5,
      hints: jasmine.any(Array),
    })
  })
})

describe('Another three-player game', () => {
  const g = newGame(
    // p0 p1 p2
    `  D5 C5 A5
       E5 B1 B1
       C1 C1 C1
       D1 D1 D1
       E1 E1 E1

    `,
  )
  it("p0's D5 and E5 are regarded as known cards even though their positions are unknown", () => {
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 2, is: 5})
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 5})
    g.act(g.players[2].id, {type: 'HINT', toPlayerIdx: 0, is: 'A'})
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 2, is: 5}) // no-op
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 'B'})

    // Now, p0 knows they have D5 and E5, but order is unknown, and
    // p2 knows they have a 5.
    expect(
      g
        .getTurnState(g.players[0].id)
        .playerHandViews[0].hand.slice(0, 2)
        .map(c => c.possibleCards),
    ).toEqual([
      [
        {count: 1, prob: 1 / 2, value: 'D5'},
        {count: 1, prob: 1 / 2, value: 'E5'},
      ],
      [
        {count: 1, prob: 1 / 2, value: 'D5'},
        {count: 1, prob: 1 / 2, value: 'E5'},
      ],
    ])

    expect(getExtraMysticalHand(g, 2, 0)[0]).toEqual({
      actionability: 'UNDISCARDABLE',
      hints: [
        {is: 5, result: true, turnNumber: 0},
        {is: 5, result: true, turnNumber: 3},
      ],
      num: 5,
      possibleCards: [
        {count: 1, prob: 1 / 3, value: 'A5'},
        {count: 1, prob: 1 / 3, value: 'B5'},
        {count: 1, prob: 1 / 3, value: 'X5'},
      ],
    })

    // p1 is unaware of their C5, so they see more options for p2's 5.
    expect(getExtraMysticalHand(g, 2, 1)[0]).toEqual({
      actionability: 'UNDISCARDABLE',
      hints: [
        {is: 5, result: true, turnNumber: 0},
        {is: 5, result: true, turnNumber: 3},
      ],
      num: 5,
      possibleCards: [
        {count: 1, prob: 1 / 4, value: 'A5'},
        {count: 1, prob: 1 / 4, value: 'B5'},
        {count: 1, prob: 1 / 4, value: 'C5'},
        {count: 1, prob: 1 / 4, value: 'X5'},
      ],
    })
  })
})

describe('Third three-player game', () => {
  const g = newGame(
    // p0 p1 p2
    `  D2 A1 C2
       E2 B1 B1
       E2 C1 C1
       D1 D1 D1
       E1 E1 E1

    `,
  )
  it("p0's D2 and E2 are treated as consumed even though their positions are unknown", () => {
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 2, is: 2})
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 2})
    g.act(g.players[2].id, {type: 'HINT', toPlayerIdx: 0, is: 'A'})
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 2, is: 2})
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 'B'})
    g.act(g.players[2].id, {type: 'HINT', toPlayerIdx: 0, is: 'C'})

    // Now, p0 knows they have D2/E2/E2 or D2/D2/E2 in some order.
    expect(
      g
        .getTurnState(g.players[0].id)
        .playerHandViews[0].hand.slice(0, 3)
        .map(c => c.possibleCards),
    ).toEqual([
      [
        {count: 2, prob: 1 / 2, value: 'D2'},
        {count: 2, prob: 1 / 2, value: 'E2'},
      ],
      [
        {count: 2, prob: 1 / 2, value: 'D2'},
        {count: 2, prob: 1 / 2, value: 'E2'},
      ],
      [
        {count: 2, prob: 1 / 2, value: 'D2'},
        {count: 2, prob: 1 / 2, value: 'E2'},
      ],
    ])

    // p0 sees that p2 can have any `2` card, but the odds are lower for D2/E2
    expect(getExtraMysticalHand(g, 2, 0)[0]).toEqual({
      actionability: 'UNPLAYABLE',
      hints: [
        {is: 2, result: true, turnNumber: 0},
        {is: 2, result: true, turnNumber: 3},
      ],
      num: 2,
      possibleCards: [
        {count: 2, prob: 1 / 5, value: 'A2'},
        {count: 2, prob: 1 / 5, value: 'B2'},
        {count: 2, prob: 1 / 5, value: 'C2'},
        {count: 1, prob: 1 / 10, value: 'D2'},
        {count: 1, prob: 1 / 10, value: 'E2'},
        {count: 2, prob: 1 / 5, value: 'X2'},
      ],
    })

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 2, is: 2}) // no-op
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 'D'})

    // now p0 sees that p2's card cannot be E2.
    expect(getExtraMysticalHand(g, 2, 0)[0]).toEqual({
      actionability: 'UNPLAYABLE',
      hints: jasmine.any(Array),
      num: 2,
      possibleCards: [
        {count: 2, prob: 2 / 9, value: 'A2'},
        {count: 2, prob: 2 / 9, value: 'B2'},
        {count: 2, prob: 2 / 9, value: 'C2'},
        {count: 1, prob: 1 / 9, value: 'D2'},
        {count: 2, prob: 2 / 9, value: 'X2'},
      ],
    })
  })
})

describe('A real game ending', () => {
  const g = new Game({
    from: 'SERIALIZED_GAME',
    game: {
      turn0: {
        action: {card: 'A3', cardIdx: 0, success: true, type: 'PLAY'},
        discardPile: [
          'A4',
          'B2',
          'C3',
          'E4',
          'E3',
          'D3',
          'D4',
          'E1',
          'D1',
          'D4',
          'C4',
          'E2',
          'X3',
          'D5',
          'E1',
          'C1',
          'X2',
          'X1',
          'C4',
          'D1',
          'B1',
          'A3',
          'A1',
          'C1',
          'X1',
          'B4',
        ],
        gameId: 'ac7942540dfbef26fc795eb6becb8e1c58cfc96a',
        hintCount: 8,
        completePlayerHands: [
          [
            {
              color: 'A',
              hints: [
                {is: 1, result: false, turnNumber: 17},
                {is: 5, result: true, turnNumber: 19},
                {is: 3, result: false, turnNumber: 29},
                {is: 'C', result: false, turnNumber: 35},
                {is: 'D', result: false, turnNumber: 39},
                {is: 3, result: false, turnNumber: 43},
                {is: 'C', result: false, turnNumber: 55},
                {is: 'E', result: false, turnNumber: 57},
                {is: 'A', result: true, turnNumber: 75},
              ],
              num: 5,
            },
            {color: 'B', hints: [{is: 'A', result: false, turnNumber: 75}], num: 3},
            {color: 'B', hints: [{is: 'A', result: false, turnNumber: 75}], num: 1},
            {color: 'D', hints: [{is: 'A', result: false, turnNumber: 75}], num: 2},
            {color: 'A', hints: [], num: 2},
          ],
          [
            {
              color: 'A',
              hints: [
                {is: 4, result: true, turnNumber: 46},
                {is: 'A', result: true, turnNumber: 48},
                {is: 'E', result: false, turnNumber: 50},
                {is: 1, result: false, turnNumber: 62},
                {is: 5, result: false, turnNumber: 64},
                {is: 'C', result: false, turnNumber: 66},
              ],
              num: 4,
            },
            {color: 'C', hints: [], num: 2},
            {color: 'A', hints: [], num: 1},
            {color: 'X', hints: [], num: 4},
            {color: 'C', hints: [], num: 5},
          ],
        ],
        status: 'RUNNING',
        stock: [],
        table: {
          A: ['A1', 'A2', 'A3'],
          B: ['B1', 'B2', 'B3', 'B4', 'B5'],
          C: ['C1', 'C2', 'C3'],
          D: ['D1', 'D2', 'D3'],
          E: ['E1', 'E2', 'E3', 'E4', 'E5'],
          X: ['X1', 'X2', 'X3', 'X4', 'X5'],
        },
        timestamp: '2020-03-01T20:24:04.318Z',
        turnNumber: 78,
        turnsLeft: 2,
        woundCount: 0,
      },
      players: [
        {
          id: 'IufDncLagi0AbBg=',
          idx: 0,
          isConnected: true,
          name: 'Essi',
        },
        {
          id: 'Iuj_ocSqAi0CEog=',
          idx: 1,
          isConnected: true,
          name: 'Tumeks',
        },
      ],
      playedActions: [],
    },
  } as any)
  it('shows correct extra mystical cards', () => {
    expect(getExtraMysticalHand(g, 1, 0)).toEqual([
      {
        actionability: 'PLAYABLE',
        color: 'A',
        hints: jasmine.any(Array),
        num: 4,
      },
      ...Array(4).fill({
        actionability: 'DISCARDABLE',
        hints: [],
        possibleCards: [
          {count: 1, prob: 1 / 4, value: 'A1'},
          {count: 1, prob: 1 / 4, value: 'C2'},
          {count: 1, prob: 1 / 4, value: 'C5'},
          {count: 1, prob: 1 / 4, value: 'X4'},
        ],
      }),
    ])
    expect(getExtraMysticalHand(g, 0, 1)).toEqual([
      {
        actionability: 'UNDISCARDABLE',
        color: 'A',
        hints: jasmine.any(Array),
        num: 5,
      },
      ...Array(3).fill({
        actionability: 'DISCARDABLE',
        hints: [{is: 'A', result: false, turnNumber: 75}],
        possibleCards: [
          {count: 1, prob: 0.3333333333333333, value: 'B1'},
          {count: 1, prob: 0.3333333333333333, value: 'B3'},
          {count: 1, prob: 0.3333333333333333, value: 'D2'},
        ],
      }),
      {actionability: 'DISCARDABLE', color: 'A', hints: [], num: 2},
    ])
  })
})
