import {Game} from '../src/game'

import {createDeck, knownCard} from './helpers'

const gameParams = {
  maxHintCount: 8,
  maxWoundCount: 3,
  shufflePlayers: 'SHUFFLE_NONE' as any,
  useRainbow: true,
  useBlack: false,
}

describe('A perfect two-player game without any hints or discards', () => {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Bonnie', 'Clyde'],
    deck: createDeck(
      ['A', 'B', 'C', 'D', 'E', 'X'].flatMap(c => [1, 2, 3, 4, 5].map(n => c + n)).join(' '),
      gameParams,
    ),
    gameParams,
  })
  it('should have correct setup', () => {
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: {type: 'START'},
      stockSize: 50,
      discardPile: [],
      hintCount: 8,
      woundCount: 0,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      turnNumber: 0,
      inTurn: 0,
      turnsLeft: null,
      score: 0,
      status: 'RUNNING',
      maskedPlayerViews: [
        {
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          isMe: false,
          hand: [
            {color: 'A', num: 2, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'A', num: 4, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'B', num: 1, hints: [], actionability: 'PLAYABLE'},
            {color: 'B', num: 3, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'B', num: 5, hints: [], actionability: 'UNDISCARDABLE'},
          ],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should properly alter state after playing a card', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: {type: 'PLAY', cardIdx: 0, card: 'A1', success: true},
      stockSize: 49,
      discardPile: [],
      hintCount: 8,
      woundCount: 0,
      table: {A: ['A1'], B: [], C: [], D: [], E: [], X: []},
      turnNumber: 1,
      inTurn: 1,
      turnsLeft: null,
      score: 1,
      status: 'RUNNING',
      maskedPlayerViews: [
        {
          isMe: false,
          hand: [
            {color: 'A', num: 3, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'A', num: 5, hints: [], actionability: 'UNDISCARDABLE'},
            {color: 'B', num: 2, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'B', num: 4, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'C', num: 1, hints: [], actionability: 'PLAYABLE'},
          ],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should have proper state before the final action', () => {
    // always play the newest card from hand_
    for (let i = 1; i <= 28; i++) {
      g.act(g.players[i % 2].id, {type: 'PLAY', cardIdx: 0})
    }
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 21,
      discardPile: [],
      hintCount: 8, // NB: has not risen over the maximum
      woundCount: 0,
      table: {
        A: 'A1,A2,A3,A4,A5'.split(','),
        B: 'B1,B2,B3,B4,B5'.split(','),
        C: 'C1,C2,C3,C4,C5'.split(','),
        D: 'D1,D2,D3,D4,D5'.split(','),
        E: 'E1,E2,E3,E4,E5'.split(','),
        X: 'X1,X2,X3,X4'.split(','),
      },
      turnNumber: 29,
      inTurn: 1,
      turnsLeft: null,
      score: 29,
      status: 'RUNNING',
      maskedPlayerViews: [
        {
          isMe: false,
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should finish after the last card has been played', () => {
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0})
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 20,
      discardPile: [],
      hintCount: 8,
      woundCount: 0,
      table: {
        A: 'A1,A2,A3,A4,A5'.split(','),
        B: 'B1,B2,B3,B4,B5'.split(','),
        C: 'C1,C2,C3,C4,C5'.split(','),
        D: 'D1,D2,D3,D4,D5'.split(','),
        E: 'E1,E2,E3,E4,E5'.split(','),
        X: 'X1,X2,X3,X4,X5'.split(','),
      },
      turnNumber: 30,
      inTurn: 0,
      turnsLeft: null,
      score: 30,
      status: 'FINISHED',
      maskedPlayerViews: [
        {
          isMe: false,
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should throw if trying to play a finished game', () => {
    expect(() => g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})).toThrowError('GAME_ENDED')
    // expect(() => g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})).toThrowError(GameError)
  })
})
