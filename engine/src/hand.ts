import {Card, MaskedCard, THintState, TCardState, TMaskedCardState} from './card'
import {GameError} from './errors'
import {Pile} from './pile'

export type THandState = TCardState[]

export interface TMaskedPlayerViewState {
  isMe: boolean
  hand: TMaskedCardState[]
  extraMysticalHand?: TMaskedCardState[]
}
export interface COMPAT_TMaskedOtherPlayerViewState {
  isMe: boolean
  hand: TMaskedCardState[]
  extraMysticalHand: TMaskedCardState[]
}

export class Hand {
  cards: Card[]

  constructor(cards: (Card | TCardState)[]) {
    this.cards = cards.map(c => new Card(c))
  }
  toJSON(): THandState {
    return this.cards.map(c => c.serializeWithHints())
  }
  dealOne(card: Card) {
    this.cards.push(card)
  }
  take(idx: number, stock: Pile): Card {
    if (!this.cards[idx]) {
      console.warn({idx}, this.cards)
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

// readonly class
export class MaskedPlayerView {
  isMe: boolean
  hand: MaskedCard[]
  constructor(s: TMaskedPlayerViewState) {
    this.hand = s.hand.map(c => new MaskedCard(c))
    this.isMe = s.isMe
  }
  toJSON(): TMaskedPlayerViewState {
    return {hand: this.hand.map(c => c.toJSON()), isMe: this.isMe}
  }
}
