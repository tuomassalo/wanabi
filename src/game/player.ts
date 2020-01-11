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
  // pos: number
  name: string
  hand: Hand
  id: TPlayerId
  idx: number
  // hint(Color|Num)
  // receivedHints: Hint[]

  get mysteryHandCards() {
    return this.hand.cards.map(c => new MyHandCard(c))
  }

  constructor(name: string, idx: number, hand: Hand) {
    this.id = randomBytes(20).toString('hex')
    this.idx = idx
    this.name = name
    this.hand = hand
  }
  // like toJSON, but manually, since we need to pass `isMe`
  toObject(isMe: boolean): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      isMe,
      completeHandCards: isMe ? [] : this.hand.cards.map(c => c.toJSON()),
      mysteryHandCards: this.mysteryHandCards.map(c => c.toJSON()),
    }
  }
  setHand(hand: Hand) {
    this.hand = hand
  }
}
