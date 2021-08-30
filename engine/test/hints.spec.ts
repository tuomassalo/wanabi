import {createDeck} from './helpers'
import {Game} from '../src/game'

const gameParams = {
  maxHintCount: 8,
  maxWoundCount: 3,
  shufflePlayers: 'SHUFFLE_NONE' as any,
  useRainbow: true,
  useBlack: false,
}

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
  it('should accumulate when discarding', () => {
    const g = createTestGame()
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).hintCount).toEqual(8)
    // use two hints
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 1})
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).hintCount).toEqual(6)
    g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).hintCount).toEqual(8)
  })
  it('should not accumulate over 8, error instead', () => {
    const g = createTestGame()
    expect(() => g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0})).toThrow('CANNOT_DISCARDS_WHEN_MAX_HINTS')
  })
  it('should run out', () => {
    const g = createTestGame()
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 1})
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 1})
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 1})
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 1})
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).hintCount).toEqual(1)
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 1})
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).hintCount).toEqual(0)

    expect(() => g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 1})).toThrow('NO_HINTS_LEFT')
  })
})

describe('An ongoing game', () => {
  it('should have proper state after 2*6 turns, before hinting', () => {
    const g = createTestGame()
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 60 - 2 * 5 - 2 * 6, // === 16
      discardPile: 'B1,A1,B1,C1,A4,B5,X1'.split(','),
      hintCount: 8,
      woundCount: 1, // one wound
      table: {
        A: 'A1,A2,A3,A4'.split(','),
        B: [],
        C: [],
        D: ['D1'],
        E: [],
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
      'A1,C1,B3,D4,X1',
      'B1,B2,B2,D4,X2',
    ])
  })
  it('should show hints for p1', () => {
    const g = createTestGame()
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 5})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).hintCount).toEqual(7)
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand).toEqual([
      {hints: [{turnNumber: 18, is: 5, result: false}]},
      {hints: [{turnNumber: 18, is: 5, result: false}]},
      {hints: [{turnNumber: 18, is: 5, result: false}]},
      {hints: [{turnNumber: 18, is: 5, result: false}]},
      {hints: [{turnNumber: 18, is: 5, result: false}]},
    ])

    // the hints received by p1 are also visible to p0
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).maskedPlayerViews[1].hand).toEqual([
      {color: 'B', num: 1, actionability: 'PLAYABLE', hints: [{turnNumber: 18, is: 5, result: false}]},
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

    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 2})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).hintCount).toEqual(3)

    // now we have enough hints to possibly identify some cards
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).maskedPlayerViews[1].hand).toEqual([
      {
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: true},
          {turnNumber: 22, is: 2, result: false},
        ],
        possibleCards: [
          {value: 'B1', prob: 1 / 9, count: 1, actionability: 'PLAYABLE'},
          {value: 'B3', prob: 1 / 9, count: 1, actionability: 'UNPLAYABLE'},
          {value: 'B4', prob: 2 / 9, count: 2, actionability: 'UNPLAYABLE'},
          {value: 'X1', prob: 1 / 9, count: 1, actionability: 'PLAYABLE'},
          {value: 'X3', prob: 2 / 9, count: 2, actionability: 'UNPLAYABLE'},
          {value: 'X4', prob: 2 / 9, count: 2, actionability: 'UNPLAYABLE'},
        ],
      },
      {
        num: 2,
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: true},
          {turnNumber: 22, is: 2, result: true},
        ],
        possibleCards: [
          {value: 'B2', prob: 1 / 2, count: 2},
          {value: 'X2', prob: 1 / 2, count: 2},
        ],
        actionability: 'UNPLAYABLE',
      },
      {
        num: 2,
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: true},
          {turnNumber: 22, is: 2, result: true},
        ],
        possibleCards: [
          {value: 'B2', prob: 1 / 2, count: 2},
          {value: 'X2', prob: 1 / 2, count: 2},
        ],
        actionability: 'UNPLAYABLE',
      },
      {
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: false},
          {turnNumber: 22, is: 2, result: false},
        ],
      },
      {
        hints: [
          {turnNumber: 18, is: 5, result: false},
          {turnNumber: 20, is: 'B', result: true}, // really an 'X'
          {turnNumber: 22, is: 2, result: true},
        ],
        num: 2,
        possibleCards: [
          {value: 'B2', prob: 1 / 2, count: 2},
          {value: 'X2', prob: 1 / 2, count: 2},
        ],
        actionability: 'UNPLAYABLE',
      },
    ])
  })
})
