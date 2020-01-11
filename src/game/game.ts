import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {Card, TColor, TNum, AllColors, AllNums, TCardState} from './card'
import {Hand} from './hand'
import {Table, TTableState} from './table'
import {SyntaxError, GameError} from './errors'
import {demystify} from './demystifier'

type TGameStatus = 'RUNNING' | 'GAMEOVER' | 'FINISHED'

interface TPlayActionParams {
  type: 'PLAY'
  cardIdx: number
}
interface TDiscardActionParams {
  type: 'DISCARD'
  cardIdx: number
}
interface THintActionParams {
  type: 'HINT'
  toPlayerIdx: number
  is: TColor | TNum
}

// added by the constructor
interface TStartActionParams {
  type: 'START'
}

type TActionParams = TPlayActionParams | TDiscardActionParams | THintActionParams | TStartActionParams
type TPlayableActionParams = TPlayActionParams | TDiscardActionParams | THintActionParams

interface TResolvedStartActionState extends TStartActionParams {} // added by the constructor
interface TResolvedPlayActionState extends TPlayActionParams {
  card: TCardState
}
interface TResolvedDiscardActionState extends TDiscardActionParams {
  card: TCardState
}
interface TResolvedHintActionState extends THintActionParams {}

type TResolvedActionState =
  | TResolvedPlayActionState
  | TResolvedDiscardActionState
  | TResolvedHintActionState
  | TResolvedStartActionState

interface TTurnState {
  status: TGameStatus
  action: TResolvedActionState
  score: number
  stockSize: number
  discardPile: TCardState[]
  hintCount: number
  woundCount: number
  table: TTableState
  turnNumber: number
  inTurn: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  players: TPlayerState[]
  timestamp: string // ISO string
}
interface TTurn {
  status: TGameStatus
  action: TResolvedActionState
  score: number
  stockSize: number
  discardPile: Pile
  hintCount: number
  woundCount: number
  table: Table
  turnNumber: number
  inTurn: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  players: Player[]
  timestamp: string // ISO string
}
class Turn {
  status: TGameStatus
  action: TResolvedActionState
  score: number
  stockSize: number
  discardPile: Pile
  hintCount: number
  woundCount: number
  table: Table
  turnNumber: number
  inTurn: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  players: Player[]
  timestamp: string // ISO string

  constructor(t: TTurn) {
    this.status = t.status
    this.action = t.action
    this.score = t.score
    this.stockSize = t.stockSize
    this.discardPile = t.discardPile
    this.hintCount = t.hintCount
    this.woundCount = t.woundCount
    this.table = t.table
    this.turnNumber = t.turnNumber
    this.inTurn = t.inTurn
    this.turnsLeft = t.turnsLeft
    this.players = t.players
    this.timestamp = t.timestamp
  }
}
//   constructor({status,action,score,stockSize,hintCount,woundCount,table,turn,inTurn,turnsLeft,players,timestamp}) {

export class Game {
  stock: Pile
  discardPile: Pile
  hintCount: number = 9
  woundCount: number = 0
  turnNumber: number = -1
  turnsLeft: number = Infinity
  table: Table
  turns: Turn[] = []
  status: TGameStatus = 'RUNNING'
  players: Player[]
  playersById: {[id: string]: Player}

  constructor(
    playerNames: string[],
    {deck, discardPile, table}: {deck?: Pile; discardPile?: Pile; table?: Table} = {},
  ) {
    this.table = table || new Table()
    if (deck) {
      this.stock = deck
    } else {
      this.stock = new Pile(deck || Card.getFullDeck())
      this.stock.shuffle()
    }
    this.discardPile = discardPile || new Pile([])

    const handSize: number = {
      '2': 5,
      '3': 5,
      '4': 4,
      '5': 4,
    }['' + playerNames.length]

    if (!handSize) {
      throw new Error('INVALID_NUMBER_OF_PLAYERS')
    }

    this.players = playerNames.map((name, idx) => new Player(name, idx, new Hand([])))
    for (let i = 0; i < handSize; i++) {
      for (let p = 0; p < playerNames.length; p++) {
        this.players[p].hand.dealOne(this.stock.drawOne())
      }
    }

    this.playersById = Object.fromEntries(this.players.map(p => [p.id, p]))

    this.addTurn({type: 'START'})

    this.checkIntegrity()
  }

  get inTurn() {
    return this.turnNumber % this.players.length
  }

  get score() {
    return this.table.getScore()
  }

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TTurnState {
    return this.getCompleteState(playerId).slice(-1)[0]
  }
  // this returns information that is public for a player
  getCompleteState(playerId: TPlayerId): TTurnState[] {
    if (!this.playersById[playerId]) {
      throw new SyntaxError('INVALID_PLAYER_ID', playerId)
    }

    // hide my cards
    const ret = JSON.parse(JSON.stringify(this.turns)) as TTurnState[]
    for (const t of ret) {
      t.players[this.playersById[playerId].idx].mysteryHandCards = []
    }

    return ret
  }

  checkIntegrity() {
    // check that we have the correct set of cards
    const currentCards = [
      ...this.stock.cards,
      ...this.discardPile.cards,
      ...this.players.flatMap(p => p.hand.cards),
      ...Object.values(this.table.table)
        .map(p => p.cards)
        .flat(),
    ]
      .map(c => c.toString())
      .sort()
      .join(' ')

    const expectedCards = Card.getFullDeck()
      .map(c => c.toString())
      .sort()
      .join(' ')

    if (currentCards !== expectedCards) {
      console.warn('INTEGRITY_ERROR:', currentCards)

      throw new Error('INTEGRITY_ERROR')
    }
  }

  _getCurrentPlayer(playerId: string): Player {
    const me = this.players[this.inTurn]
    if (!me) {
      throw new GameError('NO_SUCH_PLAYER', {playerId})
    }
    if (playerId !== me.id) {
      throw new GameError('NOT_MY_TURN', {playerId})
    }
    return me
  }

  // ACTIONS
  act(playerId: string, actionParams: TPlayableActionParams) {
    // console.warn('ACT', this.turn, actionParams)
    if (this.status !== 'RUNNING') {
      throw new GameError('GAME_ENDED')
    }

    const me = this._getCurrentPlayer(playerId)
    if (actionParams.type === 'HINT') {
      if (!this.hintCount) {
        throw new GameError('NO_HINTS_LEFT')
      }
      this.hintCount--
      const hintee = this.players[actionParams.toPlayerIdx]
      if (!hintee) {
        throw new GameError('NO_SUCH_PLAYER', actionParams.toPlayerIdx)
      }
      if (hintee === me) {
        throw new GameError('CANNOT_HINT_SELF')
      }

      hintee.hand.addHint({turnNumber: this.turnNumber, is: actionParams.is})

      this.addTurn(actionParams)
    } else {
      const card = me.hand.take(actionParams.cardIdx, this.stock)
      // console.warn(222, card)

      if (actionParams.type === 'PLAY') {
        const success: boolean = this.table.play(card)
        if (success) {
          // Successful play:
          if (card.num === 5 && this.hintCount < 9) {
            this.hintCount++
          }
          if (this.score === AllColors.length * AllNums.length) {
            this.status = 'FINISHED'
          }
        } else {
          // fail: add wound
          this.discardPile.add(card) // TODO: add metadata?
          this.woundCount++
          // TODO: log
          if (this.woundCount === 3) {
            this.status = 'GAMEOVER'
          }
        }
        this.addTurn({...actionParams, card: card.toJSON()})
      } else if (actionParams.type === 'DISCARD') {
        this.discardPile.add(card)
        this.addTurn({...actionParams, card: card.toJSON()})
      }
    }
  }
  addTurn(action: TResolvedActionState) {
    this.turnNumber++
    this.turnsLeft--
    if (this.turnsLeft === 0) {
      // TODO: check if off-by-one
      this.status = 'FINISHED'
    } else if (!this.stock.size && this.turnsLeft === null) {
      // countdown should start now
      this.turnsLeft = this.players.length
    }

    //const players = this.players.map(p => p.getState())

    for (const p of this.players) {
      demystify(
        p.mysteryHandCards,
        [this.discardPile.cards, Object.values(this.table.table).flatMap(p => p.cards)].flat(),
      )
    }

    this.turns.push(
      new Turn({
        action,
        timestamp: new Date().toISOString(),
        stockSize: this.stock.size,
        discardPile: this.discardPile,
        hintCount: this.hintCount,
        woundCount: this.woundCount,
        turnNumber: this.turnNumber,
        inTurn: this.inTurn,
        turnsLeft: this.turnsLeft,
        table: this.table,
        score: this.score,
        status: this.status,
        players: this.players,
      }),
    )

    this.checkIntegrity()
  }
}
