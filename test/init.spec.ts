import {Game} from '../src/game'

import {c, createDeck, knownCard, cards} from './helpers'

describe('A three-player game without any moves', () => {
  const g = new Game(['Huey', 'Dewey', 'Louie'])
  it('should have full stock', () => {
    expect(g.stock.size).toEqual((3 + 2 + 2 + 2 + 1) * 6 - 3 * 5)
  })
  it('should have correct setup', () => {
    expect(g.getState(g.players[0].id)).toEqual({
      stockSize: 45,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      turn: 0,
      inTurn: 0,
      turnsLeft: Infinity,
      score: 0,
      status: 'RUNNING',
      players: [
        {
          name: 'Huey',
          idx: 0,
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Dewey',
          idx: 1,
          isMe: false,
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
        },
        {
          name: 'Louie',
          idx: 2,
          isMe: false,
          hand: [knownCard(), knownCard(), knownCard(), knownCard(), knownCard()],
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
      stockSize: 45,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      turn: 0,
      inTurn: 0,
      turnsLeft: Infinity,
      score: 0,
      status: 'RUNNING',
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      players: [
        {
          name: 'Huey',
          idx: 0,
          isMe: true,
          hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
        },
        {
          name: 'Dewey',
          idx: 1,
          isMe: false,
          hand: cards('A2,A5,B3,C1,D5'),
        },
        {
          name: 'Louie',
          idx: 2,
          isMe: false,
          hand: cards('A3,B5,B2,C1,E3'),
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
