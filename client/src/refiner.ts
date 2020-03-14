import {MaskedCard, TMaskedCardState} from 'wanabi-engine/dist/card'
import {THintResultState} from 'wanabi-engine/dist/card'
import {MaskedTurn} from 'wanabi-engine'

export interface TRefinedHintResultState extends THintResultState {
  hinterName: string
  turnsAgo: number
}

export interface TRefinedMaskedCardState extends Omit<TMaskedCardState, 'hints'> {
  hints: TRefinedHintResultState[]
  value: string | undefined
}

export function refineHint(game: MaskedTurn, hint: THintResultState): TRefinedHintResultState {
  return {
    ...hint,
    hinterName: game.players[hint.turnNumber % game.players.length].name,
    turnsAgo: game.turnNumber - hint.turnNumber,
  }
}

export function refineCards(game: MaskedTurn, cards: MaskedCard[]): TRefinedMaskedCardState[] {
  return cards.map(c => ({
    ...c.toJSON(),
    value: c.value,
    hints: c.hints.map(h => refineHint(game, h)),
    // byPlayer: game.players[0],
    // turnsAgo: 0,
  }))
}
