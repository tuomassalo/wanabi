import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState, TPlayerHandViewState, PlayerHandView, TMaskedPlayerState} from './player'
import {Card, TColor, TNum, AllColors, AllNums, TCardValueState, MaskedCard, TMaskedCardState} from './card'
import {Hand, THandState} from './hand'
import {Table, TTableState} from './table'
import {SyntaxError, GameError} from './errors'
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
}

export type TResolvedActionState =
  | TResolvedPlayActionState
  | TResolvedDiscardActionState
  | TResolvedHintActionState
  | TResolvedStartActionState

// type TMaskedPlayerState = TMaskedMePlayerState | TMaskedOtherPlayerState

//  json object
export interface TBaseTurnState {
  // gameId: TGameId
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
  seed: string
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
    revealedStock: TCardValueState[]
    playedActions: {timestamp: string; action: TResolvedActionState}[]
  }
  gameId: TGameId
  players: TMaskedPlayerState[]
  currentTurn: TMaskedTurnState
}
export interface TCompleteGameState {
  turn0: TTurnState
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
  // gameId: TGameId
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

  constructor(t: TBaseTurnState, players: TMaskedPlayerState[]) {
    // this.gameId = t.gameId
    this.status = t.status
    this.action = t.action
    this.discardPile = new Pile(t.discardPile.map(c => Card.fromValueString(c)))
    this.hintCount = t.hintCount
    this.woundCount = t.woundCount
    this.table = new Table(t.table)
    this.turnNumber = t.turnNumber
    this.turnsLeft = typeof t.turnsLeft !== 'undefined' ? t.turnsLeft : null
    this.timestamp = t.timestamp || new Date().toISOString()

    this._players = players.map(p => new Player({id: '[REDACTED]', ...p}))
  }
  get score() {
    return this.table.getScore()
  }
}
export class Turn extends BaseTurn {
  completePlayerHands: Hand[]
  stock: Pile
  seed: string

  constructor(t: TTurnState, players: TMaskedPlayerState[]) {
    super(t, players)
    this.completePlayerHands = t.completePlayerHands.map(p => new Hand(p))
    this.stock = new Pile(t.stock)
    this.seed = t.seed
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
      seed: this.seed,
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

  // getGameState(forPlayerId: TPlayerId): TMaskedGameState {
  //   return {
  //     gameId: this.gameId
  //     currentTurn: this.getState(forPlayerId),
  //     history: {
  //       revealedStock: [],
  //       playedActions: [],
  //     },
  //   }
  // }

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
        seed: undefined,
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

  // ACTIONS
  playNext(playerId: string, actionParams: TActionParams) {
    // console.warn(1234, {
    //   type: actionParams.type,
    //   playerId,
    //   inTurn: this.inTurn,
    //   players: this.players,
    //   turnNumber: this.turnNumber,
    // })

    const nextTurn = this.clone()

    // get current player
    const me: Player = nextTurn._players[nextTurn.inTurn]
    if (!me) {
      throw new GameError('NO_SUCH_PLAYER', {playerId})
    }
    if (playerId !== me.id) {
      throw new GameError('NOT_MY_TURN', {playerId})
    }

    if (nextTurn.status !== 'RUNNING') {
      throw new GameError('GAME_ENDED')
    }

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

      const hintee = nextTurn._players[actionParams.toPlayerIdx]
      if (!hintee) {
        throw new GameError('NO_SUCH_PLAYER', actionParams.toPlayerIdx)
      }
      if (hintee === me) {
        throw new GameError('CANNOT_HINT_SELF')
      }

      nextTurn.completePlayerHands[hintee.idx].addHint({turnNumber: nextTurn.turnNumber, is: actionParams.is})

      nextTurn.action = {...actionParams, toPlayerName: hintee.name}
    } else {
      const card = nextTurn.completePlayerHands[me.idx].take(actionParams.cardIdx, nextTurn.stock)

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
        nextTurn.action = {...actionParams, card: card.toJSON(), success}
      } else if (actionParams.type === 'DISCARD') {
        nextTurn.discardPile.add(card)
        if (nextTurn.hintCount < 9) nextTurn.hintCount++
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
      nextTurn.turnsLeft = nextTurn._players.length
    }

    return nextTurn
  }
}
export class MaskedTurn extends BaseTurn {
  playerHandViews: PlayerHandView[]
  stockSize: number
  constructor(state: TMaskedTurnState, players: TMaskedPlayerState[]) {
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
// export interface TNewGameConstructor {from: 'FIRST_PLAYER', playerName: string}

export class MaskedGame {
  gameId: TGameId
  players: Player[]
  currentTurn: MaskedTurn
  constructor(maskedGameState: TMaskedGameState) {
    this.gameId = maskedGameState.gameId
    this.players = maskedGameState.players.map(p => new Player({...p, id: 'REDACTED'}))
    this.currentTurn = new MaskedTurn(maskedGameState.currentTurn, maskedGameState.players)
  }
}

export class Game {
  turns: Turn[] = []
  gameId: TGameId
  players: Player[]
  playersById: {[id: string]: Player}

  constructor(params: TNewGameConstructor | TExistingGameConstructor) {
    if (params.from === 'SERIALIZED_GAME') {
      // deserialize an ongoing game
      this.gameId = params.game.gameId
      this.players = params.game.players.map(p => new Player(p))
      this.turns = [new Turn(params.game.turn0, params.game.players)]
      // Fill `this.turns` by "replaying" the game

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

      for (const [turnNumber, {action, timestamp}] of params.game.playedActions.entries()) {
        const actionParams = resolvedActionToActionParams(action)
        if (actionParams.type !== 'START')
          this.act(this.currentTurn._players[(turnNumber - 1) % this.currentTurn._players.length].id, actionParams)
        this.currentTurn.timestamp = timestamp // fix timestamp
      }
    } else if (params.from === 'NEW_TEST_GAME') {
      // USED IN TESTS
      // set up a new game
      const seed = randomBytes(20).toString('hex')
      let {playerNames, deck, discardPile, table} = params
      if (!deck) {
        deck = new Pile(deck || Card.getFullDeck())
        deck.shuffle(seed)
      }

      const handSize: number = Game.getHandSize(playerNames.length)

      this.gameId = randomBytes(20).toString('hex')

      this.players = playerNames.map((name, idx) => new Player({name, idx, id: `bogus_id_${name}`, isConnected: true}))

      this.turns = [
        new Turn(
          {
            seed,
            table: new Table(table ? table.toJSON() : undefined).toJSON(),
            stock: deck.toJSON(),
            discardPile: (discardPile || new Pile([])).toJSON(),
            completePlayerHands: playerNames.map(() => []),
            hintCount: 9,
            woundCount: 0,
            turnNumber: 0,
            turnsLeft: null,
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

      // deal the cards
      for (let i = 0; i < handSize; i++) {
        for (let p = 0; p < playerNames.length; p++) {
          this.currentTurn.completePlayerHands[p].dealOne(this.currentTurn.stock.drawOne())
        }
      }
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
    return new Game({
      from: 'SERIALIZED_GAME',
      game: {
        gameId: randomBytes(20).toString('hex'),
        turn0: {
          table: new Table().toJSON(),
          stock: new Pile([]).toJSON(),
          seed: randomBytes(20).toString('hex'),
          discardPile: new Pile([]).toJSON(),
          completePlayerHands: [[]], // one empty hand, no hand cards yet
          hintCount: 9,
          woundCount: 0,
          turnNumber: 0,
          turnsLeft: null,
          status: 'WAITING_FOR_PLAYERS',
          action: {type: 'START'},
          score: 0,
          stockSize: 0,
          inTurn: 0,
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
    turn0.stock = new Pile(Card.getFullDeck())
    turn0.stock.shuffle(pendingGame.gameId)

    const handSize: number = Game.getHandSize(turn0._players.length)
    for (let i = 0; i < handSize; i++) {
      for (let p = 0; p < turn0._players.length; p++) {
        turn0.completePlayerHands[p].dealOne(turn0.stock.drawOne())
      }
    }
    turn0.status = 'RUNNING'

    return new Game({from: 'SERIALIZED_GAME', game: pendingGame.toJSON()})
  }

  // returns complete game
  toJSON(): TCompleteGameState {
    return {
      gameId: this.gameId,
      turn0: this.turns[0].toJSON(),
      playedActions: this.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      timestamp: this.turns[this.turns.length - 1].timestamp,
      players: this.players.map(p => p.toJSON()),
    }
  }
  // getMaskedGame() {
  //   return {

  //   }
  // }

  act(playerId: TPlayerId, actionParams: TPlayableActionParams) {
    // console.warn('ACT', {playerId, actionParams})

    this.turns.push(this.currentTurn.playNext(playerId, actionParams))
    this.checkIntegrity()
  }

  // TODO:
  // static deserialize(turns: TMaskedTurnState[]) {}

  getTurnState(playerId: TPlayerId): TMaskedTurnState {
    return this.currentTurn.getState(playerId)
  }

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TMaskedGameState {
    return {
      gameId: this.gameId,
      currentTurn: this.currentTurn.getState(playerId),
      history: {
        revealedStock: [],
        playedActions: [],
      },
      players: this.players.map(p => ({...p.toJSON(), id: undefined})),
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
