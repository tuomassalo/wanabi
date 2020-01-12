import {Game} from '../src/game/game'

import {createDeck, knownCard} from './helpers'

describe('A perfect two-player game without any hints or discards', () => {
  const g = new Game({
    playerNames: ['Bonnie', 'Clyde'],
    deck: createDeck(
      ['A', 'B', 'C', 'D', 'E', 'X'].flatMap(c => [1, 2, 3, 4, 5].map(n => c + n)).join(' '),
      // NB: No idea why vscode claims that flatMap does not exist  on type 'string[]'
    ),
  })
  it('should have correct setup', () => {
    expect(g.getState(g.players[0].id)).toEqual({
      timestamp: jasmine.any(String),
      action: {type: 'START'},
      stockSize: 50,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      turnNumber: 0,
      inTurn: 0,
      turnsLeft: null,
      score: 0,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: true,
          completeHandCards: [],
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: false,
          completeHandCards: 'A2,A4,B1,B3,B5'.split(','),
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should properly alter state after playing a card', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual({
      timestamp: jasmine.any(String),
      action: {type: 'PLAY', cardIdx: 0, card: 'A1'},
      stockSize: 49,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {A: ['A1'], B: [], C: [], D: [], E: [], X: []},
      turnNumber: 1,
      inTurn: 1,
      turnsLeft: null,
      score: 1,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          completeHandCards: 'A3,A5,B2,B4,C1'.split(','),
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: true,
          completeHandCards: [],
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should have proper state before the final action', () => {
    // always play the newest card from hand_
    for (let i = 1; i <= 28; i++) {
      g.act(g.players[i % 2].id, {type: 'PLAY', cardIdx: 0})
    }
    expect(g.getState(g.players[1].id)).toEqual({
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 21,
      discardPile: [],
      hintCount: 9,
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
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          completeHandCards: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: true,
          completeHandCards: [],
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should finish after the last card has been played', () => {
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual({
      timestamp: jasmine.any(String),
      action: jasmine.any(Object),
      stockSize: 20,
      discardPile: [],
      hintCount: 9,
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
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          completeHandCards: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: true,
          completeHandCards: [],
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should throw if trying to play a finished game', () => {
    expect(() => g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})).toThrowError('GAME_ENDED')
    // expect(() => g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})).toThrowError(GameError)
  })
})
