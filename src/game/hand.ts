import {Card, HandCard, THintState} from './card'
import {GameError} from './errors'
import {Pile} from './pile'

// export type THandState = THandCardState[]

export class Hand {
  cards: HandCard[]

  constructor(cards: HandCard[]) {
    this.cards = cards
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }
  dealOne(card: Card) {
    this.cards.push(HandCard.fromCard(card))
  }
  take(idx: number, stock: Pile): Card {
    if (!this.cards[idx]) {
      throw new GameError('NO_SUCH_CARD', {idx})
    }
    const drawnCard = this.cards.splice(idx, 1)[0].toCard()
    if (stock.size) {
      const newCard: Card = stock.drawOne()
      this.cards.push(new HandCard({color: newCard.color, num: newCard.num, hints: []}))
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
