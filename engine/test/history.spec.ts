import {createDeck} from './helpers'
import {Game} from '../src/game'
import {MaskedTurn} from '../src/turn'

function createTestGame() {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Alpha', 'Omega'],
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
  // turn 1: p0 hints p1
  g.act(g.players[0].id, {type: 'HINT', is: 1, toPlayerIdx: 1})

  // turn 2: p1 plays B1
  g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0})

  // turn 3: p0 discards A1
  g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0})
  return g
}

describe('History', () => {
  it('should show previous turns correctly for p0', () => {
    const g = createTestGame()
    const turns1 = g.getPreviousTurns(g.players[0].id).map(t => new MaskedTurn(t, g.players).getState())

    const turns2 = new Game({game: JSON.parse(JSON.stringify(g)), from: 'SERIALIZED_GAME'})
      .getPreviousTurns(g.players[0].id)
      .map(t => new MaskedTurn(t, g.players).getState())

    for (const turns of [turns1, turns2]) {
      expect(turns[0]).toEqual({
        action: {type: 'START'},
        discardPile: [],
        hintCount: 8,
        inTurn: 0,
        maskedPlayerViews: [
          {hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}], isMe: true},
          {
            extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
            hand: [
              {actionability: 'PLAYABLE', color: 'B', hints: [], num: 1},
              {actionability: 'PLAYABLE', color: 'B', hints: [], num: 1},
              {actionability: 'PLAYABLE', color: 'C', hints: [], num: 1},
              {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 4},
              {actionability: 'UNDISCARDABLE', color: 'B', hints: [], num: 5},
            ],
            isMe: false,
          },
        ],
        score: 0,
        status: 'RUNNING',
        stockSize: 50,
        table: {A: [], B: [], C: [], D: [], E: [], X: []},
        timestamp: jasmine.any(String),
        turnNumber: 0,
        turnsLeft: null,
        woundCount: 0,
      })

      expect(turns[1]).toEqual({
        action: {is: 1, matches: [true, true, true, false, false], toPlayerIdx: 1, toPlayerName: 'Omega', type: 'HINT'},
        discardPile: [],
        hintCount: 7,
        inTurn: 1,
        maskedPlayerViews: [
          {hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}], isMe: true},
          {
            extraMysticalHand: [
              {
                actionability: 'PLAYABLE',
                hints: [{is: 1, result: true, turnNumber: 0}],
                num: 1,
                possibleCards: [
                  {count: 3, prob: 0.16666666666666666, value: 'A1'},
                  {count: 3, prob: 0.16666666666666666, value: 'B1'},
                  {count: 3, prob: 0.16666666666666666, value: 'C1'},
                  {count: 3, prob: 0.16666666666666666, value: 'D1'},
                  {count: 3, prob: 0.16666666666666666, value: 'E1'},
                  {count: 3, prob: 0.16666666666666666, value: 'X1'},
                ],
              },
              {
                actionability: 'PLAYABLE',
                hints: [{is: 1, result: true, turnNumber: 0}],
                num: 1,
                possibleCards: [
                  {count: 3, prob: 0.16666666666666666, value: 'A1'},
                  {count: 3, prob: 0.16666666666666666, value: 'B1'},
                  {count: 3, prob: 0.16666666666666666, value: 'C1'},
                  {count: 3, prob: 0.16666666666666666, value: 'D1'},
                  {count: 3, prob: 0.16666666666666666, value: 'E1'},
                  {count: 3, prob: 0.16666666666666666, value: 'X1'},
                ],
              },
              {
                actionability: 'PLAYABLE',
                hints: [{is: 1, result: true, turnNumber: 0}],
                num: 1,
                possibleCards: [
                  {count: 3, prob: 0.16666666666666666, value: 'A1'},
                  {count: 3, prob: 0.16666666666666666, value: 'B1'},
                  {count: 3, prob: 0.16666666666666666, value: 'C1'},
                  {count: 3, prob: 0.16666666666666666, value: 'D1'},
                  {count: 3, prob: 0.16666666666666666, value: 'E1'},
                  {count: 3, prob: 0.16666666666666666, value: 'X1'},
                ],
              },
              {hints: [{is: 1, result: false, turnNumber: 0}]},
              {hints: [{is: 1, result: false, turnNumber: 0}]},
            ],
            hand: [
              {actionability: 'PLAYABLE', color: 'B', hints: [{is: 1, result: true, turnNumber: 0}], num: 1},
              {actionability: 'PLAYABLE', color: 'B', hints: [{is: 1, result: true, turnNumber: 0}], num: 1},
              {actionability: 'PLAYABLE', color: 'C', hints: [{is: 1, result: true, turnNumber: 0}], num: 1},
              {actionability: 'UNPLAYABLE', color: 'A', hints: [{is: 1, result: false, turnNumber: 0}], num: 4},
              {actionability: 'UNDISCARDABLE', color: 'B', hints: [{is: 1, result: false, turnNumber: 0}], num: 5},
            ],
            isMe: false,
          },
        ],
        score: 0,
        status: 'RUNNING',
        stockSize: 50,
        table: {A: [], B: [], C: [], D: [], E: [], X: []},
        timestamp: jasmine.any(String),
        turnNumber: 1,
        turnsLeft: null,
        woundCount: 0,
      })
      expect(turns[2]).toEqual({
        action: {card: 'B1', cardIdx: 0, success: true, type: 'PLAY'},
        discardPile: [],
        hintCount: 7,
        inTurn: 0,
        maskedPlayerViews: [
          {hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}], isMe: true},
          {
            extraMysticalHand: [
              {
                hints: [{is: 1, result: true, turnNumber: 0}],
                num: 1,
                possibleCards: [
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'A1'},
                  {actionability: 'DISCARDABLE', count: 2, prob: 0.11764705882352941, value: 'B1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'C1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'D1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'E1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'X1'},
                ],
              },
              {
                hints: [{is: 1, result: true, turnNumber: 0}],
                num: 1,
                possibleCards: [
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'A1'},
                  {actionability: 'DISCARDABLE', count: 2, prob: 0.11764705882352941, value: 'B1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'C1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'D1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'E1'},
                  {actionability: 'PLAYABLE', count: 3, prob: 0.17647058823529413, value: 'X1'},
                ],
              },
              {hints: [{is: 1, result: false, turnNumber: 0}]},
              {hints: [{is: 1, result: false, turnNumber: 0}]},
              {hints: []},
            ],
            hand: [
              {actionability: 'DISCARDABLE', color: 'B', hints: [{is: 1, result: true, turnNumber: 0}], num: 1},
              {actionability: 'PLAYABLE', color: 'C', hints: [{is: 1, result: true, turnNumber: 0}], num: 1},
              {actionability: 'UNPLAYABLE', color: 'A', hints: [{is: 1, result: false, turnNumber: 0}], num: 4},
              {actionability: 'UNDISCARDABLE', color: 'B', hints: [{is: 1, result: false, turnNumber: 0}], num: 5},
              {actionability: 'PLAYABLE', color: 'D', hints: [], num: 1},
            ],
            isMe: false,
          },
        ],
        score: 1,
        status: 'RUNNING',
        stockSize: 49,
        table: {A: [], B: ['B1'], C: [], D: [], E: [], X: []},
        timestamp: jasmine.any(String),
        turnNumber: 2,
        turnsLeft: null,
        woundCount: 0,
      })
    }
  })

  it('should show previous turns correctly for p1', () => {
    const g = createTestGame()
    const turns = g.getPreviousTurns(g.players[1].id).map(t => new MaskedTurn(t, g.players).getState())

    expect(turns[0]).toEqual({
      action: {type: 'START'},
      discardPile: [],
      hintCount: 8,
      inTurn: 0,
      maskedPlayerViews: [
        {
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          hand: [
            {actionability: 'PLAYABLE', color: 'A', hints: [], num: 1},
            {actionability: 'PLAYABLE', color: 'A', hints: [], num: 1},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 2},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 3},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 4},
          ],
          isMe: false,
        },
        {hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}], isMe: true},
      ],
      score: 0,
      status: 'RUNNING',
      stockSize: 50,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      timestamp: jasmine.any(String),
      turnNumber: 0,
      turnsLeft: null,
      woundCount: 0,
    })
    expect(turns[1]).toEqual({
      action: {is: 1, matches: [true, true, true, false, false], toPlayerIdx: 1, toPlayerName: 'Omega', type: 'HINT'},
      discardPile: [],
      hintCount: 7,
      inTurn: 1,
      maskedPlayerViews: [
        {
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          hand: [
            {actionability: 'PLAYABLE', color: 'A', hints: [], num: 1},
            {actionability: 'PLAYABLE', color: 'A', hints: [], num: 1},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 2},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 3},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 4},
          ],
          isMe: false,
        },
        {
          hand: [
            {
              actionability: 'PLAYABLE',
              hints: [{is: 1, result: true, turnNumber: 0}],
              num: 1,
              possibleCards: [
                {count: 1, prob: 0.0625, value: 'A1'},
                {count: 3, prob: 0.1875, value: 'B1'},
                {count: 3, prob: 0.1875, value: 'C1'},
                {count: 3, prob: 0.1875, value: 'D1'},
                {count: 3, prob: 0.1875, value: 'E1'},
                {count: 3, prob: 0.1875, value: 'X1'},
              ],
            },
            {
              actionability: 'PLAYABLE',
              hints: [{is: 1, result: true, turnNumber: 0}],
              num: 1,
              possibleCards: [
                {count: 1, prob: 0.0625, value: 'A1'},
                {count: 3, prob: 0.1875, value: 'B1'},
                {count: 3, prob: 0.1875, value: 'C1'},
                {count: 3, prob: 0.1875, value: 'D1'},
                {count: 3, prob: 0.1875, value: 'E1'},
                {count: 3, prob: 0.1875, value: 'X1'},
              ],
            },
            {
              actionability: 'PLAYABLE',
              hints: [{is: 1, result: true, turnNumber: 0}],
              num: 1,
              possibleCards: [
                {count: 1, prob: 0.0625, value: 'A1'},
                {count: 3, prob: 0.1875, value: 'B1'},
                {count: 3, prob: 0.1875, value: 'C1'},
                {count: 3, prob: 0.1875, value: 'D1'},
                {count: 3, prob: 0.1875, value: 'E1'},
                {count: 3, prob: 0.1875, value: 'X1'},
              ],
            },
            {hints: [{is: 1, result: false, turnNumber: 0}]},
            {hints: [{is: 1, result: false, turnNumber: 0}]},
          ],
          isMe: true,
        },
      ],
      score: 0,
      status: 'RUNNING',
      stockSize: 50,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      timestamp: jasmine.any(String),
      turnNumber: 1,
      turnsLeft: null,
      woundCount: 0,
    })
    expect(turns[2]).toEqual({
      action: {card: 'B1', cardIdx: 0, success: true, type: 'PLAY'},
      discardPile: [],
      hintCount: 7,
      inTurn: 0,
      maskedPlayerViews: [
        {
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          hand: [
            {actionability: 'PLAYABLE', color: 'A', hints: [], num: 1},
            {actionability: 'PLAYABLE', color: 'A', hints: [], num: 1},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 2},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 3},
            {actionability: 'UNPLAYABLE', color: 'A', hints: [], num: 4},
          ],
          isMe: false,
        },
        {
          hand: [
            {
              hints: [{is: 1, result: true, turnNumber: 0}],
              num: 1,
              possibleCards: [
                {actionability: 'PLAYABLE', count: 1, prob: 0.06666666666666667, value: 'A1'},
                {actionability: 'DISCARDABLE', count: 2, prob: 0.13333333333333333, value: 'B1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'C1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'D1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'E1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'X1'},
              ],
            },
            {
              hints: [{is: 1, result: true, turnNumber: 0}],
              num: 1,
              possibleCards: [
                {actionability: 'PLAYABLE', count: 1, prob: 0.06666666666666667, value: 'A1'},
                {actionability: 'DISCARDABLE', count: 2, prob: 0.13333333333333333, value: 'B1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'C1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'D1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'E1'},
                {actionability: 'PLAYABLE', count: 3, prob: 0.2, value: 'X1'},
              ],
            },
            {hints: [{is: 1, result: false, turnNumber: 0}]},
            {hints: [{is: 1, result: false, turnNumber: 0}]},
            {hints: []},
          ],
          isMe: true,
        },
      ],
      score: 1,
      status: 'RUNNING',
      stockSize: 49,
      table: {A: [], B: ['B1'], C: [], D: [], E: [], X: []},
      timestamp: jasmine.any(String),
      turnNumber: 2,
      turnsLeft: null,
      woundCount: 0,
    })
  })
})
