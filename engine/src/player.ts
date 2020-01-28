import {Hand, MaskedHand} from './hand'
import {TCardState, TMaskedCardState, Card, MaskedCard} from './card'
import {demystify} from './demystifier'

export type TPlayerId = string

export interface TPlayerState {
  hand: TCardState[]
  id: TPlayerId
  idx: number
  name: string
  isConnected: boolean
}

export interface TMaskedPlayerState {
  hand: TMaskedCardState[]
  idx: number
  // id: string
  name: string
  isMe: boolean
  isConnected: boolean
}

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
  constructor(p: TMaskedPlayerState) {
    this.idx = p.idx
    this.name = p.name
    this.hand = new MaskedHand(p.hand)
    // this.id = p.id
    this.isMe = p.isMe
    this.isConnected = p.isConnected
  }
  static meFromPlayer(p: Player, revealedCards: Card[]): MaskedPlayer {
    return new MaskedPlayer({
      ...p,
      hand: demystify(
        // remove the actual values of each card
        p.hand.cards.map(c => new MaskedCard({hints: c.hints})),
        revealedCards,
      ),
      isMe: true,
    })
  }
  static otherFromPlayer(p: Player): MaskedPlayer {
    return new MaskedPlayer({
      ...p,
      hand: p.hand.toJSON(),
      isMe: false,
    })
  }
  static outsiderFromPlayer(p: Player): MaskedPlayer {
    return new MaskedPlayer({
      ...p,
      hand: [], // look, no hand(s)
      isMe: false,
    })
  }
  toJSON(): TMaskedPlayerState {
    return {
      name: this.name,
      hand: this.hand.toJSON(),
      idx: this.idx,
      isMe: this.isMe,
      isConnected: this.isConnected,
    }
  }
}
