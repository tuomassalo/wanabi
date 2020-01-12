import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {Card, TColor, TNum, AllColors, AllNums, TCardState, MyHandCard} from './card'
import {Hand} from './hand'
import {Table, TTableState} from './table'
import {SyntaxError, GameError} from './errors'
import {demystify} from './demystifier'

type TGameStatus = 'WAITING_FOR_PLAYERS' | 'RUNNING' | 'GAMEOVER' | 'FINISHED'

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

//  json object
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
  discardPile: Pile
  hintCount: number
  woundCount: number
  table: Table
  turnNumber: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  players: Player[]
  timestamp?: string // ISO string
  // not in TTurnState:
  stock: Pile
  // not needed, as these are calculated from above:
  // score: number
  // stockSize: number
  // inTurn: number
}
class Turn {
  status: TGameStatus
  action: TResolvedActionState
  discardPile: Pile
  hintCount: number
  woundCount: number
  table: Table
  turnNumber: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  players: Player[]
  timestamp: string // ISO string
  stock: Pile

  constructor(t: TTurn) {
    this.status = t.status
    this.action = t.action
    this.discardPile = t.discardPile
    this.hintCount = t.hintCount
    this.woundCount = t.woundCount
    this.table = t.table
    this.turnNumber = t.turnNumber
    this.turnsLeft = t.turnsLeft
    this.players = t.players
    this.timestamp = t.timestamp || new Date().toISOString()
    this.stock = t.stock
  }
  clone() {
    // TODO: use JSON to make a deep copy
    return new Turn(this)
  }

  get score() {
    return this.table.getScore()
  }
  get stockSize() {
    return this.stock.cards.length
  }
  get inTurn() {
    return this.turnNumber % this.players.length
  }

  getState(forPlayerId: TPlayerId) {
    return {
      ...JSON.parse(JSON.stringify(this)),
      stock: undefined,
      stockSize: this.stock.size,
      inTurn: this.inTurn,
      score: this.score,
      players: this.players.map(p => p.serialize(p.id === forPlayerId)),
    }
  }

  // serialize() {
  //   return {
  //     ...JSON.parse(JSON.stringify(this)),
  //   }
  // }

  // ACTIONS
  playNext(playerId: string, actionParams: TActionParams) {
    // console.warn(1234, {
    //   type: actionParams.type,
    //   playerId,
    //   inTurn: this.inTurn,
    //   players: this.players,
    //   turnNumber: this.turnNumber,
    // })

    // get current player
    const me: Player = this.players[this.inTurn]
    if (!me) {
      throw new GameError('NO_SUCH_PLAYER', {playerId})
    }
    if (playerId !== me.id) {
      throw new GameError('NOT_MY_TURN', {playerId})
    }

    if (this.status !== 'RUNNING') {
      throw new GameError('GAME_ENDED')
    }

    const nextTurn = this.clone()

    if (actionParams.type === 'START') {
      if (this.turnNumber > 0) {
        throw new GameError('ALREADY_STARTED')
      }
      nextTurn.action = actionParams
    } else if (actionParams.type === 'HINT') {
      if (!nextTurn.hintCount) {
        throw new GameError('NO_HINTS_LEFT')
      }
      nextTurn.hintCount--

      const hintee = nextTurn.players[actionParams.toPlayerIdx]
      if (!hintee) {
        throw new GameError('NO_SUCH_PLAYER', actionParams.toPlayerIdx)
      }
      if (hintee === me) {
        throw new GameError('CANNOT_HINT_SELF')
      }

      hintee.hand.addHint({turnNumber: nextTurn.turnNumber, is: actionParams.is})

      nextTurn.action = actionParams
    } else {
      const card = me.hand.take(actionParams.cardIdx, nextTurn.stock)

      if (actionParams.type === 'PLAY') {
        const success: boolean = nextTurn.table.play(card)
        if (success) {
          // Successful play:
          if (card.num === 5 && nextTurn.hintCount < 9) {
            nextTurn.hintCount++
          }
          if (nextTurn.score === AllColors.length * AllNums.length) {
            nextTurn.status = 'FINISHED'
          }
        } else {
          // fail: add wound
          nextTurn.discardPile.add(card) // TODO: add metadata?
          nextTurn.woundCount++
          // TODO: log
          if (nextTurn.woundCount === 3) {
            nextTurn.status = 'GAMEOVER'
          }
        }
        nextTurn.action = {...actionParams, card: card.toJSON()}
      } else if (actionParams.type === 'DISCARD') {
        nextTurn.discardPile.add(card)
        nextTurn.action = {...actionParams, card: card.toJSON()}
      }
    }

    // actually change the turn:

    nextTurn.timestamp = new Date().toISOString()

    nextTurn.turnNumber++
    if (nextTurn.turnsLeft !== null) nextTurn.turnsLeft--
    if (nextTurn.turnsLeft === 0) {
      // TODO: check if off-by-one
      nextTurn.status = 'FINISHED'
    } else if (!nextTurn.stock.size && nextTurn.turnsLeft === null) {
      // countdown should start now
      nextTurn.turnsLeft = nextTurn.players.length
    }

    for (const p of nextTurn.players) {
      p.clearMysteryHandCards()
      p.setMysteryHandCards(
        demystify(
          p.getMysteryHandCards(),
          [nextTurn.discardPile.cards, Object.values(nextTurn.table.table).flatMap(p => p.cards)].flat(),
        ),
      )
    }

    return nextTurn
  }
}

export class Game {
  turns: Turn[] = []
  playersById: {[id: string]: Player}

  constructor(
    playerNames: string[],
    {deck, discardPile, table}: {deck?: Pile; discardPile?: Pile; table?: Table} = {},
  ) {
    if (!deck) {
      deck = new Pile(deck || Card.getFullDeck())
      deck.shuffle()
    }

    const handSize: number = {
      '2': 5,
      '3': 5,
      '4': 4,
      '5': 4,
    }['' + playerNames.length]

    if (!handSize) {
      throw new Error('INVALID_NUMBER_OF_PLAYERS')
    }

    this.turns.push(
      new Turn({
        table: table || new Table(),
        stock: deck,
        discardPile: discardPile || new Pile([]),
        players: playerNames.map((name, idx) => new Player(name, idx, new Hand([]))),
        hintCount: 9,
        woundCount: 0,
        turnNumber: 0,
        turnsLeft: null,
        status: 'RUNNING',
        action: {type: 'START'},
      }),
    )

    for (let i = 0; i < handSize; i++) {
      for (let p = 0; p < playerNames.length; p++) {
        this.currentTurn.players[p].hand.dealOne(this.currentTurn.stock.drawOne())
      }
    }

    this.playersById = Object.fromEntries(this.currentTurn.players.map(p => [p.id, p]))

    this.checkIntegrity()
  }

  get currentTurn(): Turn {
    return this.turns[this.turns.length - 1]
  }
  get players(): Player[] {
    return this.currentTurn.players
  }

  act(playerId: TPlayerId, actionParams: TPlayableActionParams) {
    this.turns.push(this.currentTurn.playNext(playerId, actionParams))
    this.checkIntegrity()
  }

  // TODO:
  // static deserialize(turns: TTurnState[]) {}

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TTurnState {
    return this.getCompleteState(playerId).slice(-1)[0]
  }
  // this returns information that is public for a player
  getCompleteState(playerId: TPlayerId): TTurnState[] {
    if (!this.playersById[playerId]) {
      throw new SyntaxError('INVALID_PLAYER_ID', playerId)
    }

    const ret = JSON.parse(JSON.stringify(this.turns.map(t => t.getState(playerId)))) as TTurnState[]

    return ret
  }

  checkIntegrity() {
    // check that we have the correct set of cards
    const currentCards = [
      ...this.currentTurn.stock.cards,
      ...this.currentTurn.discardPile.cards,
      ...this.currentTurn.players.flatMap(p => p.hand.cards),
      ...Object.values(this.currentTurn.table.table)
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
}
