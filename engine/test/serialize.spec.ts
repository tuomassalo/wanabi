import {createTightGame} from './helpers'
import {Game} from '../src/game'
import {MaskedGame} from '../src/masked-game'

describe('A game', () => {
  const g = createTightGame()
  it('should maintain its state after serialization and deserialization', () => {
    // p0 always plays the oldest card from hand, p1 always discards

    // for (let i = 1; i <= 24; i++) {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    // g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    // }
    const state1 = g.getState(g.players[1].id)
    const serialized = JSON.stringify(g)

    expect(serialized.length).toBeLessThan(20000)

    const g2 = new Game({game: JSON.parse(serialized), from: 'SERIALIZED_GAME'})

    expect(g2.getState(g.players[1].id)).toEqual(state1)

    // play one card in both games
    // g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    // g2.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})

    // both games should be in the same state
    // ... ignoring the timestamp
    const states = [g, g2].map(game => {
      const state = g.getState(game.players[1].id)
      state.currentTurn.timestamp = 'BOGUS'
      return state
    })
    expect(states[0]).toEqual(states[1])
  })
})

describe('A masked game', () => {
  it('should be unserializable', () => {
    const mg = new MaskedGame({
      gameId: 'a12c6236c86f49dfece5285ef744de46b5d4d35f',
      currentTurn: {
        status: 'RUNNING',
        action: {type: 'PLAY', cardIdx: 4, card: 'X4', success: true},
        discardPile: [
          'D3',
          'X4',
          'E4',
          'D1',
          'B1',
          'E1',
          'D2',
          'E3',
          'X2',
          'B4',
          'A2',
          'X1',
          'E1',
          'C3',
          'X1',
          'A4',
          'C1',
          'C1',
          'D4',
          'B3',
          'B2',
          'X3',
        ],
        hintCount: 8,
        woundCount: 0,
        table: {
          A: ['A1', 'A2', 'A3', 'A4', 'A5'],
          B: ['B1', 'B2', 'B3', 'B4', 'B5'],
          C: ['C1', 'C2', 'C3', 'C4', 'C5'],
          D: ['D1', 'D2', 'D3', 'D4', 'D5'],
          E: ['E1', 'E2', 'E3', 'E4', 'E5'],
          X: ['X1', 'X2', 'X3', 'X4'],
        },
        turnNumber: 51,
        turnsLeft: 1,
        timestamp: '2020-04-23T19:24:32.469Z',
        stockSize: 0,
        inTurn: 1,
        score: 29,
        maskedPlayerViews: [
          {isMe: true, hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}]},
          {
            isMe: false,
            hand: [
              {color: 'C', num: 2, hints: []},
              {color: 'D', num: 1, hints: []},
              {color: 'A', num: 3, hints: []},
              {color: 'C', num: 4, hints: []},
              {color: 'X', num: 5, hints: []},
            ],
          },
        ],
      },
      playedActions: [
        {action: {type: 'START'}, timestamp: '2020-04-23T19:18:15.316Z'},
        {action: {type: 'PLAY', cardIdx: 0, card: 'D1', success: true}, timestamp: '2020-04-23T19:18:22.043Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'A1', success: true}, timestamp: '2020-04-23T19:19:25.353Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'C1', success: true}, timestamp: '2020-04-23T19:19:27.776Z'},
        {action: {type: 'DISCARD', cardIdx: 2, card: 'D3'}, timestamp: '2020-04-23T19:19:30.336Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'B1', success: true}, timestamp: '2020-04-23T19:19:32.238Z'},
        {action: {type: 'DISCARD', cardIdx: 3, card: 'X4'}, timestamp: '2020-04-23T19:19:38.240Z'},
        {action: {type: 'PLAY', cardIdx: 0, card: 'B2', success: true}, timestamp: '2020-04-23T19:19:40.579Z'},
        {action: {type: 'DISCARD', cardIdx: 3, card: 'E4'}, timestamp: '2020-04-23T19:19:47.350Z'},
        {action: {type: 'PLAY', cardIdx: 4, card: 'B3', success: true}, timestamp: '2020-04-23T19:19:49.369Z'},
        {action: {type: 'PLAY', cardIdx: 4, card: 'E1', success: true}, timestamp: '2020-04-23T19:19:51.045Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'B4', success: true}, timestamp: '2020-04-23T19:19:53.107Z'},
        {action: {type: 'PLAY', cardIdx: 3, card: 'E2', success: true}, timestamp: '2020-04-23T19:19:55.013Z'},
        {action: {type: 'PLAY', cardIdx: 1, card: 'B5', success: true}, timestamp: '2020-04-23T19:19:56.862Z'},
        {action: {type: 'PLAY', cardIdx: 3, card: 'A2', success: true}, timestamp: '2020-04-23T19:20:00.022Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'D2', success: true}, timestamp: '2020-04-23T19:20:05.558Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'D3', success: true}, timestamp: '2020-04-23T19:20:08.253Z'},
        {action: {type: 'DISCARD', cardIdx: 1, card: 'D1'}, timestamp: '2020-04-23T19:20:13.351Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'E3', success: true}, timestamp: '2020-04-23T19:20:15.054Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'E4', success: true}, timestamp: '2020-04-23T19:20:16.767Z'},
        {action: {type: 'PLAY', cardIdx: 4, card: 'X1', success: true}, timestamp: '2020-04-23T19:20:18.417Z'},
        {action: {type: 'DISCARD', cardIdx: 1, card: 'B1'}, timestamp: '2020-04-23T19:20:20.827Z'},
        {action: {type: 'PLAY', cardIdx: 0, card: 'X2', success: true}, timestamp: '2020-04-23T19:20:22.590Z'},
        {action: {type: 'DISCARD', cardIdx: 1, card: 'E1'}, timestamp: '2020-04-23T19:20:25.657Z'},
        {action: {type: 'DISCARD', cardIdx: 1, card: 'D2'}, timestamp: '2020-04-23T19:20:31.817Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'A3', success: true}, timestamp: '2020-04-23T19:20:33.832Z'},
        {action: {type: 'DISCARD', cardIdx: 1, card: 'E3'}, timestamp: '2020-04-23T19:20:36.816Z'},
        {action: {type: 'PLAY', cardIdx: 4, card: 'A4', success: true}, timestamp: '2020-04-23T19:20:38.751Z'},
        {action: {type: 'PLAY', cardIdx: 1, card: 'A5', success: true}, timestamp: '2020-04-23T19:20:41.723Z'},
        {action: {type: 'PLAY', cardIdx: 4, card: 'C2', success: true}, timestamp: '2020-04-23T19:20:45.282Z'},
        {action: {type: 'PLAY', cardIdx: 3, card: 'E5', success: true}, timestamp: '2020-04-23T19:20:47.847Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'C3', success: true}, timestamp: '2020-04-23T19:20:49.210Z'},
        {action: {type: 'DISCARD', cardIdx: 1, card: 'X2'}, timestamp: '2020-04-23T19:20:52.020Z'},
        {action: {type: 'PLAY', cardIdx: 2, card: 'C4', success: true}, timestamp: '2020-04-23T19:20:55.237Z'},
        {action: {type: 'PLAY', cardIdx: 3, card: 'D4', success: true}, timestamp: '2020-04-23T19:20:57.169Z'},
        {action: {type: 'PLAY', cardIdx: 0, card: 'C5', success: true}, timestamp: '2020-04-23T19:20:59.455Z'},
        {action: {type: 'PLAY', cardIdx: 0, card: 'D5', success: true}, timestamp: '2020-04-23T19:21:01.254Z'},
        {action: {type: 'PLAY', cardIdx: 4, card: 'X3', success: true}, timestamp: '2020-04-23T19:21:04.309Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'B4'}, timestamp: '2020-04-23T19:21:07.384Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'A2'}, timestamp: '2020-04-23T19:21:09.385Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'X1'}, timestamp: '2020-04-23T19:21:10.990Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'E1'}, timestamp: '2020-04-23T19:21:12.678Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'C3'}, timestamp: '2020-04-23T19:21:14.109Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'X1'}, timestamp: '2020-04-23T19:21:15.768Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'A4'}, timestamp: '2020-04-23T19:21:17.304Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'C1'}, timestamp: '2020-04-23T19:21:19.043Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'C1'}, timestamp: '2020-04-23T19:21:20.661Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'D4'}, timestamp: '2020-04-23T19:21:23.717Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'B3'}, timestamp: '2020-04-23T19:21:27.105Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'B2'}, timestamp: '2020-04-23T19:21:29.152Z'},
        {action: {type: 'DISCARD', cardIdx: 0, card: 'X3'}, timestamp: '2020-04-23T19:21:50.167Z'},
        {action: {type: 'PLAY', cardIdx: 4, card: 'X4', success: true}, timestamp: '2020-04-23T19:24:32.469Z'},
      ],
      players: [
        {name: 'Tume6', idx: 0, id: 'ck9d5n5x4002uow5g4nnz4uur', isConnected: true},
        {name: 'Chrume6', idx: 1, id: 'REDACTED', isConnected: true},
      ],
      gameParams: {maxHintCount: 8, maxWoundCount: 3, shufflePlayers: 'SHUFFLE_NONE'},
    })
    expect(JSON.parse(JSON.stringify(mg.currentTurn))).toEqual({
      _players: [
        {id: 'ck9d5n5x4002uow5g4nnz4uur', idx: 0, isConnected: true, name: 'Tume6'},
        {id: 'REDACTED', idx: 1, isConnected: true, name: 'Chrume6'},
      ],
      action: {card: 'X4', cardIdx: 4, success: true, type: 'PLAY'},
      discardPile: [
        'D3',
        'X4',
        'E4',
        'D1',
        'B1',
        'E1',
        'D2',
        'E3',
        'X2',
        'B4',
        'A2',
        'X1',
        'E1',
        'C3',
        'X1',
        'A4',
        'C1',
        'C1',
        'D4',
        'B3',
        'B2',
        'X3',
      ],
      hintCount: 8,
      maskedPlayerViews: [
        {
          extraMysticalHand: undefined,
          hand: [
            {
              actionability: 'DISCARDABLE',
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: undefined, count: 2, prob: 0.5, value: 'A1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'B1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'E2'},
              ],
            },
            {
              actionability: 'DISCARDABLE',
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: undefined, count: 2, prob: 0.5, value: 'A1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'B1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'E2'},
              ],
            },
            {
              actionability: 'DISCARDABLE',
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: undefined, count: 2, prob: 0.5, value: 'A1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'B1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'E2'},
              ],
            },
            {
              actionability: 'DISCARDABLE',
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: undefined, count: 2, prob: 0.5, value: 'A1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'B1'},
                {actionability: undefined, count: 1, prob: 0.25, value: 'E2'},
              ],
            },
          ],
          isMe: true,
        },
        {
          extraMysticalHand: [
            {
              actionability: undefined,
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'A3'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C2'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C4'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'D1'},
                {actionability: 'PLAYABLE', count: 1, prob: 0.2, value: 'X5'},
              ],
            },
            {
              actionability: undefined,
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'A3'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C2'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C4'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'D1'},
                {actionability: 'PLAYABLE', count: 1, prob: 0.2, value: 'X5'},
              ],
            },
            {
              actionability: undefined,
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'A3'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C2'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C4'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'D1'},
                {actionability: 'PLAYABLE', count: 1, prob: 0.2, value: 'X5'},
              ],
            },
            {
              actionability: undefined,
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'A3'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C2'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C4'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'D1'},
                {actionability: 'PLAYABLE', count: 1, prob: 0.2, value: 'X5'},
              ],
            },
            {
              actionability: undefined,
              color: undefined,
              hints: [],
              num: undefined,
              possibleCards: [
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'A3'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C2'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'C4'},
                {actionability: 'DISCARDABLE', count: 1, prob: 0.2, value: 'D1'},
                {actionability: 'PLAYABLE', count: 1, prob: 0.2, value: 'X5'},
              ],
            },
          ],
          hand: [
            {actionability: 'DISCARDABLE', color: 'C', hints: [], num: 2, possibleCards: undefined},
            {actionability: 'DISCARDABLE', color: 'D', hints: [], num: 1, possibleCards: undefined},
            {actionability: 'DISCARDABLE', color: 'A', hints: [], num: 3, possibleCards: undefined},
            {actionability: 'DISCARDABLE', color: 'C', hints: [], num: 4, possibleCards: undefined},
            {actionability: 'PLAYABLE', color: 'X', hints: [], num: 5, possibleCards: undefined},
          ],
          isMe: false,
        },
      ],
      status: 'RUNNING',
      stockSize: 0,
      table: {
        A: ['A1', 'A2', 'A3', 'A4', 'A5'],
        B: ['B1', 'B2', 'B3', 'B4', 'B5'],
        C: ['C1', 'C2', 'C3', 'C4', 'C5'],
        D: ['D1', 'D2', 'D3', 'D4', 'D5'],
        E: ['E1', 'E2', 'E3', 'E4', 'E5'],
        X: ['X1', 'X2', 'X3', 'X4'],
      },
      timestamp: '2020-04-23T19:24:32.469Z',
      turnNumber: 51,
      turnsLeft: 1,
      woundCount: 0,
    })
  })
})
