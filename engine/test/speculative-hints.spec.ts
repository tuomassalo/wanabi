import {createDeck} from './helpers'
import {Game} from '../src/game'
import {COMPAT_TMaskedOtherPlayerViewState} from '../src/hand'

function createTestGame() {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Simon', 'Schuster'],
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
  return g
}

describe('Speculative hint', () => {
  const g = createTestGame()
  it('should be shown when no hints given', () => {
    // no hints first
    expect(
      (g.COMPAT_getRefinedTurnState(g.players[0].id)
        .maskedPlayerViews[1] as COMPAT_TMaskedOtherPlayerViewState).extraMysticalHand.map(c => c.hints),
    ).toEqual([[], [], [], [], []])

    // speculative hint
    // expect(
    //   (g.COMPAT_getRefinedTurnState(g.players[0].id, {toPlayerIdx: 1, is: 1})
    //     .maskedPlayerViews[1] as COMPAT_TMaskedOtherPlayerViewState).extraMysticalHand.map(c => c.hints),
    // ).toEqual([
    //   [{is: 1, result: true, turnNumber: 999}],
    //   [{is: 1, result: true, turnNumber: 999}],
    //   [{is: 1, result: true, turnNumber: 999}],
    //   [{is: 1, result: false, turnNumber: 999}],
    //   [{is: 1, result: false, turnNumber: 999}],
    // ])
  })
  it('should be shown in addition to other given hints', () => {
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'A'})

    expect(
      (g.COMPAT_getRefinedTurnState(g.players[0].id)
        .maskedPlayerViews[1] as COMPAT_TMaskedOtherPlayerViewState).extraMysticalHand.map(c => c.hints),
    ).toEqual([
      [{is: 'A', result: false, turnNumber: 0}],
      [{is: 'A', result: false, turnNumber: 0}],
      [{is: 'A', result: false, turnNumber: 0}],
      [{is: 'A', result: true, turnNumber: 0}],
      [{is: 'A', result: false, turnNumber: 0}],
    ])

    // speculative hint
    // expect(
    //   (g.COMPAT_getRefinedTurnState(g.players[0].id, {toPlayerIdx: 1, is: 4})
    //     .maskedPlayerViews[1] as COMPAT_TMaskedOtherPlayerViewState).extraMysticalHand.map(c => c.hints),
    // ).toEqual([
    //   [
    //     {is: 'A', result: false, turnNumber: 0},
    //     {is: 4, result: false, turnNumber: 999},
    //   ],
    //   [
    //     {is: 'A', result: false, turnNumber: 0},
    //     {is: 4, result: false, turnNumber: 999},
    //   ],
    //   [
    //     {is: 'A', result: false, turnNumber: 0},
    //     {is: 4, result: false, turnNumber: 999},
    //   ],
    //   [
    //     {is: 'A', result: true, turnNumber: 0},
    //     {is: 4, result: true, turnNumber: 999},
    //   ],
    //   [
    //     {is: 'A', result: false, turnNumber: 0},
    //     {is: 4, result: false, turnNumber: 999},
    //   ],
    // ])
  })
})
