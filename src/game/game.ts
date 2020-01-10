import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {Card, TCardState, TColor, TNum, AllColors, AllNums} from './card'
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

// added by the constructor
interface TResolvedStartAction extends TStartActionParams {}
interface TResolvedPlayAction extends TPlayActionParams {
  card: TCardState
}
interface TResolvedDiscardAction extends TDiscardActionParams {
  card: TCardState
}
interface TResolvedHintAction extends THintActionParams {}

type TResolvedAction = TResolvedPlayAction | TResolvedDiscardAction | TResolvedHintAction | TResolvedStartAction

interface TTurnState {
  status: TGameStatus
  action: TResolvedAction
  score: number
  stockSize: number
  discardPile: TCardState[]
  hintCount: number
  woundCount: number
  table: TTableState
  turn: number
  inTurn: number
  turnsLeft: number | null // NB: can be Infinity, which turns to null in JSON
  players: TPlayerState[]
  timestamp: string // ISO string
}

export class Game {
  stock: Pile
  discardPile: Pile
  hintCount: number = 9
  woundCount: number = 0
  turn: number = -1
  turnsLeft: number = Infinity
  table: Table
  log: TTurnState[] = []
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

    const handSize = {
      2: 5,
      3: 5,
      4: 4,
      5: 4,
    }[playerNames.length]

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
    return this.turn % this.players.length
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

    // // copy the latest turn from the log
    // const turn: TTurnState = JSON.parse(JSON.stringify(this.log[this.log.length - 1]))

    return this.log.map(turn => ({
      ...turn,
      players: turn.players.map(p =>
        p.idx === this.playersById[playerId].idx ? {...p, isMe: true, completeHand: []} : p,
      ),
    }))

    // demystify(
    //   (state.players.find(p => p.isMe) as TPlayerState).hand, // yes yes, it's never undefined
    //   [this.discardPile.cards, Object.values(this.table.table).flatMap(p => p.cards)].flat(),
    // )
    // return state
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

      hintee.hand.addHint({turn: this.turn, is: actionParams.is})

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
        this.addTurn({...actionParams, card: card.getState()})
      } else if (actionParams.type === 'DISCARD') {
        this.discardPile.add(card)
        this.addTurn({...actionParams, card: card.getState()})
      }
    }
  }
  addTurn(action: TResolvedAction) {
    this.turn++
    this.turnsLeft--
    if (this.turnsLeft === 0) {
      // TODO: check if off-by-one
      this.status = 'FINISHED'
    } else if (!this.stock.size && this.turnsLeft === Infinity) {
      // countdown should start now
      this.turnsLeft = this.players.length
    }

    const players = this.players.map(p => p.getState())

    for (const p of players) {
      demystify(p.mysteryHand, [this.discardPile.cards, Object.values(this.table.table).flatMap(p => p.cards)].flat())
    }

    this.log.push({
      action,
      timestamp: new Date().toISOString(),
      stockSize: this.stock.size,
      discardPile: this.discardPile.getState(),
      hintCount: this.hintCount,
      woundCount: this.woundCount,
      turn: this.turn,
      inTurn: this.inTurn,
      turnsLeft: this.turnsLeft === Infinity ? null : this.turnsLeft,
      table: this.table.getState(),
      score: this.score,
      status: this.status,
      players,
    })

    this.checkIntegrity()
  }
}
