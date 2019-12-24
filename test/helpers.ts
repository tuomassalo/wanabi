import {Card, TColor, TNum} from '../src/card'
import {Pile} from '../src/pile'
import * as stringify from 'json-stable-stringify'

export const c = {
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

export function shuffle(arr: any[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// create a deck where the top cards are specified
export function createDeck(topValues: string): Pile {
  const deckCards = Card.getFullDeck()

  const topCards: Card[] = []
  for (const c of topValues
    .split(/\s+/)
    .filter(v => /\w/.test(v))
    .map(Card.fromValueString)) {
    const idx = deckCards.findIndex(f => f.color === c.color && f.num === c.num)
    if (idx === -1) {
      console.warn('ERROR', c)
      throw new Error('too many cards of type')
    }

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

export function knownCard(): any {
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
