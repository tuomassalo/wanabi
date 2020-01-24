import {randomBytes} from 'crypto'
import {Hand} from './hand'
import {MyHandCard, TMyHandCardState, THandCardState, HandCard} from './card'

export type TPlayerId = string

export interface TMaskedPlayerState {
  name: string
  idx: number
  isMe: boolean
  completeHandCards: THandCardState[]
  mysteryHandCards: TMyHandCardState[]
}

export interface TCompletePlayerState extends TMaskedPlayerState {
  id: TPlayerId
}

export class Player {
  name: string
  hand: Hand
  mysteryHandCards?: MyHandCard[]
  id: TPlayerId
  idx: number

  getMysteryHandCards(): MyHandCard[] {
    console.warn('GETM', this.mysteryHandCards)

    return this.mysteryHandCards || this.hand.cards.map(c => new MyHandCard(c))
  }

  setMysteryHandCards(cards: MyHandCard[]) {
    this.mysteryHandCards = cards
  }

  clearMysteryHandCards() {
    this.mysteryHandCards = undefined
  }

  constructor(name: string, idx: number, hand: Hand, id: TPlayerId) {
    this.idx = idx
    this.name = name
    this.hand = hand
    this.id = id
  }
  // like toJSON, but manually, since we need to pass `isMe`
  serialize(isMe: boolean): TMaskedPlayerState {
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

export class MaskedPlayer extends Player {
  isMe: boolean
  completeHandCards: HandCard[]
  constructor(name: string, idx: number, hand: Hand, id: TPlayerId, isMe: boolean) {
    super(name, idx, hand, id)
    this.isMe = isMe
    this.completeHandCards = hand.cards
  }
  static deserializeMasked(state: TMaskedPlayerState, isMe: boolean): MaskedPlayer {
    const ret = new this(
      state.name,
      state.idx,
      new Hand(state.completeHandCards.map(c => HandCard.deserialize(c))),
      'bogus_id',
      isMe,
    )
    ret.mysteryHandCards = state.mysteryHandCards.map(hc => new MyHandCard(hc))
    return ret
  }
}
