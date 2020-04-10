import * as engine from 'wanabi-engine'

interface CommonState {
  settings: {
    sound: boolean
    showStats: boolean
  }
}
export interface LoadingState extends CommonState {
  phase: 'LOADING'
}
export interface InMenuState extends CommonState {
  phase: 'IN_MENU'
  games: engine.MaskedGame[]
}
export interface InGameState extends CommonState {
  phase: 'IN_GAME'
  game: engine.MaskedGame
  visibleTurnNumber: number
}
export type AppState = LoadingState | InMenuState | InGameState

export type Action =
  | {
      type: 'SET_SETTING'
      key: 'sound' | 'showStats' // | 'showmysteryview'
      value: true | false
    }
  | {
      type: 'SET_GAMES'
      games: engine.MaskedGame[]
    }
  | {
      type: 'SET_GAME'
      game: engine.MaskedGame | undefined
    }
  | {
      type: 'ADD_TURN'
      turn: engine.TMaskedTurnState
    }
  | {
      type: 'SET_VISIBLE_TURN'
      turnNumber: number
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
          visibleTurnNumber: action.game.currentTurn.turnNumber,
          phase: 'IN_GAME',
          game: action.game,
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
      } as any
    case 'SET_VISIBLE_TURN':
      return {
        ...state,
        visibleTurnNumber: action.turnNumber,
      } as any
    default:
      console.warn(action)
      throw new Error('invalid action')
  }
}

export default Reducer
