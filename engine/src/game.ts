import {Pile} from './pile'
import {Player, TPlayerId, TPlayerState, TMaskedPlayerState, MaskedPlayer} from './player'
import {Card, TColor, TNum, AllColors, AllNums, TCardState, TCardValueState} from './card'
import {Hand} from './hand'
import {Table, TTableState} from './table'
import {SyntaxError, GameError} from './errors'
import {randomBytes} from 'crypto'

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
  gameId: TGameId
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
  players: TPlayerState[]
  stock: TCardValueState[] // empty if is masked
}
export interface TMaskedTurnState extends TBaseTurnState {
  players: TMaskedPlayerState[]
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
interface M_GamesState {
  msg: 'M_GamesState'
  timestamp: string
  games: TMaskedTurnState[] // latest turn of each game
}
// interface M_GameState {
//   msg: 'M_GameState'
//   timestamp: string
//   currentTurn: TMaskedTurnState
// }

export type WebsocketServerMessage = M_GamesState // | M_GameState

abstract class BaseTurn {
  gameId: TGameId
  status: TGameStatus
  action: TResolvedActionState
  discardPile: Pile
  hintCount: number
  woundCount: number
  table: Table
  turnNumber: number
  turnsLeft: number | null // `null` means that the countdown has not started yet.
  timestamp: string // ISO string

  constructor(t: TBaseTurnState) {
    this.gameId = t.gameId
    this.status = t.status
    this.action = t.action
    this.discardPile = new Pile(t.discardPile.map(c => Card.fromValueString(c)))
    this.hintCount = t.hintCount
    this.woundCount = t.woundCount
    this.table = new Table(t.table)
    this.turnNumber = t.turnNumber
    this.turnsLeft = t.turnsLeft
    this.timestamp = t.timestamp || new Date().toISOString()
  }
  get score() {
    return this.table.getScore()
  }
}
export class Turn extends BaseTurn {
  players: Player[]
  stock: Pile

  constructor(t: TTurnState) {
    super(t)
    this.players = t.players.map(p => new Player(p))
    this.stock = new Pile(t.stock)
  }
  clone() {
    // make a deep copy
    return new Turn(JSON.parse(JSON.stringify(this.toJSON())))
  }
  get inTurn() {
    return this.turnNumber % this.players.length
  }

  toJSON(): TTurnState {
    return {
      ...this,
      stock: this.stock.toJSON(),
      discardPile: this.discardPile.toJSON(),
      table: this.table.toJSON(),
      players: this.players.map(p => p.toJSON()),
    }
  }
  get stockSize() {
    return this.stock.cards.length
  }

  getState(forPlayerId: TPlayerId): TMaskedTurnState {
    const isOutsider = !this.players.some(p => p.id === forPlayerId)
    return {
      ...JSON.parse(JSON.stringify(this)),
      stock: undefined,
      stockSize: this.stock.size,
      inTurn: this.inTurn,
      score: this.score,
      players: this.players.map(p =>
        isOutsider
          ? MaskedPlayer.outsiderFromPlayer(p)
          : p.id === forPlayerId
          ? MaskedPlayer.meFromPlayer(
              p,
              [
                // discard pile
                this.discardPile.cards,
                // table
                Object.values(this.table.table).flatMap(p => p.cards),
                // hands of other players
                this.players
                  .filter(player => player.idx !== p.idx)
                  .flatMap(player => player.hand.cards.map(hc => new Card(hc))),
              ].flat(),
            ).toJSON()
          : MaskedPlayer.otherFromPlayer(p).toJSON(),
      ),
    }
  }

  // for (const p of nextTurn.players) {
  //   const handCards = p.hand.cards
  //   p.hand.cards =
  //     demystify(
  //       handCards,
  //       // nextTurn.table,
  //       [
  //         // discard pile
  //         nextTurn.discardPile.cards,
  //         // table
  //         Object.values(nextTurn.table.table).flatMap(p => p.cards),
  //         // hands of other players
  //         nextTurn.players
  //           .filter(player => player.idx !== p.idx)
  //           .flatMap(player => player.hand.cards.map(hc => new Card(hc.color, hc.num))),
  //       ].flat(),
  //     ),
  //   )
  // }

  // toJSON() {
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

    const nextTurn = this.clone()

    // get current player
    const me: Player = nextTurn.players[nextTurn.inTurn]
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

      const hintee = nextTurn.players[actionParams.toPlayerIdx]
      if (!hintee) {
        throw new GameError('NO_SUCH_PLAYER', actionParams.toPlayerIdx)
      }
      if (hintee === me) {
        throw new GameError('CANNOT_HINT_SELF')
      }

      hintee.hand.addHint({turnNumber: nextTurn.turnNumber, is: actionParams.is})

      nextTurn.action = {...actionParams, toPlayerName: hintee.name}
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
      nextTurn.turnsLeft = nextTurn.players.length
    }

    return nextTurn
  }
}
export class MaskedTurn extends BaseTurn {
  players: MaskedPlayer[]
  stockSize: number
  constructor(state: TMaskedTurnState) {
    super(state)
    this.players = state.players.map(p => new MaskedPlayer(p))
    this.stockSize = state.stockSize
  }
  get inTurn() {
    return this.turnNumber % this.players.length
  }
}

export interface TExistingGameConstructor {
  from: 'SERIALIZED_TURNS'
  turns: TTurnState[]
}
export interface TNewGameConstructor {
  from: 'NEW_TEST_GAME'
  playerNames: string[]
  deck?: Pile
  discardPile?: Pile
  table?: Table
}
// export interface TNewGameConstructor {from: 'FIRST_PLAYER', playerName: string}

export class Game {
  turns: Turn[] = []
  playersById: {[id: string]: Player}

  constructor(params: TNewGameConstructor | TExistingGameConstructor) {
    if (params.from === 'SERIALIZED_TURNS') {
      // deserialize an ongoing game
      this.turns = params.turns.map(t => new Turn(t))
    } else if (params.from === 'NEW_TEST_GAME') {
      // USED IN TESTS
      // set up a new game
      let {playerNames, deck, discardPile, table} = params
      if (!deck) {
        deck = new Pile(deck || Card.getFullDeck())
        deck.shuffle()
      }

      const handSize: number = Game.getHandSize(playerNames.length)

      this.turns = [
        new Turn({
          gameId: randomBytes(20).toString('hex'),
          table: new Table(table ? table.toJSON() : undefined).toJSON(),
          stock: deck.toJSON(),
          discardPile: (discardPile || new Pile([])).toJSON(),
          players: playerNames.map((name, idx) =>
            new Player({name, idx, hand: new Hand([]).toJSON(), id: `bogus_id_${name}`, isConnected: true}).toJSON(),
          ),
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
        }),
      ]

      for (let i = 0; i < handSize; i++) {
        for (let p = 0; p < playerNames.length; p++) {
          this.currentTurn.players[p].hand.dealOne(this.currentTurn.stock.drawOne())
        }
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

  static createPendingGame(firstPlayerName: string, firstPlayerId: TPlayerId): Turn {
    return new Turn({
      gameId: randomBytes(20).toString('hex'),
      table: new Table().toJSON(),
      stock: new Pile([]).toJSON(),
      discardPile: new Pile([]).toJSON(),
      players: [
        new Player({
          name: firstPlayerName,
          idx: 0,
          hand: new Hand([]).toJSON(),
          id: firstPlayerId,
          isConnected: true,
        }).toJSON(),
      ], // no hand cards yet
      hintCount: 9,
      woundCount: 0,
      turnNumber: 0,
      turnsLeft: null,
      status: 'WAITING_FOR_PLAYERS',
      action: {type: 'START'},
      score: 0,
      stockSize: 0,
      inTurn: 0,
      timestamp: new Date().toISOString(),
    })
  }

  static joinPendingGame(pendingGame: Turn, newPlayerName: string, newPlayerId: TPlayerId): Turn {
    if (pendingGame.players.length >= 5) throw new GameError('GAME_FULL')

    pendingGame.players.push(
      new Player({
        name: newPlayerName,
        idx: pendingGame.players.length,
        hand: new Hand([]).toJSON(),
        id: newPlayerId,
        isConnected: true,
      }),
    )
    return pendingGame
  }
  static startPendingGame(pendingGame: Turn): Game {
    pendingGame.stock = new Pile(Card.getFullDeck())
    pendingGame.stock.shuffle()

    const handSize: number = Game.getHandSize(pendingGame.players.length)
    for (let i = 0; i < handSize; i++) {
      for (let p = 0; p < pendingGame.players.length; p++) {
        pendingGame.players[p].hand.dealOne(pendingGame.stock.drawOne())
      }
    }
    pendingGame.status = 'RUNNING'

    return new Game({from: 'SERIALIZED_TURNS', turns: JSON.parse(JSON.stringify([pendingGame]))})
  }

  toJSON() {
    return {turns: this.turns}
  }

  act(playerId: TPlayerId, actionParams: TPlayableActionParams) {
    // console.warn('ACT', {playerId, actionParams})

    this.turns.push(this.currentTurn.playNext(playerId, actionParams))
    this.checkIntegrity()
  }

  // TODO:
  // static deserialize(turns: TMaskedTurnState[]) {}

  // this returns information that is public for a player
  getState(playerId: TPlayerId): TTurnState {
    return this.getCompleteState(playerId).slice(-1)[0]
  }
  // this returns information that is public for a player
  getCompleteState(playerId: TPlayerId): TTurnState[] {
    // allow querying all games when they are still waiting for players
    if (!this.playersById[playerId] && this.currentTurn.status !== 'WAITING_FOR_PLAYERS') {
      throw new SyntaxError('INVALID_PLAYER_ID', playerId)
    }

    const ret = JSON.parse(JSON.stringify(this.turns.map(t => t.getState(playerId)))) as TTurnState[]

    return ret
  }

  checkIntegrity() {
    // if the game has not started yet, cards are not dealt.
    if (this.currentTurn.status === 'WAITING_FOR_PLAYERS') return

    // check that we have the correct set of cards
    const currentCards = [
      ...this.currentTurn.stock.cards,
      ...this.currentTurn.discardPile.cards,
      ...this.currentTurn.players.flatMap(p => p.hand.cards.map(hc => new Card(hc))),
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
