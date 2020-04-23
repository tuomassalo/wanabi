import {Game} from '../src/game'

import {createDeck, knownCard} from './helpers'

describe('A three-player game without any moves', () => {
  const g = new Game({from: 'NEW_TEST_GAME', playerNames: ['Huey', 'Dewey', 'Louie']})
  it('should have full stock', () => {
    expect(g.currentTurn.stock.size).toEqual((3 + 2 + 2 + 2 + 1) * 6 - 3 * 5)
  })
  it('should have correct setup', () => {
    expect(g.COMPAT_getRefinedMaskedTurnState(g.players[0].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: {type: 'START'},
      stockSize: 45,
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
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          isMe: false,
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
})

describe('A three-player game with a custom deck', () => {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Huey', 'Dewey', 'Louie'],
    deck: createDeck('A1 A2 A3 A4 A5 B5 B4 B3 B2 B1 C1 C1 C5 D5 E3'),
  })
  it('should have full stock', () => {
    expect(g.currentTurn.stock.size).toEqual((3 + 2 + 2 + 2 + 1) * 6 - 3 * 5)
  })
  it('should have correct setup', () => {
    expect(g.COMPAT_getRefinedMaskedTurnState(g.players[0].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: {type: 'START'},
      stockSize: 45,
      discardPile: [],
      hintCount: 8,
      woundCount: 0,
      turnNumber: 0,
      inTurn: 0,
      turnsLeft: null,
      score: 0,
      status: 'RUNNING',
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      maskedPlayerViews: [
        {
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          isMe: false,
          hand: [
            {color: 'A', num: 2, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'A', num: 5, hints: [], actionability: 'UNDISCARDABLE'},
            {color: 'B', num: 3, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'C', num: 1, hints: [], actionability: 'PLAYABLE'},
            {color: 'D', num: 5, hints: [], actionability: 'UNDISCARDABLE'},
          ],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          isMe: false,
          hand: [
            {color: 'A', num: 3, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'B', num: 5, hints: [], actionability: 'UNDISCARDABLE'},
            {color: 'B', num: 2, hints: [], actionability: 'UNPLAYABLE'},
            {color: 'C', num: 1, hints: [], actionability: 'PLAYABLE'},
            {color: 'E', num: 3, hints: [], actionability: 'UNPLAYABLE'},
          ],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
      ],
    })
  })
})

describe('A game with a given seed', () => {
  it('will always have the same stock', () => {
    const pg = Game.createPendingGame(
      {firstPlayerName: 'Fortuna', seed: 'ecfad89689ec6780d9838e0a22d731f82d25a3b4'},
      'bogus_id_fortuna',
    )
    expect(pg.currentTurn.stock.toJSON().join(',')).toEqual(
      'X5,X4,C4,E2,A3,B1,D1,A1,C2,A1,X3,B2,B3,D4,C1,X3,A4,C1,C3,X1,D4,E1,X1,C2,E5,A4,B4,C4,X2,C3,A5,A3,X1,A2,E3,E1,D2,E4,E3,B1,A2,D2,E1,B3,E2,D1,E4,B4,X4,B5,D3,B1,D3,C1,A1,C5,D5,B2,X2,D1',
    )
  })
})
