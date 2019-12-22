import {Game} from '../src/game'
// import {Card} from '../src/card'
import * as stringify from 'json-stable-stringify'

// function createDeck(...topValues:string) {
//   const g = new Game(['foo','bar'])
// }

function knownCard(): any {
  return {
    asymmetricMatch: function(compareTo) {
      return /^\{"color":"[ABCDEX]","num":[12345]\}$/.test(stringify(compareTo))
    },

    /*
     * The jasmineToString method is used in the Jasmine pretty printer, and will
     * be seen by the user in the message when a test fails.
     */
    jasmineToString: function() {
      return '<knownCard>'
    },
  }
}

describe('A three-player game without any moves', () => {
  const g = new Game(['Huey', 'Dewey', 'Louie'])
  it('should have full stock', () => {
    expect(g.stock.size).toEqual((3 + 2 + 2 + 2 + 1) * 6 - 3 * 5)
  })
  it('should have correct setup', () => {
    expect({foo: {color: 'A', num: 3}}).toEqual({foo: knownCard()})
    expect(g.getState(g.players[0].id)).toEqual({
      stockSize: 45,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
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

// describe('A custom deck', () => {
//   const g = new Game(['Huey', 'Dewey', 'Louie'])
//   it('should have correct setup', () => {
//     expect(g.getState(g.players[0].id)).toEqual({
//       stockSize: 45,
//       discardPile: [],
//       hintCount: 9,
//       woundCount: 0,
//       inTurn: 0,
//       players: [
//         {
//           name: 'Huey',
//           idx: 0,
//           isMe: true,
//           hand: [{}, {}, {}, {}, {}],
//         },
//         {
//           name: 'Dewey',
//           idx: 1,
//           isMe: false,
//           hand: [{value: 'A3'}, {value: 'A3'}, {value: 'A4'}, {value: 'A4'}, {value: 'A5'}],
//         },
//         {
//           name: 'Louie',
//           idx: 2,
//           isMe: false,
//           hand: [{value: 'B1'}, {value: 'B1'}, {value: 'B1'}, {value: 'B2'}, {value: 'B2'}],
//         },
//       ],
//     })
//   })

//   // it('async', done => {
//   //   setTimeout(() => {
//   //     expect(1).toEqual(1)
//   //     done()
//   //   }, 3000)
//   // })
// })
