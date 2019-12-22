import {HandCard, THandCardState} from './card'

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
  get size() {
    return this.cards.length
  }
  getState(isMe: boolean): THandCardState[] {
    return this.cards.map(c => (isMe ? c.getMePlayerState() : c.getOtherPlayerState()))
  }
  // - count(Value)
}
