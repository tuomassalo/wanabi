import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {Card, HandCard, TCardState} from './card'
import {Hand} from './hand'
import {Table, TTableState} from './table'
import {ParamError} from './errors'

interface TGameState {
  stockSize: number
  discardPile: TCardState[]
  hintCount: number
  woundCount: number
  table: TTableState
  inTurn: number
  players: TPlayerState[]
}

export class Game {
  stock: Pile
  discardPile: Pile
  hintCount: number
  woundCount: number
  inTurn: number
  table: Table

  players: Player[]
  playersById: {[id: string]: Player}
  constructor(
    playerNames: string[],
    {deck, discardPile, table}: {deck?: Pile; discardPile?: Pile; table?: Table} = {},
  ) {
    this.hintCount = 9
    this.woundCount = 0
    this.inTurn = 0
    this.table = table || new Table()
    if (deck) {
      this.stock = deck
    } else {
      this.stock = new Pile(deck || Card.getFullDeck())
      this.stock.shuffle()
    }
    this.discardPile = discardPile || new Pile([])

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

    this.checkIntegrity()
  }

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TGameState {
    if (!this.playersById[playerId]) {
      throw new ParamError('INVALID_PLAYER_ID', playerId)
    }
    return {
      stockSize: this.stock.size,
      discardPile: this.discardPile.getState(),
      hintCount: this.hintCount,
      woundCount: this.woundCount,
      inTurn: this.inTurn,
      table: this.table.getState(),
      players: this.players.map(p => p.getState(playerId === p.id)),
    }
  }

  checkIntegrity() {
    // check that we have the correct set of cards
    if (
      [...this.stock.cards, ...this.discardPile.cards, ...this.players.flatMap(p => p.hand.cards)]
        .map(c => c.toString())
        .sort()
        .join(' ') !==
      Card.getFullDeck()
        .map(c => c.toString())
        .sort()
        .join(' ')
    ) {
      console.warn(this)

      throw new Error('INTEGRITY_ERROR')
    }
  }
}
