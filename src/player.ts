import {Hand} from './hand'
import {randomBytes} from 'crypto'
import {THandCardState} from './card'

export type TPlayerId = string

export interface TPlayerState {
  name: string
  idx: number
  isMe: boolean
  completeHand: THandCardState[]
  mysteryHand: THandCardState[]
}

export class Player {
  // pos: number
  name: string
  hand: Hand
  id: TPlayerId
  idx: number
  // hint(Color|Num)
  // receivedHints: Hint[]

  constructor(name: string, idx: number, hand: Hand) {
    this.id = randomBytes(20).toString('hex')
    this.idx = idx
    this.name = name
    this.hand = hand
  }
  getState(): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      isMe: false,
      completeHand: this.hand.getState(false),
      mysteryHand: this.hand.getState(true),
    }
  }
  setHand(hand: Hand) {
    this.hand = hand
  }
}
