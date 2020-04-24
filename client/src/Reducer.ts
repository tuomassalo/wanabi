import * as engine from 'wanabi-engine'
import {MaskedGame} from 'wanabi-engine/dist/masked-game'
import {MaskedCard} from 'wanabi-engine/dist/card'

interface CommonState {
  settings: {
    sound: boolean
    showStats: boolean
    showMysteryView: boolean
  }
}
export interface LoadingState extends CommonState {
  phase: 'LOADING'
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
export type AppState = LoadingState | InMenuState | InGameState

export type Action =
  | {
      type: 'SET_SETTING'
      key: 'sound' | 'showStats' | 'showMysteryView'
      value: true | false
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

  switch (action.type) {
    case 'SET_SETTING':
      return {
        ...state,
        settings: {...state.settings, [action.key]: action.value},
      }
    case 'SET_GAMES':
      return {
        settings: state.settings,
        phase: 'IN_MENU',
        games: action.games,
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
        }
      else
        return {
          settings: state.settings,
          games: (state as InMenuState).games,
          phase: 'IN_MENU',
        }
    case 'ADD_TURN':
      const game = (state as InGameState).game
      game.addTurn(action.turn)
      return {
        ...state,
        game,
        visibleTurnNumber: game.currentTurn.turnNumber,
        speculativeMysteryView: undefined,
      } as any
    case 'SET_VISIBLE_TURN':
      return {
        ...state,
        visibleTurnNumber: action.turnNumber,
        speculativeMysteryView: undefined,
      } as any
    case 'SHOW_SPECULATIVE_MYSTERY_VIEW':
      return {
        ...state,
        speculativeMysteryView: {playerIdx: action.playerIdx, hand: action.hand},
      } as any
    case 'HIDE_SPECULATIVE_MYSTERY_VIEW':
      return {
        ...state,
        speculativeMysteryView: undefined,
      } as any
    default:
      console.warn(action)
      throw new Error('invalid action')
  }
}

export default Reducer
