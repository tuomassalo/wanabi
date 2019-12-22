import {Pile, TPileState} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {AllColors, Card, TNum, NumDistribution, HandCard} from './card'
import {Hand} from './hand'
// import {Pile} from './pile'

interface TGameState {
  stockSize: number
  discardPile: TPileState
  hintCount: number
  woundCount: number
  inTurn: number
  players: TPlayerState[]
}

export class Game {
  stock: Pile
  discardPile: Pile
  hintCount: number
  woundCount: number
  inTurn: number

  // numberOfPlayers: number
  players: Player[]
  playersById: {[id: string]: Player}
  constructor(playerNames: string[], deck?: Card[]) {
    this.hintCount = 9
    this.woundCount = 0
    this.inTurn = 0
    if (deck) {
      this.stock = new Pile(deck)
    } else {
      this.stock = new Pile(deck || AllColors.flatMap(c => NumDistribution.map((n: TNum) => new Card(c, n))))
      this.stock.shuffle()
    }
    this.discardPile = new Pile([])

    const handSize = {
      2: 5,
      3: 5,
      4: 4,
      5: 4,
    }[playerNames.length]

    if (!handSize) {
      throw new Error('INVALID_NUMBER_OF_PLAYERS')
    }

    this.players = playerNames.map(
      (name, idx) => new Player(name, idx, new Hand(this.stock.draw(handSize).map(c => HandCard.fromCard(c)))),
    )
    this.playersById = Object.fromEntries(this.players.map(p => [p.id, p]))
  }

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TGameState {
    if (!this.playersById[playerId]) {
      throw new Error('INVALID_PLAYER_ID')
    }
    return {
      stockSize: this.stock.size,
      discardPile: this.discardPile.getState(),
      hintCount: this.hintCount,
      woundCount: this.woundCount,
      inTurn: this.inTurn,
      players: this.players.map(p => p.getState(playerId === p.id)),
    }
  }
}
