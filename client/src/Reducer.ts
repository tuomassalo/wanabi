import * as engine from 'wanabi-engine'
import {MaskedGame} from 'wanabi-engine/dist/masked-game'
import {MaskedCard} from 'wanabi-engine/dist/card'
import {WebSocketClient} from './websocketclient'

interface CommonState {
  settings: {
    sound: boolean
    showStats: boolean
    showMysteryView: boolean
    hasNotificationPermission: boolean
  }
  // idleSince: number
  // connectionStatus: 'opening' | 'open' | 'closed' // see websocketclient.ts
}
export interface LoadingState extends CommonState {
  phase: 'LOADING'
}
export interface DisconnectedState extends CommonState {
  phase: 'DISCONNECTED'
}
export interface InMenuState extends CommonState {
  phase: 'IN_MENU'
  games: MaskedGame[]
}
export interface InGameState extends CommonState {
  phase: 'IN_GAME'
  game: MaskedGame
  visibleTurnNumber: number
  speculativeMysteryView?: {
    playerIdx: number
    hand: MaskedCard[]
  }
}
export type AppState = DisconnectedState | LoadingState | InMenuState | InGameState

export type Action =
  | {
      type: 'SET_SETTING'
      key: 'sound' | 'showStats' | 'showMysteryView' | 'hasNotificationPermission'
      value: true | false
    }
  | {
      type: 'SET_DISCONNECTED'
    }
  | {
      type: 'SET_LOADING'
    }
  | {
      type: 'SET_GAMES'
      games: MaskedGame[]
    }
  | {
      type: 'SET_GAME'
      game: MaskedGame | undefined
    }
  | {
      type: 'ADD_TURN'
      turn: engine.TMaskedTurnState
    }
  | {
      type: 'SET_VISIBLE_TURN'
      turnNumber: number
    }
  | {
      type: 'SHOW_SPECULATIVE_MYSTERY_VIEW'
      playerIdx: number
      hand: MaskedCard[]
    }
  | {
      type: 'HIDE_SPECULATIVE_MYSTERY_VIEW'
    }

const Reducer = (state: AppState, action: Action): AppState => {
  // console.warn('REDUCING', state, action)

  // HACK! The AWS endpoint closes the websocket after 10 minutes of inactivity.
  // If the user is still active (usually by browsing through the turn history),
  // send a keepalive msg to the socket.
  const wsclient: WebSocketClient = (window as any).wsclient
  const connectionStatus = wsclient?.state || 'CLOSED'
  if (connectionStatus && Date.now() - wsclient.latestMessageTimestamp > 5 * 60 * 1000) {
    console.warn('at least five minutes since last wsclient msg, sending a keep-alive msg')
    wsclient.keepalive({})
  }

  switch (action.type) {
    case 'SET_SETTING':
      return {
        ...state,
        settings: {...state.settings, [action.key]: action.value},
        // idleSince: +Date.now(),
        // connectionStatus,
      }
    case 'SET_DISCONNECTED':
      return {
        settings: state.settings,
        phase: 'DISCONNECTED',
        // idleSince: +Date.now(),
        // connectionStatus,
      }
    case 'SET_LOADING':
      return {
        settings: state.settings,
        phase: 'LOADING',
        // idleSince: +Date.now(),
        // connectionStatus,
      }
    case 'SET_GAMES':
      return {
        settings: state.settings,
        phase: 'IN_MENU',
        games: action.games,
        // idleSince: +Date.now(),
        // connectionStatus,
      }
    case 'SET_GAME':
      if (action.game)
        return {
          ...state,
          // only update visibleTurnNumber here if the old state was not InGameState
          visibleTurnNumber: (state as InGameState).visibleTurnNumber || action.game.currentTurn.turnNumber,
          phase: 'IN_GAME',
          game: action.game,
          speculativeMysteryView: undefined,
          // idleSince: +Date.now(),
          // connectionStatus,
        }
      else
        return {
          settings: state.settings,
          games: (state as InMenuState).games,
          phase: 'IN_MENU',
          // idleSince: +Date.now(),
          // connectionStatus,
        }
    case 'ADD_TURN':
      const game = (state as InGameState).game
      game.addTurn(action.turn)
      return {
        ...state,
        game,
        visibleTurnNumber: game.currentTurn.turnNumber,
        speculativeMysteryView: undefined,
        // idleSince: +Date.now(),
        // connectionStatus,
      } as any
    case 'SET_VISIBLE_TURN':
      return {
        ...state,
        visibleTurnNumber: action.turnNumber,
        speculativeMysteryView: undefined,
        // idleSince: +Date.now(),
        // connectionStatus,
      } as any
    case 'SHOW_SPECULATIVE_MYSTERY_VIEW':
      return {
        ...state,
        speculativeMysteryView: {playerIdx: action.playerIdx, hand: action.hand},
        // idleSince: +Date.now(),
        // connectionStatus,
      } as any
    case 'HIDE_SPECULATIVE_MYSTERY_VIEW':
      return {
        ...state,
        speculativeMysteryView: undefined,
        // idleSince: +Date.now(),
        // connectionStatus,
      } as any
    default:
      console.warn(action)
      throw new Error('invalid action')
  }
}

export default Reducer
