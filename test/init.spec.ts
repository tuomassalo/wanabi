import {Game} from '../src/game'
import {Card, TColor, TNum} from '../src/card'
import {Pile} from '../src/pile'
import * as stringify from 'json-stable-stringify'

const c = {
  A1: {color: 'A' as TColor, num: 1 as TNum},
  A2: {color: 'A' as TColor, num: 2 as TNum},
  A3: {color: 'A' as TColor, num: 3 as TNum},
  A4: {color: 'A' as TColor, num: 4 as TNum},
  A5: {color: 'A' as TColor, num: 5 as TNum},
  B1: {color: 'B' as TColor, num: 1 as TNum},
  B2: {color: 'B' as TColor, num: 2 as TNum},
  B3: {color: 'B' as TColor, num: 3 as TNum},
  B4: {color: 'B' as TColor, num: 4 as TNum},
  B5: {color: 'B' as TColor, num: 5 as TNum},
  C1: {color: 'C' as TColor, num: 1 as TNum},
  C2: {color: 'C' as TColor, num: 2 as TNum},
  C3: {color: 'C' as TColor, num: 3 as TNum},
  C4: {color: 'C' as TColor, num: 4 as TNum},
  C5: {color: 'C' as TColor, num: 5 as TNum},
  D1: {color: 'D' as TColor, num: 1 as TNum},
  D2: {color: 'D' as TColor, num: 2 as TNum},
  D3: {color: 'D' as TColor, num: 3 as TNum},
  D4: {color: 'D' as TColor, num: 4 as TNum},
  D5: {color: 'D' as TColor, num: 5 as TNum},
  E1: {color: 'E' as TColor, num: 1 as TNum},
  E2: {color: 'E' as TColor, num: 2 as TNum},
  E3: {color: 'E' as TColor, num: 3 as TNum},
  E4: {color: 'E' as TColor, num: 4 as TNum},
  E5: {color: 'E' as TColor, num: 5 as TNum},
  X1: {color: 'X' as TColor, num: 1 as TNum},
  X2: {color: 'X' as TColor, num: 2 as TNum},
  X3: {color: 'X' as TColor, num: 3 as TNum},
  X4: {color: 'X' as TColor, num: 4 as TNum},
  X5: {color: 'X' as TColor, num: 5 as TNum},
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// create a deck where the top cards are specified
function createDeck(topValues: string): Pile {
  const deckCards = Card.getFullDeck()
  const topCards: Card[] = []
  for (const c of topValues.split(/\s+/).map(Card.fromValueString)) {
    topCards.push(
      deckCards.splice(
        deckCards.findIndex(f => f.color === c.color && f.num === c.num),
        1,
      )[0],
    )
  }
  shuffle(deckCards)
  const deck = new Pile([...topCards, ...deckCards])
  return deck
}

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
