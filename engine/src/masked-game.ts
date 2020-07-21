import {Player} from './player'
import {TGameId, TMaskedGameState, TMaskedTurnState, GameParams} from './game'
import {MaskedTurn} from './masked-turn'
import {Card} from './card'

export class MaskedGame {
  gameId: TGameId
  players: Player[]
  gameParams: GameParams
  turns: MaskedTurn[]
  constructor(maskedGameState: TMaskedGameState) {
    this.gameId = maskedGameState.gameId
    this.players = maskedGameState.players.map(p => new Player(p))
    this.gameParams = maskedGameState.gameParams
    this.turns = []
    this.addTurn(maskedGameState.currentTurn)
  }
  get currentTurn(): MaskedTurn {
    return this.turns[this.turns.length - 1]
  }

  // When the player does a PLAY/DISCARD and thus one of their cards was revealed,
  // save the card information for history view.
  fillWas() {
    // Loop backwards from current turn back to turn 0, looking for PLAY/DISCARD actions by this player.
    for (const triggerTurn of [...this.turns].reverse()) {
      const inTurn = (triggerTurn.inTurn + this.players.length - 1) % this.players.length
      // console.log(triggerTurn, {inTurn})
      if (
        (triggerTurn.action.type === 'PLAY' || triggerTurn.action.type === 'DISCARD') &&
        this.players[inTurn].id !== 'REDACTED'
      ) {
        //   // console.warn({wasInTurn, p: this.players[wasInTurn].id === 'REDACTED', turn, t: this.turns})
        // console.warn('OUTER LOOP turnNumber', triggerTurn.turnNumber)

        let {cardIdx, card} = triggerTurn.action

        // Loop backwards from the PLAY/DISCARD turn to the turn when the card in question first appeared in the hand.
        for (let turnNumber = triggerTurn.turnNumber - 1; turnNumber >= 0 && this.turns[turnNumber]; turnNumber--) {
          // console.warn('INNER LOOP', {turnNumber})
          const turn = this.turns[turnNumber]
          const hand = turn.maskedPlayerViews[inTurn].hand
          if (hand[cardIdx].was) {
            // console.warn('`was` was filled already => quitting')
            return
          }

          // console.warn(`(p${inTurn} turn ${turnNumber}) recorded ${card} (#${cardIdx})`, hand.length)

          hand[cardIdx].was = new Card(card)

          const wasInTurn = (turn.inTurn + this.players.length - 1) % this.players.length

          if (
            inTurn === wasInTurn &&
            (turn.action.type === 'PLAY' || turn.action.type === 'DISCARD') &&
            turn.action.cardIdx <= cardIdx
          ) {
            // console.warn(`shifting`, {cardIdx, toCardIdx: cardIdx + 1})
            cardIdx++
            // this is the first turn when the card is in the hand => stop looking further
            if (cardIdx >= hand.length) break
          }
        }
      }
    }
  }

  // Used by the client when receiving a new turn from the server.
  addTurn(maskedTurn: TMaskedTurnState) {
    // if (this.turns[maskedTurn.turnNumber]) return // already added

    this.turns[maskedTurn.turnNumber] = new MaskedTurn(maskedTurn, this.players)

    if (
      // only fill `was` info if there are no gaps in turn history
      !this.turns.includes(undefined as any)
    ) {
      // console.warn('no gaps, starting...', this.turns)
      this.fillWas()
    } else {
      // console.warn('gaps, not starting.')
    }
  }
}
