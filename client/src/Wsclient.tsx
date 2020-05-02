// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {useContext} from 'react'
import {Context} from './Store'
import {WebSocketClient} from './websocketclient'
import * as engine from 'wanabi-engine'
import {InGameState} from './Reducer'
import {animate} from './animate'
import {setRejoinParams, getRejoinParams} from './rejoin-storage'
import {MaskedGame} from 'wanabi-engine/dist/masked-game'

// from https://stackoverflow.com/a/58189464/95357
// function unlockAudio() {
//   // const sound = new Audio('myturn.mp3')

//   // sound.play()
//   // sound.pause()
//   // sound.currentTime = 0

//   document.body.removeEventListener('click', unlockAudio)
//   document.body.removeEventListener('touchstart', unlockAudio)
// }
// document.body.addEventListener('click', unlockAudio)
// document.body.addEventListener('touchstart', unlockAudio)

const notify = (msg: string, showWhenForeground: boolean = false) => {
  console.warn('Notify: ' + msg)
  if (showWhenForeground || document.hidden) new Notification('Wanabi', {body: msg})
}

export const Wsclient = () => {
  const {state, dispatch} = useContext(Context) // as [AppState, Dispatch<Action>];

  const getState = () => state

  const w = window as any // just to fool typescript

  // hacky as hell: define a function that handles incoming websocket messages, BUT
  // redefine it every time this function runs. With this maneuver, we have a fresh
  // copy of `state` in the handler.

  w.msgHandler = async (data: engine.WebsocketServerMessage) => {
    // console.warn('WSSM', data)

    if (data.msg === 'M_GameState') {
      // const activeGameState = data.games.find(g => g.currentTurn.maskedPlayerViews.some(phv => phv.isMe))

      // if (activeGameState) {
      // A game was found with this connection.

      const game = new MaskedGame(data.game)
      const currentTurn = game.currentTurn

      if (state.phase === 'IN_GAME' && currentTurn.turnNumber > 0) {
        if (currentTurn.turnNumber === state.game.currentTurn.turnNumber + 1) {
          notify('New turn!')

          // This is a new turn in the active game. Only do sound and animation on
          // turn change, not when joining or if someone disconnects/reconnects
          if (
            currentTurn.status === 'RUNNING' &&
            currentTurn.maskedPlayerViews[currentTurn.inTurn].isMe &&
            localStorage.getItem('sound') === '1'
          ) {
            const myTurnSound = new Audio('myturn.mp3')
            const promise = myTurnSound.play()
            if (promise !== undefined) {
              promise.then(() => {}).catch(e => console.error('Error playing myTurnSound', e))
            }
          }
          if (currentTurn.turnNumber === state.visibleTurnNumber + 1) {
            // do some animation before changing state, but only if the player is viewing the current turn.
            await animate(currentTurn.action, state.game.currentTurn.inTurn, currentTurn.score === 30)
          }

          dispatch({type: 'ADD_TURN', turn: data.game.currentTurn})
        } else {
          // console.warn('not new turn')

          // someone disconnecting / rejoining: update game state, but preserve turn history.
          // NB! For now, only update the isConnected attributes.
          for (const p of state.game.players) {
            p.isConnected = game.players[p.idx].isConnected
          }
          dispatch({type: 'SET_GAME', game: state.game})
        }
      } else {
        if (state.phase === 'IN_GAME') {
          // implies turnNumber === 0
          notify('Game starting...?')
        }

        // something else than just a new turn in this game that the user was already viewing
        // console.warn('not in game')

        setRejoinParams({
          gameId: game.gameId,
          playerIdx: currentTurn.maskedPlayerViews.findIndex(phv => phv.isMe),
        })

        dispatch({type: 'SET_GAME', game})
        w.gameId = game.gameId
      }
    } else if (data.msg === 'M_GamesState') {
      // This connection is not currently bound to a game.
      // If we have rejoinParams AND the game still exists AND the seat is unoccupied, rejoin.
      // Otherwise, go to the menu.
      const rejoinParams = getRejoinParams()
      if (
        rejoinParams &&
        data.games.find(g => g.gameId === rejoinParams.gameId)?.players[rejoinParams.playerIdx].isConnected === false
      ) {
        w.wsclient.rejoinGame(rejoinParams)
        // do not set state; we will get another message for that
      } else {
        // no active game (or the rejoining was not possible)
        sessionStorage.removeItem('rejoinParams')

        dispatch({type: 'SET_GAMES', games: data.games.map(g => new MaskedGame(g))})
      }
    } else if (data.msg === 'M_GameHistory') {
      data.previousTurns.forEach(t => (getState() as InGameState).game.addTurn(t))
      dispatch({type: 'SET_GAME', game: (state as InGameState).game})
    } else {
      console.warn('unknown msg', data)
    }
  }

  const openWebsocket = () => {
    w.wsclient = new WebSocketClient()
    w.wsclient.on('msg', (data: any) => w.msgHandler(data))
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    w.wsclient.on('closing', onConnectionError)
    w.wsclient.on('error', () => notify('Connection error?', true))

    // query the state
    w.wsclient.getGamesState({})
  }

  const onConnectionError = async (ev: any) => {
    console.warn('onConnectionError', ev)
    notify('Connection error?', true)
    dispatch({type: 'SET_LOADING'})
    while (true) {
      if (!w.wsclient.opened) {
        openWebsocket()
        break
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  if (!(window as any).wsclient) {
    openWebsocket()
  }

  return <div></div>
}
