import {MaskedPlayerView} from './hand'
import {TMaskedCardState, MaskedCard} from './card'

export type TPlayerId = string

export interface TPlayerState {
  idx: number
  name: string
  isConnected: boolean
  id: TPlayerId // NB: might be redacted
}

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

// export class PlayerHandView {
//   hand: MaskedPlayerView
//   isMe: boolean
//   extraMysticalHand?: MaskedPlayerView
//   constructor(p: TPlayerHandViewState) {
//     // this.idx = p.idx
//     // this.name = p.name
//     this.hand = new MaskedPlayerView(p.hand)
//     // this.id = p.id
//     this.isMe = p.isMe
//     // this.isConnected = p.isConnected
//     if (!p.isMe) this.extraMysticalHand = new MaskedPlayerView(p.extraMysticalHand)
//   }
//   static meFromPlayer(hand: TMaskedCardState[]): PlayerHandView {
//     return new PlayerHandView({
//       hand,
//       isMe: true,
//     })
//   }
//   static otherFromPlayer(hand: MaskedCard[], extraMysticalHand: TMaskedCardState[]): PlayerHandView {
//     //
//     // hand.forEach((c, i) => {
//     //   c.possibleCards = demystifiedHand[i].possibleCards
//     // })

//     return new PlayerHandView({
//       hand,
//       isMe: false,
//       extraMysticalHand,
//     })
//   }
//   static outsiderFromPlayer(p: Player): PlayerHandView {
//     return new PlayerHandView({
//       ...p,
//       hand: [], // look, no hand(s)
//       isMe: false,
//       extraMysticalHand: [],
//     })
//   }
//   toJSON(): TPlayerHandViewState {
//     return this.isMe
//       ? {
//           // name: this.name,
//           hand: this.hand.toJSON(),
//           // idx: this.idx,
//           isMe: true,
//         }
//       : {
//           // name: this.name,
//           hand: this.hand.toJSON(),
//           // idx: this.idx,
//           isMe: false,
//           extraMysticalHand: (this.extraMysticalHand as MaskedPlayerView).toJSON(),
//         }
//   }
// }
