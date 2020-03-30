import {Hand, MaskedHand} from './hand'
import {TCardState, TMaskedCardState, Card, MaskedCard} from './card'
import {demystify} from './demystifier'
import {resolveActionability} from './actionability-resolver'
import {Table} from './table'
import {Pile} from './pile'

export type TPlayerId = string

export interface TMaskedPlayerState {
  idx: number
  name: string
  isConnected: boolean
}
export interface TPlayerState extends TMaskedPlayerState {
  id: TPlayerId // NB: might be redacted
}

// export interface TMaskedPlayerState {
//   idx: number
//   name: string
//   isConnected: boolean
//   isMe: boolean
// }
export interface TMePlayerHandViewState {
  isMe: true
  hand: TMaskedCardState[]
}
export interface TOtherPlayerHandViewState {
  isMe: false
  hand: TMaskedCardState[] // actually, it's complete, not masked, but this is for type simplicity
  extraMysticalHand: TMaskedCardState[]
}
export type TPlayerHandViewState = TMePlayerHandViewState | TOtherPlayerHandViewState

export class Player {
  name: string
  id: TPlayerId
  idx: number
  isConnected: boolean

  constructor(p: TPlayerState) {
    this.idx = p.idx
    this.name = p.name
    this.id = p.id
    this.isConnected = p.isConnected
  }

  toJSON(): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      id: this.id,
      isConnected: this.isConnected,
    }
  }
}

export class PlayerHandView {
  hand: MaskedHand
  isMe: boolean
  extraMysticalHand?: MaskedHand
  constructor(p: TPlayerHandViewState) {
    // this.idx = p.idx
    // this.name = p.name
    this.hand = new MaskedHand(p.hand)
    // this.id = p.id
    this.isMe = p.isMe
    // this.isConnected = p.isConnected
    if (!p.isMe) this.extraMysticalHand = new MaskedHand(p.extraMysticalHand)
  }
  static meFromPlayer(hand: TMaskedCardState[]): PlayerHandView {
    return new PlayerHandView({
      hand,
      isMe: true,
    })
  }
  static otherFromPlayer(hand: MaskedCard[], extraMysticalHand: TMaskedCardState[]): PlayerHandView {
    //
    // hand.forEach((c, i) => {
    //   c.possibleCards = demystifiedHand[i].possibleCards
    // })

    return new PlayerHandView({
      hand,
      isMe: false,
      extraMysticalHand,
    })
  }
  static outsiderFromPlayer(p: Player): PlayerHandView {
    return new PlayerHandView({
      ...p,
      hand: [], // look, no hand(s)
      isMe: false,
      extraMysticalHand: [],
    })
  }
  toJSON(): TPlayerHandViewState {
    return this.isMe
      ? {
          // name: this.name,
          hand: this.hand.toJSON(),
          // idx: this.idx,
          isMe: true,
        }
      : {
          // name: this.name,
          hand: this.hand.toJSON(),
          // idx: this.idx,
          isMe: false,
          extraMysticalHand: (this.extraMysticalHand as MaskedHand).toJSON(),
        }
  }
}
