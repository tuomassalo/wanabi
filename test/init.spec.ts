import {Game} from '../src/game'

import {c, createDeck, knownCard} from './helpers'

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
      inTurn: 0,
      players: [
        {
          name: 'Huey',
          idx: 0,
          isMe: true,
          hand: [{}, {}, {}, {}, {}],
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
      inTurn: 0,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      players: [
        {
          name: 'Huey',
          idx: 0,
          isMe: true,
          hand: [{}, {}, {}, {}, {}],
        },
        {
          name: 'Dewey',
          idx: 1,
          isMe: false,
          hand: [c.B5, c.B4, c.B3, c.B2, c.B1],
        },
        {
          name: 'Louie',
          idx: 2,
          isMe: false,
          hand: [c.C1, c.C1, c.C5, c.D5, c.E3],
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
