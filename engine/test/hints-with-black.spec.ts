import {createDeck} from './helpers'
import {Game} from '../src/game'

const gameParams = {
  maxHintCount: 8,
  maxWoundCount: 3,
  shufflePlayers: 'SHUFFLE_NONE' as any,
  useRainbow: true,
  useBlack: true,
}

function createTestGame() {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Thelma', 'Louise'],
    deck: createDeck(
      //  p0 p1 p0 p1 p0 p1 (p0 plays and p1 discards)
      `   A1 B1
          A1 B1
          A2 C1
          A3 K4
          A4 B5
          D1 X1` +
        // hands after 2*6 turns:
        // p0 p1
        `  A1 K5
           K1 B2
           B3 B2
           D4 D4
           X1 X2` +
        // add black cards
        `  K4 K3 K2`,
      gameParams,
    ),
    gameParams,
  })
  // First, the players consume six hints, so that they can discard cards later.
  // (This is workaround for not having to rewrite all tests after implementing
  // `CANNOT_DISCARDS_WHEN_MAX_HINTS`.)

  for (let i = 1; i <= 3; i++) {
    g.act(g.players[0].id, {type: 'HINT', is: 1, toPlayerIdx: 1})
    g.act(g.players[1].id, {type: 'HINT', is: 1, toPlayerIdx: 0})
  }

  // p0 always plays the oldest card from hand, p1 always discards
  for (let i = 1; i <= 6; i++) {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
  }
  return g
}

describe('Hints', () => {
  it('cannot be black', () => {
    const g = createTestGame()
    expect(() => g.act(g.players[0].id, {type: 'HINT', is: 'K' as any, toPlayerIdx: 1})).toThrow(
      'NO_HINTS_OUTSIDE_ABCDE12345',
    )
  })
})

describe('An ongoing game', () => {
  it('should have proper state after 2*6 turns, before hinting', () => {
    const g = createTestGame()
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 7 * 10 - 2 * 5 - 2 * 6, // NB: all seven color are in
      discardPile: 'B1,A1,B1,C1,K4,B5,X1'.split(','),
      hintCount: 8,
      woundCount: 1, // one wound
      table: {
        A: 'A1,A2,A3,A4'.split(','),
        B: [],
        C: [],
        D: ['D1'],
        E: [],
        K: [],
        X: [],
      },
      turnNumber: 18,
      inTurn: 0,
      turnsLeft: null,
      score: 5,
      status: 'RUNNING',
      maskedPlayerViews: jasmine.any(Array),
    })
    expect(g.currentTurn.hands.map(ch => '' + ch.cards.map(hc => hc.color + hc.num))).toEqual([
      'A1,K1,B3,D4,X1',
      'K5,B2,B2,D4,X2',
    ])
  })
  it('should show proper black hints for p1', () => {
    const g = createTestGame()
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 5})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).hintCount).toEqual(7)
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand).toEqual([
      {
        hints: [{is: 5, result: true, turnNumber: 18}],
        num: 5,
        possibleCards: [
          {actionability: 'PLAYABLE', count: 1, prob: 1 / 8, value: 'A5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 8, value: 'C5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 8, value: 'D5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 8, value: 'E5'},
          {actionability: 'PLAYABLE', count: 3, prob: 3 / 8, value: 'K5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 8, value: 'X5'},
        ],
      },
      {hints: [{is: 5, result: false, turnNumber: 18}]},
      {hints: [{is: 5, result: false, turnNumber: 18}]},
      {hints: [{is: 5, result: false, turnNumber: 18}]},
      {hints: [{is: 5, result: false, turnNumber: 18}]},
    ])

    // the hints received by p1 are also visible to p0
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).maskedPlayerViews[1].hand).toEqual([
      {color: 'K', num: 5, actionability: 'PLAYABLE', hints: [{turnNumber: 18, is: 5, result: true}]},
      {color: 'B', num: 2, actionability: 'UNPLAYABLE', hints: [{turnNumber: 18, is: 5, result: false}]},
      {color: 'B', num: 2, actionability: 'UNPLAYABLE', hints: [{turnNumber: 18, is: 5, result: false}]},
      {color: 'D', num: 4, actionability: 'UNPLAYABLE', hints: [{turnNumber: 18, is: 5, result: false}]},
      {color: 'X', num: 2, actionability: 'UNPLAYABLE', hints: [{turnNumber: 18, is: 5, result: false}]},
    ])

    // we are not interested in the results here
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})

    // give another hint
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'B'})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).hintCount).toEqual(5)

    // still not enough hints
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand).toEqual([
      {
        hints: [
          {turnNumber: 18, is: 5, result: true},
          {turnNumber: 20, is: 'B', result: false},
        ],
        num: 5,
        possibleCards: [
          {actionability: 'PLAYABLE', count: 1, prob: 1 / 7, value: 'A5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 7, value: 'C5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 7, value: 'D5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 7, value: 'E5'},
          {actionability: 'PLAYABLE', count: 3, prob: 3 / 7, value: 'K5'},
        ],
      },
      {
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: true},
        ],
        possibleCards: [
          {count: 1, prob: 1 / 13, value: 'B1', actionability: 'PLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'B2', actionability: 'UNPLAYABLE'},
          {count: 1, prob: 1 / 13, value: 'B3', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'B4', actionability: 'UNPLAYABLE'},
          {count: 1, prob: 1 / 13, value: 'X1', actionability: 'PLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X2', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X3', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X4', actionability: 'UNPLAYABLE'},
        ],
      },
      {
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: true},
        ],
        possibleCards: [
          {count: 1, prob: 1 / 13, value: 'B1', actionability: 'PLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'B2', actionability: 'UNPLAYABLE'},
          {count: 1, prob: 1 / 13, value: 'B3', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'B4', actionability: 'UNPLAYABLE'},
          {count: 1, prob: 1 / 13, value: 'X1', actionability: 'PLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X2', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X3', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X4', actionability: 'UNPLAYABLE'},
        ],
      },
      {
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: false},
        ],
      },
      {
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: true}, // NB! Is really 'X', but looks truthy as 'B'
        ],
        possibleCards: [
          {count: 1, prob: 1 / 13, value: 'B1', actionability: 'PLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'B2', actionability: 'UNPLAYABLE'},
          {count: 1, prob: 1 / 13, value: 'B3', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'B4', actionability: 'UNPLAYABLE'},
          {count: 1, prob: 1 / 13, value: 'X1', actionability: 'PLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X2', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X3', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 2 / 13, value: 'X4', actionability: 'UNPLAYABLE'},
        ],
      },
    ])

    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'C'})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).hintCount).toEqual(3)

    // now we have enough hints to possibly identify some cards
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand).toEqual([
      {
        hints: [
          {is: 5, result: true, turnNumber: 18},
          {is: 'B', result: false, turnNumber: 20},
          {is: 'C', result: false, turnNumber: 22},
        ],
        num: 5,
        possibleCards: [
          {actionability: 'PLAYABLE', count: 1, prob: 1 / 6, value: 'A5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 6, value: 'D5'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 6, value: 'E5'},
          {actionability: 'PLAYABLE', count: 3, prob: 1 / 2, value: 'K5'},
        ],
      },
      {
        color: 'B',
        hints: [
          {is: 5, result: false, turnNumber: 18},
          {is: 'B', result: true, turnNumber: 20},
          {is: 'C', result: false, turnNumber: 22},
        ],
        possibleCards: [
          {actionability: 'PLAYABLE', count: 1, prob: 5 / 34, value: 'B1'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 12 / 34, value: 'B2'},
          {actionability: 'UNPLAYABLE', count: 1, prob: 5 / 34, value: 'B3'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 12 / 34, value: 'B4'},
        ],
      },
      {
        color: 'B',
        hints: [
          {is: 5, result: false, turnNumber: 18},
          {is: 'B', result: true, turnNumber: 20},
          {is: 'C', result: false, turnNumber: 22},
        ],
        possibleCards: [
          {actionability: 'PLAYABLE', count: 1, prob: 5 / 34, value: 'B1'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 12 / 34, value: 'B2'},
          {actionability: 'UNPLAYABLE', count: 1, prob: 5 / 34, value: 'B3'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 12 / 34, value: 'B4'},
        ],
      },
      {
        hints: [
          {is: 5, result: false, turnNumber: 18},
          {is: 'B', result: false, turnNumber: 20},
          {is: 'C', result: false, turnNumber: 22},
        ],
      },
      {
        color: 'X',
        hints: [
          {is: 5, result: false, turnNumber: 18},
          {is: 'B', result: true, turnNumber: 20},
          {is: 'C', result: true, turnNumber: 22},
        ],
        possibleCards: [
          {actionability: 'PLAYABLE', count: 1, prob: 1 / 7, value: 'X1'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 2 / 7, value: 'X2'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 2 / 7, value: 'X3'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 2 / 7, value: 'X4'},
        ],
      },
    ])

    // give more hints to make blackness explicit
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 1})

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'A'})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 1})

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'D'})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 1})

    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand[0]).toEqual({
      hints: [
        {is: 5, result: true, turnNumber: 18},
        {is: 'B', result: false, turnNumber: 20},
        {is: 'C', result: false, turnNumber: 22},
        {is: 'A', result: false, turnNumber: 24},
        {is: 'D', result: false, turnNumber: 26},
      ],
      num: 5,
      possibleCards: [
        {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 4, value: 'E5'},
        {actionability: 'PLAYABLE', count: 3, prob: 3 / 4, value: 'K5'},
      ],
    })

    // one final hint, and now we know for certain

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'E'})

    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand[0]).toEqual({
      hints: [
        {is: 5, result: true, turnNumber: 18},
        {is: 'B', result: false, turnNumber: 20},
        {is: 'C', result: false, turnNumber: 22},
        {is: 'A', result: false, turnNumber: 24},
        {is: 'D', result: false, turnNumber: 26},
        {is: 'E', result: false, turnNumber: 28},
      ],
      num: 5,
      color: 'K',
      actionability: 'PLAYABLE',
    })

    // now p1 plays K5
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0})

    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).table).toEqual({
      A: ['A1', 'A2', 'A3', 'A4'],
      B: [],
      C: [],
      D: ['D1'],
      E: [],
      K: ['K5'],
      X: [],
    })

    // now play K4 to K1
    const getHand = (playerIdx: number) => JSON.parse(JSON.stringify(g.currentTurn.hands[playerIdx].cards)).join(',')

    expect(getHand(0)).toEqual('A1,K1,B3,D4,X1')
    expect(getHand(1)).toEqual('X2,K4,K3,K2,A2')

    g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 4})
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 1}) // K4

    g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 4})
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 1}) // K3

    g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 4})
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 1}) // K2

    // check hint count
    expect(g.currentTurn.hintCount).toEqual(6)

    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 1})

    // one hint gained
    expect(g.currentTurn.hintCount).toEqual(7)
  })
})
