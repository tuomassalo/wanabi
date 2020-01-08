import {Game} from '../src/game'

import {c, createDeck, knownCard, cards} from './helpers'

describe('A perfect two-player game without any hints or discards', () => {
  const g = new Game(['Bonnie', 'Clyde'], {
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
      turn: 0,
      inTurn: 0,
      turnsLeft: null,
      score: 0,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: true,
          completeHand: [],
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: false,
          completeHand: cards('A2,A4,B1,B3,B5'),
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should properly alter state after playing a card', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    expect(g.getState(g.players[1].id)).toEqual({
      timestamp: jasmine.any(String),
      action: {type: 'PLAY', cardIdx: 0, card: {color: 'A', num: 1}},
      stockSize: 49,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {A: [c.A1], B: [], C: [], D: [], E: [], X: []},
      turn: 1,
      inTurn: 1,
      turnsLeft: null,
      score: 1,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          completeHand: cards('A3,A5,B2,B4,C1'),
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: true,
          completeHand: [],
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
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
        A: [c.A1, c.A2, c.A3, c.A4, c.A5],
        B: [c.B1, c.B2, c.B3, c.B4, c.B5],
        C: [c.C1, c.C2, c.C3, c.C4, c.C5],
        D: [c.D1, c.D2, c.D3, c.D4, c.D5],
        E: [c.E1, c.E2, c.E3, c.E4, c.E5],
        X: [c.X1, c.X2, c.X3, c.X4],
      },
      turn: 29,
      inTurn: 1,
      turnsLeft: null,
      score: 29,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          completeHand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: true,
          completeHand: [],
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
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
        A: [c.A1, c.A2, c.A3, c.A4, c.A5],
        B: [c.B1, c.B2, c.B3, c.B4, c.B5],
        C: [c.C1, c.C2, c.C3, c.C4, c.C5],
        D: [c.D1, c.D2, c.D3, c.D4, c.D5],
        E: [c.E1, c.E2, c.E3, c.E4, c.E5],
        X: [c.X1, c.X2, c.X3, c.X4, c.X5],
      },
      turn: 30,
      inTurn: 0,
      turnsLeft: null,
      score: 30,
      status: 'FINISHED',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          completeHand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: true,
          completeHand: [],
          mysteryHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
  it('should throw if trying to play a finished game', () => {
    expect(() => g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})).toThrowError('GAME_ENDED')
    // expect(() => g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})).toThrowError(GameError)
  })
})
