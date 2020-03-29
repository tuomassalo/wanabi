import {Game} from '../src/game'

import {createDeck, knownCard} from './helpers'

describe('A three-player game without any moves', () => {
  const g = new Game({from: 'NEW_TEST_GAME', playerNames: ['Huey', 'Dewey', 'Louie']})
  it('should have full stock', () => {
    expect(g.currentTurn.stock.size).toEqual((3 + 2 + 2 + 2 + 1) * 6 - 3 * 5)
  })
  it('should have correct setup', () => {
    expect(g.getTurnState(g.players[0].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: {type: 'START'},
      stockSize: 45,
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
          name: 'Huey',
          idx: 0,
          isConnected: true,
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Dewey',
          idx: 1,
          isConnected: true,
          isMe: false,
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
          extraMysticalHand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Louie',
          idx: 2,
          isConnected: true,
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
    expect(g.getTurnState(g.players[0].id)).toEqual({
      // gameId: jasmine.any(String),
      timestamp: jasmine.any(String),
      action: {type: 'START'},
      stockSize: 45,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      turnNumber: 0,
      inTurn: 0,
      turnsLeft: null,
      score: 0,
      status: 'RUNNING',
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      players: [
        {
          name: 'Huey',
          idx: 0,
          isConnected: true,
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Dewey',
          idx: 1,
          isConnected: true,
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
          name: 'Louie',
          idx: 2,
          isConnected: true,
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

//   // it('async', done => {
//   //   setTimeout(() => {
//   //     expect(1).toEqual(1)
//   //     done()
//   //   }, 3000)
//   // })
// })
