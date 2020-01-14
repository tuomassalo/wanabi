import {randomBytes} from 'crypto'
import {Hand} from './hand'
import {Card, MyHandCard, TMyHandCardState, THandCardState, HandCard} from './card'

export type TPlayerId = string

export interface TPlayerState {
  name: string
  idx: number
  isMe: boolean
  completeHandCards: THandCardState[]
  mysteryHandCards: TMyHandCardState[]
}

export interface TCompletePlayerState extends TPlayerState {
  id: TPlayerId
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

  constructor(name: string, idx: number, hand: Hand, id?: TPlayerId) {
    this.idx = idx
    this.name = name
    this.hand = hand
    this.id = id || randomBytes(20).toString('hex')
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
  toJSON(): TCompletePlayerState {
    return {...this.serialize(false), id: this.id}
  }
  static deserialize(state: TCompletePlayerState): Player {
    return new Player(
      state.name,
      state.idx,
      new Hand(state.completeHandCards.map(c => HandCard.deserialize(c))),
      state.id,
    )
  }
  setHand(hand: Hand) {
    this.hand = hand
  }
}
