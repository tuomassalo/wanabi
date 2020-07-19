import {createDeck} from './helpers'
import {Game} from '../src/game'
import {COMPAT_TMaskedOtherPlayerViewState} from '../src/hand'
import {MaskedGame} from '../src/masked-game'

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
      (g.COMPAT_getMaskedTurnState(g.players[0].id)
        .maskedPlayerViews[1] as COMPAT_TMaskedOtherPlayerViewState).extraMysticalHand.map(c => c.hints),
    ).toEqual([[], [], [], [], []])

    const maskedGame = new MaskedGame({
      gameId: g.gameId,
      currentTurn: g.currentTurn.getState(g.players[0].id),
      difficultyParams: {maxHintCount: 8, maxWoundCount: 3},
      playedActions: [], // g.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      players: g.players.map(p => ({...p.toJSON(), id: p.id === g.players[0].id ? p.id : 'REDACTED'})),
    })

    expect(JSON.parse(JSON.stringify(maskedGame.currentTurn.getExtraMysticalHandWithSpeculativeHint(1, 1)))).toEqual([
      {
        actionability: 'PLAYABLE',
        hints: [{is: 1, result: true, turnNumber: -1}],
        num: 1,
        possibleCards: [
          {count: 3, prob: 1 / 6, value: 'A1'},
          {count: 3, prob: 1 / 6, value: 'B1'},
          {count: 3, prob: 1 / 6, value: 'C1'},
          {count: 3, prob: 1 / 6, value: 'D1'},
          {count: 3, prob: 1 / 6, value: 'E1'},
          {count: 3, prob: 1 / 6, value: 'X1'},
        ],
      },
      {
        actionability: 'PLAYABLE',
        hints: [{is: 1, result: true, turnNumber: -1}],
        num: 1,
        possibleCards: [
          {count: 3, prob: 1 / 6, value: 'A1'},
          {count: 3, prob: 1 / 6, value: 'B1'},
          {count: 3, prob: 1 / 6, value: 'C1'},
          {count: 3, prob: 1 / 6, value: 'D1'},
          {count: 3, prob: 1 / 6, value: 'E1'},
          {count: 3, prob: 1 / 6, value: 'X1'},
        ],
      },
      {
        actionability: 'PLAYABLE',
        hints: [{is: 1, result: true, turnNumber: -1}],
        num: 1,
        possibleCards: [
          {count: 3, prob: 1 / 6, value: 'A1'},
          {count: 3, prob: 1 / 6, value: 'B1'},
          {count: 3, prob: 1 / 6, value: 'C1'},
          {count: 3, prob: 1 / 6, value: 'D1'},
          {count: 3, prob: 1 / 6, value: 'E1'},
          {count: 3, prob: 1 / 6, value: 'X1'},
        ],
      },
      {hints: [{is: 1, result: false, turnNumber: -1}]},
      {hints: [{is: 1, result: false, turnNumber: -1}]},
    ])
  })
  it('should be shown in addition to other given hints', () => {
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'A'})

    const maskedGame = new MaskedGame({
      gameId: g.gameId,
      currentTurn: g.currentTurn.getState(g.players[0].id),
      playedActions: [], // g.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      players: g.players.map(p => ({...p.toJSON(), id: p.id === g.players[0].id ? p.id : 'REDACTED'})),
      difficultyParams: {maxHintCount: 8, maxWoundCount: 3},
    })

    expect(
      (g.COMPAT_getMaskedTurnState(g.players[0].id)
        .maskedPlayerViews[1] as COMPAT_TMaskedOtherPlayerViewState).extraMysticalHand.map(c => c.hints),
    ).toEqual([
      [{is: 'A', result: false, turnNumber: 0}],
      [{is: 'A', result: false, turnNumber: 0}],
      [{is: 'A', result: false, turnNumber: 0}],
      [{is: 'A', result: true, turnNumber: 0}],
      [{is: 'A', result: false, turnNumber: 0}],
    ])

    expect(JSON.parse(JSON.stringify(maskedGame.currentTurn.getExtraMysticalHandWithSpeculativeHint(1, 1)))).toEqual([
      {
        actionability: 'PLAYABLE',
        hints: [
          {is: 'A', result: false, turnNumber: 0},
          {is: 1, result: true, turnNumber: -1},
        ],
        num: 1,
        possibleCards: [
          {count: 3, prob: 0.25, value: 'B1'},
          {count: 3, prob: 0.25, value: 'C1'},
          {count: 3, prob: 0.25, value: 'D1'},
          {count: 3, prob: 0.25, value: 'E1'},
        ],
      },
      {
        actionability: 'PLAYABLE',
        hints: [
          {is: 'A', result: false, turnNumber: 0},
          {is: 1, result: true, turnNumber: -1},
        ],
        num: 1,
        possibleCards: [
          {count: 3, prob: 0.25, value: 'B1'},
          {count: 3, prob: 0.25, value: 'C1'},
          {count: 3, prob: 0.25, value: 'D1'},
          {count: 3, prob: 0.25, value: 'E1'},
        ],
      },
      {
        actionability: 'PLAYABLE',
        hints: [
          {is: 'A', result: false, turnNumber: 0},
          {is: 1, result: true, turnNumber: -1},
        ],
        num: 1,
        possibleCards: [
          {count: 3, prob: 0.25, value: 'B1'},
          {count: 3, prob: 0.25, value: 'C1'},
          {count: 3, prob: 0.25, value: 'D1'},
          {count: 3, prob: 0.25, value: 'E1'},
        ],
      },
      {
        hints: [
          {is: 'A', result: true, turnNumber: 0},
          {is: 1, result: false, turnNumber: -1},
        ],
        possibleCards: [
          {actionability: 'UNPLAYABLE', count: 2, prob: 1 / 7, value: 'A2'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 1 / 7, value: 'A3'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 1 / 7, value: 'A4'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 14, value: 'A5'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 1 / 7, value: 'X2'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 1 / 7, value: 'X3'},
          {actionability: 'UNPLAYABLE', count: 2, prob: 1 / 7, value: 'X4'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 14, value: 'X5'},
        ],
      },
      {
        hints: [
          {is: 'A', result: false, turnNumber: 0},
          {is: 1, result: false, turnNumber: -1},
        ],
      },
    ])
  })
})
