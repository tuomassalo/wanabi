import {createDeck} from './helpers'
import {Game} from '../src/game'

function createTestGame() {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Alice', 'Bob', 'Eve'],
    deck: createDeck(
      // p0 p1 p2
      `  A3 A3 D1
         A1 B1 D1
         A2 B1 D1
         A4 B1 E1
         A4 C1 E1
         A5 C1 E1`,
    ),
  })
  return g
}

describe('When playing color A...', () => {
  const g = createTestGame()
  it('First, A1 should be PLAYABLE, A5 UNDISCARDABLE and others UNPLAYABLE', () => {
    // but first, some hints
    // expect(g.COMPAT_getRefinedTurnState(g.players[0].id).hintCount).toEqual(9)
    // use two hints
    g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0}) // discard first A3
    g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 'A'})
    g.act(g.players[2].id, {type: 'HINT', toPlayerIdx: 0, is: 'B'}) // none

    // now p0 knows that their hand has only A1..A5 cards.
    expect(g.COMPAT_getRefinedTurnState(g.players[0].id).maskedPlayerViews[0].hand).toEqual(
      Array(5).fill({
        color: 'A',
        hints: [
          {is: 'A', result: true, turnNumber: 1},
          {is: 'B', result: false, turnNumber: 2},
        ],
        possibleCards: [
          {count: 3, prob: 171 / 415, value: 'A1', actionability: 'PLAYABLE'},
          {count: 2, prob: 203 / 830, value: 'A2', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 203 / 830, value: 'A4', actionability: 'UNPLAYABLE'},
          {count: 1, prob: 41 / 415, value: 'A5', actionability: 'UNDISCARDABLE'},
        ],
      }),
    )
  })
  it('After discarding both A3 cards, A4 and A5 become DISCARDABLE', () => {
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 2, is: 'B'}) // none
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0}) // discard second A3

    const state = g.COMPAT_getRefinedTurnState(g.players[0].id)

    expect(state.discardPile).toEqual(['A3', 'A3'])

    expect(state.maskedPlayerViews[0].hand).toEqual(
      Array(5).fill({
        color: 'A',
        hints: [
          {is: 'A', result: true, turnNumber: 1},
          {is: 'B', result: false, turnNumber: 2},
        ],
        possibleCards: [
          {count: 3, prob: 171 / 415, value: 'A1', actionability: 'PLAYABLE'},
          {count: 2, prob: 203 / 830, value: 'A2', actionability: 'UNPLAYABLE'},
          {count: 2, prob: 203 / 830, value: 'A4', actionability: 'DISCARDABLE'},
          {count: 1, prob: 41 / 415, value: 'A5', actionability: 'DISCARDABLE'},
        ],
      }),
    )
  })
})
