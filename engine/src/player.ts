import {Hand, MaskedHand} from './hand'
import {TCardState, TMaskedCardState, Card, MaskedCard} from './card'
import {demystify} from './demystifier'
import {resolveActionability} from './actionability-resolver'
import {Table} from './table'
import {Pile} from './pile'

export type TPlayerId = string

export interface TPlayerState {
  hand: TCardState[]
  id: TPlayerId
  idx: number
  name: string
  isConnected: boolean
}

interface TBaseMaskedPlayerState {
  hand: TMaskedCardState[]
  idx: number
  name: string
  isConnected: boolean
}
export interface TMeMaskedPlayerState extends TBaseMaskedPlayerState {
  isMe: true
}
export interface TOtherMaskedPlayerState extends TBaseMaskedPlayerState {
  isMe: false
  extraMysticalHand: TMaskedCardState[]
}
export type TMaskedPlayerState = TMeMaskedPlayerState | TOtherMaskedPlayerState

export class Player {
  name: string
  hand: Hand
  id: TPlayerId
  idx: number
  isConnected: boolean

  constructor(p: TPlayerState) {
    this.idx = p.idx
    this.name = p.name
    this.hand = new Hand(p.hand)
    this.id = p.id
    this.isConnected = p.isConnected
  }

  toJSON(): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      hand: this.hand.cards.map(c => c.serializeWithHints()),
      id: this.id,
      isConnected: this.isConnected,
    }
  }
  setHand(hand: Hand) {
    this.hand = hand
  }
}

export class MaskedPlayer {
  name: string
  hand: MaskedHand
  // id: TPlayerId
  idx: number
  isMe: boolean
  isConnected: boolean
  extraMysticalHand?: MaskedHand
  constructor(p: TMaskedPlayerState) {
    this.idx = p.idx
    this.name = p.name
    this.hand = new MaskedHand(p.hand)
    // this.id = p.id
    this.isMe = p.isMe
    this.isConnected = p.isConnected
    if (!p.isMe) this.extraMysticalHand = new MaskedHand(p.extraMysticalHand)
  }
  static meFromPlayer(p: Player, hand: TMaskedCardState[]): MaskedPlayer {
    return new MaskedPlayer({
      ...p,
      hand,
      isMe: true,
    })
  }
  static otherFromPlayer(p: Player, hand: MaskedCard[], extraMysticalHand: TMaskedCardState[]): MaskedPlayer {
    //
    // hand.forEach((c, i) => {
    //   c.possibleCards = demystifiedHand[i].possibleCards
    // })

    return new MaskedPlayer({
      ...p,
      hand,
      isMe: false,
      extraMysticalHand,
    })
  }
  static outsiderFromPlayer(p: Player): MaskedPlayer {
    return new MaskedPlayer({
      ...p,
      hand: [], // look, no hand(s)
      isMe: false,
      extraMysticalHand: [],
    })
  }
  toJSON(): TMaskedPlayerState {
    return this.isMe
      ? {
          name: this.name,
          hand: this.hand.toJSON(),
          idx: this.idx,
          isMe: true,
          isConnected: this.isConnected,
        }
      : {
          name: this.name,
          hand: this.hand.toJSON(),
          idx: this.idx,
          isMe: false,
          isConnected: this.isConnected,
          extraMysticalHand: (this.extraMysticalHand as MaskedHand).toJSON(),
        }
  }
}
