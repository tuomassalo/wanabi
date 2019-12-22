import {Hand} from './hand'
import {randomBytes} from 'crypto'
import {THandCardState} from './card'

export type TPlayerId = string

export interface TPlayerState {
  name: string
  idx: number
  isMe: boolean
  hand: THandCardState[]
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
  getState(isMe: boolean): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      isMe,
      hand: this.hand.getState(isMe),
    }
  }
  setHand(hand:Hand) {
    this.hand = hand
  }
}
