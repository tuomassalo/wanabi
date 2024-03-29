import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState} from './player'
import {Card, TColor, TNum, TCardValueState, TBasicColor} from './card'
import {Hand, THandState, TMaskedPlayerViewState, COMPAT_TMaskedOtherPlayerViewState} from './hand'
import {Table, TTableState} from './table'
import {GameError} from './errors'
import {randomBytes} from 'crypto'
import {Turn} from './turn'
import {MaskedGame} from './masked-game'
import {shuffle} from 'lodash'

export type TGameStatus = 'WAITING_FOR_PLAYERS' | 'RUNNING' | 'GAMEOVER' | 'FINISHED'
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
  is: TBasicColor | TNum
}

// added by the constructor
interface TStartActionParams {
  type: 'START'
}

export interface DeckParams {
  useRainbow: boolean
  useBlack: boolean
}

export interface GameParams extends DeckParams {
  maxHintCount: number
  maxWoundCount: number
  shufflePlayers: 'SHUFFLE_NONE' | 'SHUFFLE_RANDOMIZE' | 'SHUFFLE_RANDOMIZE_AND_ANONYMIZE'
}

export type TActionParams = TPlayActionParams | TDiscardActionParams | THintActionParams | TStartActionParams
type TPlayableActionParams = TPlayActionParams | TDiscardActionParams | THintActionParams

export interface TResolvedStartActionState extends TStartActionParams {} // added by the constructor
export interface TResolvedPlayActionState extends TPlayActionParams {
  card: TCardValueState
  success: boolean
}
export interface TResolvedDiscardActionState extends TDiscardActionParams {
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
  hands: THandState[]
  stock: TCardValueState[] // empty if is masked
}
export interface TMaskedTurnState extends TBaseTurnState {
  maskedPlayerViews: TMaskedPlayerViewState[]
}

export interface TRefinedMaskedTurnState extends TBaseTurnState {
  maskedPlayerViews: COMPAT_TMaskedOtherPlayerViewState[]
}

export interface WS_getGamesStateParams {}
// export interface WS_getGameStateParams {
//   gameId: TGameId
// }
export interface WS_createGameParams {
  firstPlayerName: string
  seed?: string
}
export interface WS_startGameParams {
  gameId: TGameId
}
export interface WS_setGameParamsParams {
  gameId: TGameId
  gameParams: GameParams
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
export interface WS_keepaliveParams {}
export interface TMaskedGameState {
  playedActions: {timestamp: string; action: TResolvedActionState}[]
  gameId: TGameId
  players: TPlayerState[]
  currentTurn: TMaskedTurnState
  gameParams: GameParams
}
export interface TCompleteGameState {
  turn0: TTurnState
  seed: string
  gameId: TGameId
  playedActions: {timestamp: string; action: TResolvedActionState}[]
  players: TPlayerState[]
  timestamp: string
  gameParams: GameParams
}

export interface TSpeculativeHintState {
  toPlayerIdx: number
  is: TColor | TNum
}

export interface M_GamesState {
  msg: 'M_GamesState'
  timestamp: string
  games: TMaskedGameState[] // latest turn of each game
}
export interface M_GameHistory {
  msg: 'M_GameHistory'
  gameId: TGameId
  previousTurns: TMaskedTurnState[] // all previous turns of this game
}
export interface M_GameState {
  msg: 'M_GameState'
  timestamp: string
  game: TMaskedGameState
}

export type WebsocketServerMessage = M_GamesState | M_GameHistory | M_GameState

export interface TExistingGameConstructor {
  from: 'SERIALIZED_GAME'
  game: TCompleteGameState
}
export interface TNewGameConstructor {
  from: 'NEW_TEST_GAME'
  playerNames: string[]
  gameParams: GameParams
  deck?: Pile
  discardPile?: Pile
  table?: Table
}

export class Game {
  turns: Turn[] = []
  gameId: TGameId
  seed: string
  players: Player[]
  playersById: {[id: string]: Player}
  gameParams: GameParams

  static getDefaultTurn0Properties(gameParams: GameParams) {
    return {
      table: new Table(undefined, gameParams).toJSON(),
      stock: new Pile([]).toJSON(),
      discardPile: new Pile([]).toJSON(),
      hands: [[]], // one empty hand, no hand cards yet
      hintCount: gameParams.maxHintCount,
      woundCount: 0,
      turnNumber: 0,
      turnsLeft: null,
      // needed only for TypeScript
      score: 0,
      stockSize: 0,
      inTurn: 0,
    }
  }

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
        const playerIdx = (turnNumber - 1) % this.currentTurn._players.length
        if (action.type === 'PLAY' || action.type === 'DISCARD') {
          // when replaying a masked game, replace the potentially unknown card with the
          // revealed card, so it can be properly played. But before that, conserve any
          // hints from the masked card.
          const cards = this.currentTurn.hands[playerIdx].cards
          const hints = cards[action.cardIdx].hints
          const completeCard = new Card(action.card)
          completeCard.hints = hints
          this.currentTurn.hands[playerIdx].cards[action.cardIdx] = completeCard
        }
        // NB: nothing special needed for HINT actions

        this.act(this.currentTurn._players[playerIdx].id, actionParams)
      }
      this.currentTurn.timestamp = timestamp // fix timestamp
    }
  }
  // deal the cards
  deal() {
    const turn = this.currentTurn
    const handSize: number = Game.getHandSize(this.players.length)
    for (let i = 0; i < handSize; i++) {
      for (let p = 0; p < turn.hands.length; p++) {
        turn.hands[p].dealOne(turn.stock.drawOne())
      }
    }
  }

  constructor(params: TNewGameConstructor | TExistingGameConstructor) {
    const initCards = (turn: TTurnState, gameParams: GameParams) => {}

    if (params.from === 'SERIALIZED_GAME') {
      // deserialize an ongoing game

      // ... or a game that's waiting for players. Its game params may have changed,
      // so let's re-init table and stock.
      if (params.game.turn0.status === 'WAITING_FOR_PLAYERS') {
        params.game.turn0.table = new Table(undefined, params.game.gameParams).toJSON()
        params.game.turn0.stock = new Pile(Card.getFullDeck(params.game.gameParams)).shuffle(params.game.seed).toJSON()
      }

      this.gameId = params.game.gameId
      this.seed = params.game.seed
      this.players = params.game.players.map(p => new Player(p))
      this.gameParams = params.game.gameParams
      this.turns = [new Turn(params.game.turn0, params.game.players, this.gameParams)]

      // hack: turn0 hintCount is filled already in createPendingGame, but it might change later.
      this.turns[0].hintCount = this.gameParams.maxHintCount

      if (this.currentTurn.status === 'RUNNING' && this.currentTurn.hands[0].cards.length === 0) {
        this.deal()
      }
      this.replay(params.game.playedActions)
    } else if (params.from === 'NEW_TEST_GAME') {
      // USED IN TESTS
      // set up a new game
      this.seed = randomBytes(20).toString('hex')
      this.gameParams = params.gameParams
      let {playerNames, deck, discardPile, table} = params
      if (!deck) {
        deck = new Pile(deck || Card.getFullDeck(this.gameParams))
        deck.shuffle(this.seed)
      }

      this.gameId = randomBytes(20).toString('hex')
      this.players = playerNames.map((name, idx) => new Player({name, idx, id: `bogus_id_${name}`, isConnected: true}))

      this.turns = [
        new Turn(
          {
            ...Game.getDefaultTurn0Properties(this.gameParams),
            table: new Table(table ? table.toJSON() : undefined, this.gameParams).toJSON(),
            stock: deck.toJSON(),
            discardPile: (discardPile || new Pile([])).toJSON(),
            hands: playerNames.map(() => []),
            status: 'RUNNING',
            action: {type: 'START'},
            // needed only for typescript
            score: 0,
            inTurn: 0,
            timestamp: new Date().toISOString(),
            stockSize: deck.size,
          },
          this.players,
          this.gameParams,
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

  static createPendingGame(params: WS_createGameParams, firstPlayerId: TPlayerId, gameParams: GameParams): Game {
    const timestamp = new Date().toISOString()
    const seed = params.seed || randomBytes(20).toString('hex')
    const stock = new Pile(Card.getFullDeck(gameParams)).shuffle(seed).toJSON()

    return new Game({
      from: 'SERIALIZED_GAME',
      game: {
        gameId: randomBytes(20).toString('hex'),
        seed,
        turn0: {
          ...Game.getDefaultTurn0Properties(gameParams),

          hintCount: gameParams.maxHintCount,
          stock,
          status: 'WAITING_FOR_PLAYERS',
          action: {type: 'START'},
          timestamp,
        },
        players: [
          new Player({
            name: params.firstPlayerName,
            idx: 0,
            id: firstPlayerId,
            isConnected: true,
          }).toJSON(),
        ],
        playedActions: [],
        timestamp,
        gameParams,
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
    pendingGame.currentTurn.hands.push(new Hand([]))

    return new Game({from: 'SERIALIZED_GAME', game: pendingGame.toJSON()})
  }
  static setPendingGameParams(pendingGame: Game, gameParams: GameParams): Game {
    pendingGame.gameParams = gameParams

    return new Game({from: 'SERIALIZED_GAME', game: pendingGame.toJSON()})
  }

  static startPendingGame(pendingGame: Game): Game {
    const turn0 = pendingGame.turns[0]

    turn0.status = 'RUNNING'

    if (pendingGame.gameParams.shufflePlayers !== 'SHUFFLE_NONE') {
      pendingGame.players = shuffle(pendingGame.players)
      // fix indices
      for (const [idx, p] of pendingGame.players.entries()) {
        p.idx = idx
      }
      if (pendingGame.gameParams.shufflePlayers === 'SHUFFLE_RANDOMIZE_AND_ANONYMIZE') {
        const playerNames = ['A', 'B', 'C', 'D', 'E']
        for (const [idx, p] of pendingGame.players.entries()) {
          p.name = 'Player ' + playerNames[idx]
        }
      }
    }

    return new Game({from: 'SERIALIZED_GAME', game: pendingGame.toJSON()})
  }

  // returns complete game
  toJSON(): TCompleteGameState {
    return {
      gameId: this.gameId,
      seed: this.seed,
      turn0: this.turns[0].toJSON(),
      playedActions: this.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      timestamp: this.turns[this.turns.length - 1].timestamp,
      players: this.players.map(p => p.toJSON()),
      gameParams: this.gameParams,
    }
  }

  act(playerId: TPlayerId, actionParams: TPlayableActionParams) {
    // console.warn('ACT', {playerId, actionParams, inStock: this.currentTurn.stock.size})

    this.turns.push(this.currentTurn.playAction(playerId, actionParams, this.gameParams))
    this.checkIntegrity()
  }

  // just for the engine tests
  COMPAT_getMaskedTurnState(playerId: TPlayerId): TRefinedMaskedTurnState {
    const maskedGame = new MaskedGame({
      gameId: this.gameId,
      currentTurn: this.currentTurn.getState(playerId),
      playedActions: [], // this.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      players: this.players.map(p => ({...p.toJSON(), id: p.id === playerId ? p.id : 'REDACTED'})),
      gameParams: this.gameParams,
    })

    return maskedGame.currentTurn.getState()
  }

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TMaskedGameState {
    return {
      gameId: this.gameId,
      currentTurn: this.currentTurn.getState(playerId),
      playedActions: this.turns.map(t => ({action: t.action, timestamp: t.timestamp})),
      players: this.players.map(p => ({...p.toJSON(), id: p.id === playerId ? p.id : 'REDACTED'})),
      gameParams: this.gameParams,
    }
  }

  getPreviousTurns(playerId: TPlayerId): TMaskedTurnState[] {
    // returns information about previus turns that is public for a player
    return this.turns.filter(t => t !== this.currentTurn).map(t => t.getState(playerId))
  }

  checkIntegrity() {
    // if the game has not started yet, cards are not dealt.
    if (this.currentTurn.status === 'WAITING_FOR_PLAYERS') return

    // check that we have the correct set of cards
    const currentCards = [
      ...this.currentTurn.stock.cards,
      ...this.currentTurn.discardPile.cards,
      ...this.currentTurn.hands.flatMap(ch => ch.cards.map(hc => new Card(hc))),
      ...Object.values(this.currentTurn.table.table)
        .map(p => p.cards)
        .flat(),
    ]
      .map(c => c.toJSON())
      .sort()
      .join(' ')

    const expectedCards = Card.getFullDeck(this.gameParams)
      .map(c => c.toJSON())
      .sort()
      .join(' ')

    if (currentCards !== expectedCards) {
      console.warn('INTEGRITY_ERROR:', this.gameParams, {expectedCards, currentCards})

      throw new Error('INTEGRITY_ERROR')
    }
  }
}
