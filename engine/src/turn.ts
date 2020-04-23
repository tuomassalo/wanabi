import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {MaskedCard, Card, AllColors, AllNums} from './card'
import {Hand, TMaskedPlayerViewState, MaskedPlayerView} from './hand'
import {
  TTurnState,
  TMaskedTurnState,
  TResolvedActionState,
  TBaseTurnState,
  TRefinedMaskedTurnState,
  TGameStatus,
  TActionParams,
} from './game'
import {Table} from './table'
import {resolveActionability} from './actionability-resolver'
import {demystify} from './demystifier'
import {GameError} from './errors'

function refineHand(turn: MaskedTurn, getMaskedHandIdx: number): MaskedCard[] {
  // NB: turn does not include own hand cards that are resolved
  const getRevealedCards = (...excludePlayerIndices: number[]): Card[] =>
    [
      // discard pile
      turn.discardPile.cards,
      // table
      turn.table.getCards(),
      // hands of other players
      turn.maskedPlayerViews.filter((_, idx) => !excludePlayerIndices.includes(idx)).flatMap(mh => mh.hand),
    ].flat()

  const meIdx = turn.maskedPlayerViews.findIndex(mh => mh.isMe) as number
  const {hand} = turn.maskedPlayerViews[getMaskedHandIdx]

  const [myDemystifiedHand, myCardsRevealedToMe] = demystify(
    turn.maskedPlayerViews[meIdx].hand.map(c => new MaskedCard({hints: c.hints})), // remove all existing derived information
    getRevealedCards(meIdx),
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
  _players: Player[]

  constructor(t: TBaseTurnState, players: TPlayerState[]) {
    this.status = t.status
    this.action = t.action
    this.discardPile = new Pile(t.discardPile.map(c => Card.fromValueString(c)))
    this.hintCount = t.hintCount
    this.woundCount = t.woundCount
    this.table = new Table(t.table)
    this.turnNumber = t.turnNumber
    this.turnsLeft = typeof t.turnsLeft !== 'undefined' ? t.turnsLeft : null
    this.timestamp = t.timestamp || new Date().toISOString()

    this._players = players.map(p => new Player(p))
  }
  get score() {
    return this.table.getScore()
  }
}
export class MaskedTurn extends BaseTurn {
  maskedPlayerViews: MaskedPlayerView[]
  stockSize: number
  constructor(state: TMaskedTurnState, players: TPlayerState[]) {
    super(state, players)
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
    return ret
  }
}

export class Turn extends BaseTurn {
  hands: Hand[]
  stock: Pile
  constructor(t: TTurnState, players: TPlayerState[]) {
    super(t, players)
    this.hands = t.hands.map(p => new Hand(p))
    this.stock = new Pile(t.stock)
  }
  clone() {
    // make a deep copy
    return new Turn(JSON.parse(JSON.stringify(this.toJSON())), this._players)
  }
  get inTurn() {
    return this.turnNumber % this._players.length
  }
  toJSON(): TTurnState {
    return {
      ...this,
      _players: undefined,
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
  playAction(playerId: string, actionParams: TActionParams): Turn {
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
        const success: boolean = newTurn.table.play(card)
        if (success) {
          // Successful play:
          if (card.num === 5 && newTurn.hintCount < 8) {
            newTurn.hintCount++
          }
          if (newTurn.score === AllColors.length * AllNums.length) {
            newTurn.status = 'FINISHED'
          }
        } else {
          // fail: add wound
          newTurn.discardPile.add(card) // TODO: add metadata?
          newTurn.woundCount++
          // TODO: log
          if (newTurn.woundCount === 3) {
            newTurn.status = 'GAMEOVER'
          }
        }
        newTurn.action = {...actionParams, card: card.toJSON(), success}
      } else if (actionParams.type === 'DISCARD') {
        newTurn.discardPile.add(card)
        if (newTurn.hintCount < 8) newTurn.hintCount++
        newTurn.action = {...actionParams, card: card.toJSON()}
      }
    }

    // actually change the turn:

    newTurn.timestamp = new Date().toISOString()

    newTurn.turnNumber++
    if (newTurn.turnsLeft !== null) newTurn.turnsLeft--
    if (newTurn.turnsLeft === 0) {
      // TODO: check if off-by-one
      newTurn.status = 'FINISHED'
    } else if (!newTurn.stock.size && newTurn.turnsLeft === null) {
      // countdown should start now
      newTurn.turnsLeft = newTurn._players.length
    }

    return newTurn
  }
}
