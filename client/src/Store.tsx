// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {createContext, useReducer, Dispatch} from 'react'
import Reducer, {Action, AppState} from './Reducer'

const initialState: AppState = {
  phase: 'LOADING',
  settings: {
    sound: localStorage.getItem('sound') === '1',
    showStats: false,
    showMysteryView: false,
    hasNotificationPermission: window.Notification && Notification.permission === 'granted',
  },
  // connectionStatus: 'opening',
  // idleSince: +Date.now(),
}

const Store = ({children}: any) => {
  const [state, dispatch] = useReducer(Reducer, initialState)
  return <Context.Provider value={{state: state as AppState, dispatch}}>{children}</Context.Provider>
}

export const Context = createContext({state: initialState as AppState, dispatch: (() => {}) as Dispatch<Action>})
export default Store
