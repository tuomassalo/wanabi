import {Hand} from './hand'
import {TCardState} from './card'

export type TPlayerId = string

export interface TPlayerState {
  hand: TCardState[]
  id: TPlayerId
  idx: number
  // isMasked: boolean
  name: string
}

export class Player {
  name: string
  hand: Hand
  id: TPlayerId
  idx: number

  // getMysteryHandCards(): MyHandCard[] {
  //   return this.mysteryHandCards || this.hand.cards.map(c => new MyHandCard(c))
  // }

  // setMysteryHandCards(cards: MyHandCard[]) {
  //   this.mysteryHandCards = cards
  // }

  // clearMysteryHandCards() {
  //   this.mysteryHandCards = undefined
  // }

  constructor(p: TPlayerState) {
    this.idx = p.idx
    this.name = p.name
    this.hand = new Hand(p.hand)
    this.id = p.id
  }
  // like toJSON, but manually, since we need to pass `isMe`
  serialize(isMe: boolean): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      id: isMe ? this.id : 'bogus_id',
      // isMasked: isMe,
      hand: isMe ? this.getMysteryHandCards().map(c => c.toJSON()) : this.hand.cards.map(c => c.toJSON()),
      // isMe,
      // completeHandCards: isMe ? [] :
      // mysteryHandCards: ,
    }
  }
  toJSON(): TPlayerState {
    return {...this.serialize(false), id: this.id}
  }
  setHand(hand: Hand) {
    this.hand = hand
  }
}
