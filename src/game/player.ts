import {randomBytes} from 'crypto'
import {Hand} from './hand'
import {MyHandCard, TMyHandCardState, TCardState} from './card'

export type TPlayerId = string

export interface TPlayerState {
  name: string
  idx: number
  isMe: boolean
  completeHandCards: TCardState[]
  mysteryHandCards: TMyHandCardState[]
}

export class Player {
  name: string
  hand: Hand
  mysteryHandCards?: MyHandCard[]
  id: TPlayerId
  idx: number

  getMysteryHandCards(): MyHandCard[] {
    return this.mysteryHandCards || this.hand.cards.map(c => new MyHandCard(c))
  }

  setMysteryHandCards(cards: MyHandCard[]) {
    this.mysteryHandCards = cards
  }

  clearMysteryHandCards() {
    this.mysteryHandCards = undefined
  }

  constructor(name: string, idx: number, hand: Hand) {
    this.id = randomBytes(20).toString('hex')
    this.idx = idx
    this.name = name
    this.hand = hand
  }
  // like toJSON, but manually, since we need to pass `isMe`
  serialize(isMe: boolean): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      isMe,
      completeHandCards: isMe ? [] : this.hand.cards.map(c => c.toJSON()),
      mysteryHandCards: this.getMysteryHandCards().map(c => c.toJSON()),
    }
  }
  setHand(hand: Hand) {
    this.hand = hand
  }
}
