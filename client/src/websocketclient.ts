import {EventEmitter} from 'events'
import * as game from 'wanabi-engine'
import pako from 'pako'

const IS_JSDOM = /\bjsdom\b/.test(navigator.userAgent)

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
      // console.warn('retryTimer triggered', this.websocket.readyState)
      this.websocket.close()
      if (--this.retries > 0) {
        console.warn(this.id, 'retrying..., retries=', this.retries)
        this.websocket = this._createWebsocket()
      } else {
        console.warn(this.id, 'Not retrying anymore')
        this.emit('closing', 'CLOSE', {wasClean: false})
      }
    }, this.openTimeout)

    const ws = new WebSocket(process.env.REACT_APP_WS_ENDPOINT as string)

    ws.onclose = ({wasClean, code, reason}) => {
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

    ws.onerror = error => {
      console.warn(this.id, 'onerror', error)
      this.emit('error', 'ERROR', 'An error has occurred. See console for details.')
    }

    ws.onmessage = ({data}) => {
      this.latestMessageTimestamp = Date.now()
      // console.warn('MSG', JSON.parse(pako.inflate(data, {to: 'string'})))
      this.emit('msg', JSON.parse(pako.inflate(data, {to: 'string'})))
    }

    ws.onopen = () => {
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
    console.warn('Timer id', this.retryTimer)
    return ws
  }

  constructor() {
    super()
    this.id = Math.random()
    // console.warn(this.id, 'opening')
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
    // But not when testing, since jsdom does not implement location.reload()
    if (!IS_JSDOM) {
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
