import React from 'react'
import {useContext} from 'react'
import {Context} from './Store'

export const WNotificationBanner = () => {
  const {state, dispatch} = useContext(Context) // as [AppState, Dispatch<Action>];
  const requestNotificationPermission = async () => {
    // ipad workaround
    if (!window.Notification) return

    const handleResult = (result: string) =>
      dispatch({type: 'SET_SETTING', key: 'hasNotificationPermission', value: result === 'granted'})

    const hasPromiseAPI = (function checkNotificationPromise() {
      try {
        Notification.requestPermission().then()
      } catch (e) {
        return false
      }

      return true
    })()

    if (hasPromiseAPI) handleResult(await Notification.requestPermission())
    else Notification.requestPermission(handleResult) // safari
  }

  if (state.settings.hasNotificationPermission || !window.Notification) {
    // permission has granted, or there is no support for notifications
    // => show nothing.
    return <span />
  } else {
    return (
      <div className="WNotificationBanner">
        <button onClick={requestNotificationPermission}>Enable notifications</button>
      </div>
    )
  }
}
