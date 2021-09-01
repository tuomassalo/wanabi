import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {MaskedCard, Card, getAllColors, AllNums} from './card'
import {Hand, TMaskedPlayerViewState} from './hand'
import {
  TTurnState,
  TMaskedTurnState,
  TResolvedActionState,
  TBaseTurnState,
  TGameStatus,
  TActionParams,
  GameParams,
} from './game'
import {Table} from './table'
import {resolveActionability} from './actionability-resolver'
import {demystify} from './demystifier'
import {GameError} from './errors'
import {MaskedTurn} from './masked-turn'

export function refineHand(turn: MaskedTurn, getMaskedHandIdx: number): MaskedCard[] {
  // NB: turn does not include own hand cards that are resolved
  const getRevealedCards = (...excludePlayerIndices: number[]): Card[] =>
    [
      // discard pile
      turn.discardPile.cards,
      // table
      turn.table.getCards(),
      // hands of other players
      turn.maskedPlayerViews.filter((_, idx) => !excludePlayerIndices.includes(idx)).flatMap(mh => mh.hand),
    ].flat() as any // 'as any' as a tmp fix, TODO: check this later

  const meIdx = turn.maskedPlayerViews.findIndex(mh => mh.isMe) as number
  const {hand} = turn.maskedPlayerViews[getMaskedHandIdx]

  const [myDemystifiedHand, myCardsRevealedToMe] = demystify(
    turn.maskedPlayerViews[meIdx].hand.map(c => new MaskedCard({hints: c.hints})), // remove all existing derived information
    getRevealedCards(meIdx),
    turn._gameParams,
  )
  // console.warn('mDH', ...myDemystifiedHand)

  const demystifyOtherHand = () => {
    // console.warn(
    //   111,
    //   hand.map(c => c.hints),
    // )
    return demystify(
      hand.map(c => new MaskedCard({hints: c.hints})),
      [...myCardsRevealedToMe, ...getRevealedCards(meIdx, getMaskedHandIdx)],
      turn._gameParams,
    )[0]
  }

  if (turn.maskedPlayerViews[getMaskedHandIdx].isMe) {
    return resolveActionability(myDemystifiedHand, turn.table, turn.discardPile)
  } else {
    // mystery view
    return resolveActionability(demystifyOtherHand(), turn.table, turn.discardPile)
  }
}

export abstract class BaseTurn {
  status: TGameStatus
  action: TResolvedActionState
  discardPile: Pile
  hintCount: number
  woundCount: number
  table: Table
  turnNumber: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  timestamp: string // ISO string
  _gameParams: GameParams
  _players: Player[]

  constructor(t: TBaseTurnState, players: TPlayerState[], gameParams: GameParams) {
    this.status = t.status
    this.action = t.action
    this.discardPile = new Pile(t.discardPile.map(c => Card.fromValueString(c)))
    this.hintCount = t.hintCount
    this.woundCount = t.woundCount
    this.table = new Table(t.table, gameParams)
    this.turnNumber = t.turnNumber
    this._gameParams = gameParams
    this.turnsLeft = typeof t.turnsLeft !== 'undefined' ? t.turnsLeft : null
    this.timestamp = t.timestamp || new Date().toISOString()

    this._players = players.map(p => new Player(p))
  }
  get score() {
    return this.table.getScore()
  }
}
export class Turn extends BaseTurn {
  hands: Hand[]
  stock: Pile
  constructor(t: TTurnState, players: TPlayerState[], gameParams: GameParams) {
    super(t, players, gameParams)
    this.hands = t.hands.map(p => new Hand(p))
    this.stock = new Pile(t.stock)
  }
  clone() {
    // make a deep copy
    return new Turn(JSON.parse(JSON.stringify(this.toJSON())), this._players, this._gameParams)
  }
  get inTurn() {
    return this.turnNumber % this._players.length
  }
  toJSON(): TTurnState {
    return {
      ...this,
      _players: undefined,
      _gameParams: undefined,
      stock: this.stock.toJSON(),
      discardPile: this.discardPile.toJSON(),
      table: this.table.toJSON(),
      hands: this.hands.map(p => p.toJSON()),
    }
  }
  get stockSize() {
    return this.stock.cards.length
  }
  _getMaskedHands(meIdx: number): TMaskedPlayerViewState[] {
    // NB: this does not include own hand cards that are resolved
    return this.hands.map((ch, idx) =>
      idx === meIdx
        ? {
            isMe: true,
            hand: ch.cards.map(c => new MaskedCard({hints: c.hints})),
          }
        : {
            isMe: false,
            hand: ch.cards.map(c => new MaskedCard({color: c.color, num: c.num, hints: c.hints})),
          },
    )
  }
  getState(forPlayerId: TPlayerId): TMaskedTurnState {
    const me = this._players.find(p => p.id === forPlayerId)
    const isOutsider = !me
    return JSON.parse(
      JSON.stringify({
        ...this.toJSON(),
        /// remove these:
        _players: undefined,
        hands: undefined,
        stock: undefined,
        ///
        stockSize: this.stock.size,
        inTurn: this.inTurn,
        score: this.score,
        maskedPlayerViews: isOutsider
          ? [] // this.players.map(p => MaskedPlayer.outsiderFromPlayer(p))
          : this._getMaskedHands((me as Player).idx),
      }),
    )
  }
  playAction(playerId: string, actionParams: TActionParams, {maxHintCount, maxWoundCount}: GameParams): Turn {
    // console.warn(1234, {
    //   type: actionParams.type,
    //   playerId,
    //   inTurn: this.inTurn,
    //   players: this.players,
    //   turnNumber: this.turnNumber,
    // })

    const newTurn = this.clone()

    // get current player
    const me: Player = newTurn._players[newTurn.inTurn]
    if (!me) {
      throw new GameError('NO_SUCH_PLAYER', {playerId})
    }
    if (playerId !== me.id) {
      throw new GameError('NOT_MY_TURN', {playerId})
    }

    if (newTurn.status !== 'RUNNING') {
      // console.warn(nextTurn)
      throw new GameError('GAME_ENDED')
    }

    if (actionParams.type === 'START') {
      if (this.turnNumber > 0) {
        throw new GameError('ALREADY_STARTED')
      }
      newTurn.action = actionParams
    } else if (actionParams.type === 'HINT') {
      if (!['A', 'B', 'C', 'D', 'E', 1, 2, 3, 4, 5].includes(actionParams.is)) {
        throw new GameError('NO_HINTS_OUTSIDE_ABCDE12345')
      }
      if (!newTurn.hintCount) {
        throw new GameError('NO_HINTS_LEFT')
      }
      newTurn.hintCount--

      const hintee = newTurn._players[actionParams.toPlayerIdx]
      if (!hintee) {
        throw new GameError('NO_SUCH_PLAYER', actionParams.toPlayerIdx)
      }
      if (hintee === me) {
        throw new GameError('CANNOT_HINT_SELF')
      }

      newTurn.hands[hintee.idx].addHint({turnNumber: newTurn.turnNumber, is: actionParams.is})

      newTurn.action = {
        ...actionParams,
        toPlayerName: hintee.name,
        matches: newTurn.hands[hintee.idx].cards.map(c => c.hints[c.hints.length - 1].result),
      }
    } else {
      // PLAY or DISCARD
      const card = newTurn.hands[me.idx].take(actionParams.cardIdx, newTurn.stock)

      if (actionParams.type === 'PLAY') {
        const playResult = newTurn.table.play(card)
        if (playResult === 'SUCCESS_CLOSED') {
          if (newTurn.hintCount < maxHintCount) {
            newTurn.hintCount++
          }
          if (newTurn.score === getAllColors(this._gameParams).length * AllNums.length) {
            newTurn.status = 'FINISHED'
          }
        } else if (playResult === 'FAILURE') {
          // fail: add wound
          newTurn.discardPile.add(card) // TODO: add metadata?
          newTurn.woundCount++
          // TODO: log
          if (newTurn.woundCount === maxWoundCount) {
            newTurn.status = 'GAMEOVER'
          }
        }
        newTurn.action = {...actionParams, card: card.toJSON(), success: playResult !== 'FAILURE'}
      } else if (actionParams.type === 'DISCARD') {
        if (newTurn.hintCount === maxHintCount) {
          throw new GameError('CANNOT_DISCARDS_WHEN_MAX_HINTS')
        }
        newTurn.hintCount++
        newTurn.discardPile.add(card)
        newTurn.action = {...actionParams, card: card.toJSON()}
      }
    }

    // actually change the turn:

    newTurn.timestamp = new Date().toISOString()

    newTurn.turnNumber++
    if (newTurn.turnsLeft !== null) newTurn.turnsLeft--
    if (newTurn.turnsLeft === 0) {
      // NB: don't change a GAMEOVER (on the last possible turn) to FINISHED
      if (newTurn.status === 'RUNNING') {
        newTurn.status = 'FINISHED'
      }
    } else if (!newTurn.stock.size && newTurn.turnsLeft === null) {
      // countdown should start now
      newTurn.turnsLeft = newTurn._players.length
    }

    return newTurn
  }
}
