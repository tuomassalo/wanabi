import {TPlayerState} from './player'
import {MaskedCard, Card, TNum, TColor, TCardState} from './card'
import {MaskedPlayerView} from './hand'
import {TMaskedTurnState, TRefinedMaskedTurnState} from './game'
import {resolveActionability} from './actionability-resolver'
import {BaseTurn, refineHand} from './turn'

export class MaskedTurn extends BaseTurn {
  maskedPlayerViews: MaskedPlayerView[]
  stockSize: number
  constructor(state: TMaskedTurnState, players: TPlayerState[], gameParams) {
    super(state, players, gameParams)
    this.maskedPlayerViews = state.maskedPlayerViews.map(p => new MaskedPlayerView(p))
    this.stockSize = state.stockSize
    // refine
    const refined = this.maskedPlayerViews.map((_, idx) => refineHand(this, idx))
    for (const [idx, mc] of refined.entries()) {
      if (this.maskedPlayerViews[idx].isMe) {
        this.maskedPlayerViews[idx].hand = mc
      } else {
        this.maskedPlayerViews[idx].hand = resolveActionability(
          this.maskedPlayerViews[idx].hand.map(mc => new MaskedCard(mc)),
          this.table,
          this.discardPile,
        )
        this.maskedPlayerViews[idx].extraMysticalHand = mc
      }
    }
  }
  get inTurn() {
    return this.turnNumber % this._players.length
  }
  getState(): TRefinedMaskedTurnState {
    const ret = JSON.parse(JSON.stringify(this)) // remove undefined values
    ret.inTurn = this.inTurn
    ret.score = this.score
    delete ret._players
    delete ret._gameParams
    return ret
  }
  getExtraMysticalHandWithSpeculativeHint(toPlayerIdx: number, is: TNum | TColor): MaskedCard[] {
    const turnCopy = new MaskedTurn(this.getState(), this._players, this._gameParams)
    turnCopy.maskedPlayerViews[toPlayerIdx].hand = turnCopy.maskedPlayerViews[toPlayerIdx].hand.map(mc => {
      const c = new Card(mc as TCardState) // not my own card, so it's always known
      c.addHint({is, turnNumber: -1})
      return new MaskedCard(c)
    })
    return refineHand(turnCopy, toPlayerIdx)
  }
}
