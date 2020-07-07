import {EventEmitter} from 'events'
import * as game from 'wanabi-engine'
import pako from 'pako'

export class WebSocketClient extends EventEmitter {
  websocket: WebSocket
  retries: number
  state: 'CONNECTING' | 'OPEN' | 'CLOSED' // NB: not real-time
  openTimeout = 5000 // milliseconds
  retryTimer: any // timer id
  latestMessageTimestamp = 0
  id: number = 0

  queue: {action: string; data: any}[] = []

  _createWebsocket() {
    clearInterval(this.retryTimer)
    this.retryTimer = setTimeout(() => {
      this.websocket.close()
      if (--this.retries > 0) {
        console.warn(this.id, 'retrying..., retries=', this.retries)
        this.websocket = this._createWebsocket()

        this.websocket.onclose = ({wasClean, code, reason}) => {
          const idleTime = Date.now() - this.latestMessageTimestamp
          console.warn(this.id, 'onclose', {wasClean, code, reason, idleTime})
          // If the disconnection was due to an idle timeout, emit 'closing'.
          if (idleTime > 9 * 60 * 1000) {
            this.emit('closing')
          } else {
            this.retries = 4
            this.websocket = this._createWebsocket()
            this.emit('reconnecting')
          }
        }

        this.websocket.onerror = error => {
          console.warn(this.id, 'onerror', error)

          this.emit('error', 'ERROR', 'An error has occurred. See console for details.')
        }

        this.websocket.onmessage = ({data}) => {
          this.latestMessageTimestamp = Date.now()
          this.emit('msg', JSON.parse(pako.inflate(data, {to: 'string'})))
        }

        this.websocket.onopen = () => {
          console.warn(this.id, 'Clearing timer id', this.retryTimer)
          clearInterval(this.retryTimer)
          this.latestMessageTimestamp = Date.now()
          this.emit('opened')
          setTimeout(() => {
            for (const msg of this.queue) {
              this.send(msg.action, msg.data)
            }
          }, 50)
        }
      } else {
        console.warn(this.id, 'Not retrying anymore')
        this.emit('closing', 'CLOSE', {wasClean: false})
      }
    }, 5000)
    console.warn('Timer id', this.retryTimer)
    return new WebSocket(process.env.REACT_APP_WS_ENDPOINT as string)
  }

  // getState() {
  //   const states = ['CONNECTING', 'OPEN', 'CLOSED', 'CLOSED'] // NB: mapping CLOSING to CLOSED
  //   return states[this.websocket.readyState]
  // }

  constructor() {
    super()
    this.id = Math.random()
    this.retries = 4
    this.websocket = this._createWebsocket()
    this.state = 'CONNECTING'
    // this.websocket = new WebSocket(process.env.REACT_APP_WS_ENDPOINT as string)
  }
  send(action: string, data: any) {
    this.latestMessageTimestamp = Date.now()
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({action, data}))
    } else if (this.websocket.readyState === WebSocket.CONNECTING) {
      this.queue.push({action, data})
    } else {
      console.warn('websocket is closed, not sending', action, data)
    }
  }
  disconnect() {
    this.websocket.close()

    console.warn('DISCONNECTED.')

    // If the websocket was disconnected, reload the window. (.)
    if (
      // But not when testing, since jsdom does not implement location.reload()
      !/\bjsdom\b/.test(navigator.userAgent)
    ) {
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  // perl -wlne 'print qq!$2(p: game.$1): void { this.send("$2", p) } // prettier-ignore! if /^export interface (WS_(\w+)Params)\b/' ../engine/src/game.ts | pbcopy
  // PASTE AFTER THIS LINE:
  getGamesState(p: game.WS_getGamesStateParams): void { this.send("getGamesState", p) } // prettier-ignore
  createGame(p: game.WS_createGameParams): void { this.send("createGame", p) } // prettier-ignore
  startGame(p: game.WS_startGameParams): void { this.send("startGame", p) } // prettier-ignore
  joinGame(p: game.WS_joinGameParams): void { this.send("joinGame", p) } // prettier-ignore
  rejoinGame(p: game.WS_rejoinGameParams): void { this.send("rejoinGame", p) } // prettier-ignore
  act(p: game.WS_actParams): void { this.send("act", p) } // prettier-ignore
  keepalive(p: game.WS_keepaliveParams): void { this.send("keepalive", p) } // prettier-ignore
}
