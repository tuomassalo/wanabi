import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState, TPlayerHandViewState, PlayerHandView} from './player'
import {Card, TColor, TNum, AllColors, AllNums, TCardValueState, MaskedCard} from './card'
import {Hand, THandState} from './hand'
import {Table, TTableState} from './table'
import {GameError} from './errors'
import {randomBytes} from 'crypto'
import {resolveActionability} from './actionability-resolver'
import {demystify} from './demystifier'

type TGameStatus = 'WAITING_FOR_PLAYERS' | 'RUNNING' | 'GAMEOVER' | 'FINISHED'
export type TGameId = string

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
  card: TCardValueState
  success: boolean
}
interface TResolvedDiscardActionState extends TDiscardActionParams {
  card: TCardValueState
}
export interface TResolvedHintActionState extends THintActionParams {
  // for convenience
  toPlayerName: string
  matches: boolean[] // which cards (indices) match the hint
}

export type TResolvedActionState =
  | TResolvedPlayActionState
  | TResolvedDiscardActionState
  | TResolvedHintActionState
  | TResolvedStartActionState

//  json object
export interface TBaseTurnState {
  status: TGameStatus
  action: TResolvedActionState
  score: number
  stockSize: number
  discardPile: TCardValueState[]
  hintCount: number
  woundCount: number
  table: TTableState
  turnNumber: number
  inTurn: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  timestamp: string // ISO string
}
export interface TTurnState extends TBaseTurnState {
  completePlayerHands: THandState[]
  stock: TCardValueState[] // empty if is masked
}
export interface TMaskedTurnState extends TBaseTurnState {
  playerHandViews: TPlayerHandViewState[]
}

export interface WS_getGamesStateParams {}
export interface WS_getGameStateParams {
  gameId: TGameId
}
export interface WS_createGameParams {
  firstPlayerName: string
}
export interface WS_startGameParams {
  gameId: TGameId
}
export interface WS_joinGameParams {
  gameId: TGameId
  newPlayerName: string
}
export interface WS_rejoinGameParams {
  gameId: TGameId
  playerIdx: number
}
export interface WS_actParams {
  gameId: TGameId
  actionParams: TPlayableActionParams
}
export interface TMaskedGameState {
  history: {
    revealedOtherPlayerCards: TCardValueState[]
    playedActions: {timestamp: string; action: TResolvedActionState}[]
  }
  gameId: TGameId
  players: (TPlayerState | TPlayerState)[]
  currentTurn: TMaskedTurnState
}
export interface TCompleteGameState {
  turn0: TTurnState
  seed: string
  initialDeck: TCardValueState[]
  gameId: TGameId
  playedActions: {timestamp: string; action: TResolvedActionState}[]
  players: TPlayerState[]
  timestamp: string
}

export interface M_GamesState {
  msg: 'M_GamesState'
  timestamp: string
  games: TMaskedGameState[] // latest turn and history of each game
}
// interface M_GameState {
//   msg: 'M_GameState'
//   timestamp: string
//   currentTurn: TMaskedTurnState
// }

export type WebsocketServerMessage = M_GamesState // | M_GameState

abstract class BaseTurn {
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
export class Turn extends BaseTurn {
  completePlayerHands: Hand[]
  stock: Pile

  constructor(t: TTurnState, players: TPlayerState[]) {
    super(t, players)
    this.completePlayerHands = t.completePlayerHands.map(p => new Hand(p))
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
      _players: undefined, // not wanted
      stock: this.stock.toJSON(),
      discardPile: this.discardPile.toJSON(),
      table: this.table.toJSON(),
      completePlayerHands: this.completePlayerHands.map(p => p.toJSON()),
    }
  }
  get stockSize() {
    return this.stock.cards.length
  }

  _getPlayerHandViewStates(meIdx: number) {
    const myHand = this.completePlayerHands[meIdx]
    // NB: this does not include own hand cards that are resolved
    const getRevealedCards = (...excludePlayerIndices: number[]) =>
      [
        // discard pile
        this.discardPile.cards,
        // table
        Object.values(this.table.table).flatMap(pile => pile.cards),
        // hands of other players
        this._players
          .filter(p => !excludePlayerIndices.includes(p.idx))
          .flatMap(p => this.completePlayerHands[p.idx].cards.map(hc => new Card(hc))),
      ].flat()

    const [myDemystifiedHand, myCardsRevealedToMe] = demystify(
      myHand.cards.map(c => new MaskedCard({hints: c.hints})),
      getRevealedCards(meIdx),
    )

    const demystifyOtherHand = (ch: Hand, playerIdx: number) => {
      return demystify(
        ch.cards.map(c => new MaskedCard({hints: c.hints})),
        [...myCardsRevealedToMe, ...getRevealedCards(meIdx, playerIdx)],
      )[0]
    }

    return this.completePlayerHands.map((ch, idx) =>
      new PlayerHandView(
        ch === myHand
          ? {
              isMe: true,
              hand: resolveActionability(myDemystifiedHand, this.table, this.discardPile),
            }
          : {
              isMe: false,
              hand: resolveActionability(
                ch.cards.map(c => new MaskedCard({color: c.color, num: c.num, hints: c.hints})),
                this.table,
                this.discardPile,
              ),
              extraMysticalHand: resolveActionability(demystifyOtherHand(ch, idx), this.table, this.discardPile),
            },
      ).toJSON(),
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
        completePlayerHands: undefined,
        stock: undefined,
        ///
        stockSize: this.stock.size,
        inTurn: this.inTurn,
        score: this.score,
        playerHandViews: isOutsider
          ? [] // this.players.map(p => MaskedPlayer.outsiderFromPlayer(p))
          : this._getPlayerHandViewStates((me as Player).idx),
      }),
    )
  }
}
export class MaskedTurn extends BaseTurn {
  playerHandViews: PlayerHandView[]
  stockSize: number
  constructor(state: TMaskedTurnState, players: TPlayerState[]) {
    super(state, players)
    this.playerHandViews = state.playerHandViews.map(p => new PlayerHandView(p))
    this.stockSize = state.stockSize
  }
  get inTurn() {
    return this.turnNumber % this._players.length
  }
}

export interface TExistingGameConstructor {
  from: 'SERIALIZED_GAME'
  game: TCompleteGameState
}
export interface TNewGameConstructor {
  from: 'NEW_TEST_GAME'
  playerNames: string[]
  deck?: Pile
  discardPile?: Pile
  table?: Table
}

// export class MaskedGame {
//   gameId: TGameId
//   players: Player[]
//   currentTurn: MaskedTurn
//   constructor(maskedGameState: TMaskedGameState) {
//     this.gameId = maskedGameState.gameId
//     this.players = maskedGameState.players.map(p => new Player({...p, id: 'REDACTED'}))
//     this.currentTurn = new MaskedTurn(maskedGameState.currentTurn, maskedGameState.players)
//   }
// }

const defaultTurn0Properties = {
  table: new Table().toJSON(),
  stock: new Pile([]).toJSON(),
  discardPile: new Pile([]).toJSON(),
  completePlayerHands: [[]], // one empty hand, no hand cards yet
  hintCount: 9,
  woundCount: 0,
  turnNumber: 0,
  turnsLeft: null,
  // needed only for TypeScript
  score: 0,
  stockSize: 0,
  inTurn: 0,
}

export class Game {
  turns: Turn[] = []
  gameId: TGameId
  seed: string
  players: Player[]
  playersById: {[id: string]: Player}
  initialDeck: string[]

  replay(playedActions: {timestamp: string; action: TResolvedActionState}[]) {
    const resolvedActionToActionParams = (a: TResolvedActionState): TActionParams => {
      if (a.type === 'PLAY') {
        return {type: a.type, cardIdx: a.cardIdx}
      } else if (a.type === 'DISCARD') {
        return {type: a.type, cardIdx: a.cardIdx}
      } else if (a.type === 'HINT') {
        return {type: a.type, toPlayerIdx: a.toPlayerIdx, is: a.is}
      } else {
        return {type: a.type} // START
      }
    }

    for (const [turnNumber, {action, timestamp}] of playedActions.entries()) {
      const actionParams = resolvedActionToActionParams(action)
      if (actionParams.type !== 'START') {
        // console.warn('ACTING', actionParams, turnNumber)
        const playerIdx = (turnNumber - 1) % this.currentTurn._players.length
        if (action.type === 'PLAY' || action.type === 'DISCARD') {
          this.currentTurn.completePlayerHands[playerIdx].cards[action.cardIdx] = new Card(action.card)
        } else if (action.type === 'HINT') {
        }
        this.act(this.currentTurn._players[playerIdx].id, actionParams, action)
      }
      this.currentTurn.timestamp = timestamp // fix timestamp
    }
  }
  // deal the cards
  deal() {
    const turn = this.currentTurn
    const handSize: number = Game.getHandSize(this.players.length)
    for (let i = 0; i < handSize; i++) {
      for (let p = 0; p < turn.completePlayerHands.length; p++) {
        turn.completePlayerHands[p].dealOne(turn.stock.drawOne())
      }
    }
  }

  dealAndReplay(playedActions: TCompleteGameState['playedActions']) {
    if (this.currentTurn.status === 'RUNNING' && this.currentTurn.completePlayerHands[0].cards.length === 0) {
      this.deal()
    }
    this.replay(playedActions)
  }

  constructor(params: TNewGameConstructor | TExistingGameConstructor) {
    if (params.from === 'SERIALIZED_GAME') {
      // deserialize an ongoing game
      this.gameId = params.game.gameId
      this.seed = params.game.seed
      this.players = params.game.players.map(p => new Player(p))
      this.turns = [new Turn(params.game.turn0, params.game.players)]

      this.initialDeck = params.game.initialDeck

      this.dealAndReplay(params.game.playedActions)
    } else if (params.from === 'NEW_TEST_GAME') {
      // USED IN TESTS
      // set up a new game
      this.seed = randomBytes(20).toString('hex')
      let {playerNames, deck, discardPile, table} = params
      if (!deck) {
        deck = new Pile(deck || Card.getFullDeck())
        deck.shuffle(this.seed)
      }
      this.initialDeck = deck.toJSON()

      this.gameId = randomBytes(20).toString('hex')

      this.players = playerNames.map((name, idx) => new Player({name, idx, id: `bogus_id_${name}`, isConnected: true}))

      this.turns = [
        new Turn(
          {
            ...defaultTurn0Properties,
            table: new Table(table ? table.toJSON() : undefined).toJSON(),
            stock: deck.toJSON(),
            discardPile: (discardPile || new Pile([])).toJSON(),
            completePlayerHands: playerNames.map(() => []),
            status: 'RUNNING',
            action: {type: 'START'},
            // needed only for typescript
            score: 0,
            inTurn: 0,
            timestamp: new Date().toISOString(),
            stockSize: deck.size,
          },
          this.players,
        ),
      ]

      this.deal()
    } else {
      throw new Error("Invalid 'from'")
    }

    this.playersById = Object.fromEntries(this.currentTurn._players.map(p => [p.id, p]))

    this.checkIntegrity()
  }

  get currentTurn(): Turn {
    return this.turns[this.turns.length - 1]
  }
  // get players(): Player[] {
  //   return this.currentTurn.players
  // }

  static getHandSize(playerCnt: number): number {
    const handSize = {
      '2': 5,
      '3': 5,
      '4': 4,
      '5': 4,
    }['' + playerCnt]

    if (!handSize) {
      throw new Error('INVALID_NUMBER_OF_PLAYERS')
    }
    return handSize
  }

  static createPendingGame(firstPlayerName: string, firstPlayerId: TPlayerId): Game {
    const timestamp = new Date().toISOString()
    const seed = randomBytes(20).toString('hex')
    const stock = new Pile(Card.getFullDeck()).shuffle(seed).toJSON()

    return new Game({
      from: 'SERIALIZED_GAME',
      game: {
        gameId: randomBytes(20).toString('hex'),
        initialDeck: stock,
        seed,
        turn0: {
          ...defaultTurn0Properties,
          stock,
          status: 'WAITING_FOR_PLAYERS',
          action: {type: 'START'},
          timestamp,
        },
        players: [
          new Player({
            name: firstPlayerName,
            idx: 0,
            id: firstPlayerId,
            isConnected: true,
          }).toJSON(),
        ],
        playedActions: [],
        timestamp,
      },
    })
  }

  static joinPendingGame(pendingGame: Game, newPlayerName: string, newPlayerId: TPlayerId): Game {
    if (pendingGame.currentTurn._players.length >= 5) throw new GameError('GAME_FULL')

    pendingGame.players.push(
      new Player({
        name: newPlayerName,
        idx: pendingGame.currentTurn._players.length,
        id: newPlayerId,
        isConnected: true,
      }),
    )
    pendingGame.currentTurn.completePlayerHands.push(new Hand([]))

    return new Game({from: 'SERIALIZED_GAME', game: pendingGame.toJSON()})
  }
  static startPendingGame(pendingGame: Game): Game {
    const turn0 = pendingGame.turns[0]

    turn0.status = 'RUNNING'

    return new Game({from: 'SERIALIZED_GAME', game: pendingGame.toJSON()})
  }

  // returns complete game
  toJSON(): TCompleteGameState {
    return {
      gameId: this.gameId,
      seed: this.seed,
      initialDeck: this.initialDeck,
      turn0: this.turns[0].toJSON(),
      playedActions: this.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      timestamp: this.turns[this.turns.length - 1].timestamp,
      players: this.players.map(p => p.toJSON()),
    }
  }

  takeAndRefillHand(
    turn: Turn,
    playerIdx: number,
    cardIdx: number,
    resolvedAction?: TResolvedPlayActionState | TResolvedDiscardActionState,
  ) {
    return turn.completePlayerHands[playerIdx].take(cardIdx, turn.stock)
  }

  // ACTIONS
  playNext(playerId: string, actionParams: TActionParams, resolvedAction?: TResolvedActionState) {
    // console.warn(1234, {
    //   type: actionParams.type,
    //   playerId,
    //   inTurn: this.inTurn,
    //   players: this.players,
    //   turnNumber: this.turnNumber,
    // })

    const newTurn = this.currentTurn.clone()

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
      if (this.currentTurn.turnNumber > 0) {
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

      // If a resolved action was provided, this might be a masked game where we do not have accurate
      // information about hintee's cards. In that case, add the hints manually.
      if (resolvedAction) {
        for (const [cardIdx, result] of (resolvedAction as TResolvedHintActionState).matches.entries()) {
          newTurn.completePlayerHands[hintee.idx].cards[cardIdx].hints.push({
            turnNumber: newTurn.turnNumber,
            is: actionParams.is,
            result,
          })
        }
      } else {
        newTurn.completePlayerHands[hintee.idx].addHint({turnNumber: newTurn.turnNumber, is: actionParams.is})
      }

      newTurn.action = {
        ...actionParams,
        toPlayerName: hintee.name,
        matches: newTurn.completePlayerHands[hintee.idx].cards.map(c => c.hints[c.hints.length - 1].result),
      }
    } else {
      // PLAY or DISCARD
      const card = this.takeAndRefillHand(
        newTurn,
        me.idx,
        actionParams.cardIdx,
        resolvedAction as TResolvedPlayActionState | TResolvedDiscardActionState,
      )

      if (actionParams.type === 'PLAY') {
        const success: boolean = newTurn.table.play(card)
        if (success) {
          // Successful play:
          if (card.num === 5 && newTurn.hintCount < 9) {
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
        if (newTurn.hintCount < 9) newTurn.hintCount++
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

  act(playerId: TPlayerId, actionParams: TPlayableActionParams, resolvedAction?: TResolvedActionState) {
    // console.warn('ACT', {playerId, actionParams, inStock: this.currentTurn.stock.size})

    this.turns.push(this.playNext(playerId, actionParams, resolvedAction))
    this.checkIntegrity()
  }

  getTurnState(playerId: TPlayerId): TMaskedTurnState {
    return this.currentTurn.getState(playerId)
  }

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TMaskedGameState {
    const stock = [...this.initialDeck]
    const playerCnt = this.players.length
    const playerIdx = (this.players.find(p => p.id === playerId) as Player).idx

    // "deal" the initial hands and add all played cards by other players
    const revealedOtherPlayerCards: TCardValueState[] = []

    for (let i = 0; i < Game.getHandSize(playerCnt); i++) {
      for (const p of this.players) {
        const card = stock.pop() as TCardValueState
        if (playerId !== p.id) {
          revealedOtherPlayerCards.unshift(card)
        }
      }
    }

    for (const turn of this.turns) {
      if (turn.action.type === 'PLAY' || turn.action.type === 'DISCARD') {
        const card = stock.pop() as TCardValueState
        if ((turn.turnNumber - 1) % playerCnt !== playerIdx) {
          revealedOtherPlayerCards.unshift(card)
        }
      }
    }

    return {
      gameId: this.gameId,
      currentTurn: this.currentTurn.getState(playerId),
      history: {
        revealedOtherPlayerCards,
        playedActions: this.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      },
      players: this.players.map(p => ({...p.toJSON(), id: p.id === playerId ? p.id : 'REDACTED'})),
    }
  }

  checkIntegrity() {
    // if the game has not started yet, cards are not dealt.
    if (this.currentTurn.status === 'WAITING_FOR_PLAYERS') return

    // check that we have the correct set of cards
    const currentCards = [
      ...this.currentTurn.stock.cards,
      ...this.currentTurn.discardPile.cards,
      ...this.currentTurn.completePlayerHands.flatMap(ch => ch.cards.map(hc => new Card(hc))),
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

export class MaskedGame extends Game {
  revealedOtherPlayerCards: TCardValueState[]
  mePlayerIdx: number

  dealAndReplay(playedActions: any) {}

  // Do not deal from stock; deal unknowns to me,
  // and from this.revealedOtherPlayerCards to other players
  deal() {
    const turn = this.currentTurn
    const handSize: number = Game.getHandSize(this.players.length)
    for (let i = 0; i < handSize; i++) {
      for (let p = 0; p < turn.completePlayerHands.length; p++) {
        turn.completePlayerHands[p].dealOne(
          new Card(p === this.mePlayerIdx ? 'X5' : (this.revealedOtherPlayerCards.pop() as TCardValueState)),
        )
      }
    }
    // console.warn(333, ...turn.completePlayerHands)
  }

  constructor(maskedGame: TMaskedGameState) {
    // fake a stock of correct size
    const fullStockSize = Card.getFullDeck().length
    const playerCnt = maskedGame.players.length
    const stock = Array(fullStockSize - Game.getHandSize(playerCnt) * playerCnt).fill('X5')

    super({
      from: 'SERIALIZED_GAME',
      game: {
        gameId: maskedGame.gameId,
        playedActions: maskedGame.history.playedActions,
        timestamp: maskedGame.currentTurn.timestamp,
        seed: 'BOGUS',
        initialDeck: [],
        players: maskedGame.players.map(p => new Player({...p})),
        turn0: {
          ...defaultTurn0Properties,
          stock,
          completePlayerHands: maskedGame.players.map(() => []),
          status: 'RUNNING',
          action: {type: 'START'},
          timestamp: maskedGame.history.playedActions[0].timestamp,
        },
      },
    })
    this.mePlayerIdx = maskedGame.players.findIndex(p => p.id !== 'REDACTED')
    this.revealedOtherPlayerCards = maskedGame.history.revealedOtherPlayerCards

    this.deal()
    this.replay(maskedGame.history.playedActions)
  }

  takeAndRefillHand(
    turn: Turn,
    playerIdx: number,
    cardIdx: number,
    resolvedAction?: TResolvedPlayActionState | TResolvedDiscardActionState,
  ) {
    if (!resolvedAction) throw new Error('Should not happen')

    turn.stock.drawOne() // keep the fake stock size in sync
    if (playerIdx === this.mePlayerIdx) {
      return new Card(resolvedAction.card)
    } else {
      return turn.completePlayerHands[playerIdx].take(cardIdx, turn.stock)
    }
  }

  checkIntegrity() {
    // no integrity check for masked games
    return
  }
}
