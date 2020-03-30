import {Card, TCardState} from './card'
import seedrandom from 'seedrandom'
// export type PileOfCards = string[] // ['A3', 'B1', 'B3', ...]

export type TPileState = string[]

export class Pile {
  cards: Card[] = []

  constructor(cards: (Card | TCardState | string)[]) {
    this.cards = cards.map(c => (typeof c === 'string' ? Card.fromValueString(c) : new Card(c)))
  }
  shuffle(seed: string) {
    const rng = seedrandom(seed)

    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
    return this // chainable
  }
  get size() {
    return this.cards.length
  }
  get top() {
    return this.cards[this.cards.length - 1]
  }
  drawOne(): Card {
    const card = this.cards.pop()
    if (!card) {
      throw new Error('NO_CARDS_LEFT')
    }
    return card
  }
  add(card: Card) {
    this.cards.push(card)
  }
  toJSON(): TPileState {
    return this.cards.map(c => c.toJSON())
  }
  // - count(Value)
}
