import {Player} from './player'
import {TGameId, TMaskedGameState, TMaskedTurnState} from './game'
import {MaskedTurn} from './turn'
export class MaskedGame {
  gameId: TGameId
  players: Player[]
  turns: MaskedTurn[]
  constructor(maskedGameState: TMaskedGameState) {
    this.gameId = maskedGameState.gameId
    this.players = maskedGameState.players.map(p => new Player(p))
    this.turns = []
    this.addTurn(maskedGameState.currentTurn)
  }
  get currentTurn(): MaskedTurn {
    return this.turns[this.turns.length - 1]
  }
  // Used by the client when receiving a new turn from the server.
  addTurn(maskedTurn: TMaskedTurnState) {
    this.turns[maskedTurn.turnNumber] = new MaskedTurn(maskedTurn, this.players)
  }
}
