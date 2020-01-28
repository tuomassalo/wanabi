import {Hand, MaskedHand} from './hand'
import {TCardState, TMaskedCardState, Card, MaskedCard} from './card'
import {demystify} from './demystifier'

export type TPlayerId = string

export interface TPlayerState {
  hand: TCardState[]
  id: TPlayerId
  idx: number
  name: string
}

export interface TMaskedPlayerState {
  hand: TMaskedCardState[]
  idx: number
  // id: string
  name: string
  isMe: boolean
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
  // serialize(isMe: boolean): TPlayerState {
  //   return {
  //     name: this.name,
  //     idx: this.idx,
  //     id: isMe ? this.id : 'bogus_id',
  //     // isMasked: isMe,
  //     hand: isMe ? this.getMysteryHandCards().map(c => c.toJSON()) : this.hand.cards.map(c => c.toJSON()),
  //     // isMe,
  //     // completeHandCards: isMe ? [] :
  //     // mysteryHandCards: ,
  //   }
  // }
  toJSON(): TPlayerState {
    return {
      name: this.name,
      idx: this.idx,
      hand: this.hand.cards.map(c => c.serializeWithHints()),
      id: this.id,
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
  constructor(p: TMaskedPlayerState) {
    this.idx = p.idx
    this.name = p.name
    this.hand = new MaskedHand(p.hand)
    // this.id = p.id
    this.isMe = p.isMe
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
    return new MaskedPlayer({...p, hand: p.hand.toJSON(), isMe: false})
  }
  toJSON(): TMaskedPlayerState {
    return {name: this.name, hand: this.hand.toJSON(), idx: this.idx, isMe: this.isMe}
  }
}
