import {Card, THintState, TCardState} from './card'
import {GameError} from './errors'
import {Pile} from './pile'

export type THandState = TCardState[]

export class Hand {
  cards: Card[]

  constructor(cards: (Card | TCardState)[]) {
    this.cards = cards.map(c => new Card(c))
  }
  toJSON(): THandState {
    return this.cards
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }
  dealOne(card: Card) {
    this.cards.push(card)
  }
  take(idx: number, stock: Pile): Card {
    if (!this.cards[idx]) {
      throw new GameError('NO_SUCH_CARD', {idx})
    }
    const drawnCard = this.cards.splice(idx, 1)[0]
    if (stock.size) {
      const newCard: Card = stock.drawOne()
      this.cards.push(new Card({color: newCard.color, num: newCard.num, hints: []}))
    }
    return drawnCard
  }
  get size() {
    return this.cards.length
  }
  addHint(hint: THintState) {
    for (const c of this.cards) {
      c.addHint(hint)
    }
  }
}
