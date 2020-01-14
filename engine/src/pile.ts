import {Card, TCardState} from './card'

// export type TPileState = string[] // ['A3', 'B1', 'B3', ...]

export class Pile {
  cards: Card[]

  constructor(cards: Card[]) {
    this.cards = cards
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }
  get size() {
    return this.cards.length
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
  toJSON(): any {
    return this.cards
  }
  // - count(Value)
}
