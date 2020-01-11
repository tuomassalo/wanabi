import {Game} from '../src/game/game'

import {createDeck, knownCard, cards} from './helpers'

describe('A three-player game without any moves', () => {
  const g = new Game(['Huey', 'Dewey', 'Louie'])
  it('should have full stock', () => {
    expect(g.stock.size).toEqual((3 + 2 + 2 + 2 + 1) * 6 - 3 * 5)
  })
  it('should have correct setup', () => {
    expect(g.getState(g.players[0].id)).toEqual({
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
          isMe: true,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          completeHandCards: [],
        },
        {
          name: 'Dewey',
          idx: 1,
          isMe: false,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          completeHandCards: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
        },
        {
          name: 'Louie',
          idx: 2,
          isMe: false,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          completeHandCards: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
        },
      ],
    })
  })
})

describe('A three-player game with a custom deck', () => {
  const g = new Game(['Huey', 'Dewey', 'Louie'], {deck: createDeck('A1 A2 A3 A4 A5 B5 B4 B3 B2 B1 C1 C1 C5 D5 E3')})
  it('should have full stock', () => {
    expect(g.stock.size).toEqual((3 + 2 + 2 + 2 + 1) * 6 - 3 * 5)
  })
  it('should have correct setup', () => {
    expect(g.getState(g.players[0].id)).toEqual({
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
          isMe: true,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          completeHandCards: [],
        },
        {
          name: 'Dewey',
          idx: 1,
          isMe: false,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          completeHandCards: cards('A2,A5,B3,C1,D5'),
        },
        {
          name: 'Louie',
          idx: 2,
          isMe: false,
          mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
          completeHandCards: cards('A3,B5,B2,C1,E3'),
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
