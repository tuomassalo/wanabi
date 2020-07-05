import {EventEmitter} from 'events'
import * as game from 'wanabi-engine'
import pako from 'pako'

export class WebSocketClient extends EventEmitter {
  websocket: WebSocket
  opened = false
  latestMessageTimestamp = 0

  queue: {action: string; data: any}[] = []
  constructor() {
    super()
    this.websocket = new WebSocket(process.env.REACT_APP_WS_ENDPOINT as string)

    this.websocket.onclose = ({wasClean, code, reason}) => {
      this.emit('closing', 'CLOSE', {wasClean, code, reason})
      this.opened = false
    }

    this.websocket.onerror = error => {
      console.warn('onerror', error)

      this.emit('error', 'ERROR', 'An error has occurred. See console for details.')
      this.opened = false
    }

    this.websocket.onmessage = ({data}) => {
      this.latestMessageTimestamp = Date.now()
      this.emit('msg', JSON.parse(pako.inflate(data, {to: 'string'})))
    }

    this.websocket.onopen = () => {
      this.latestMessageTimestamp = Date.now()
      this.emit('opened')
      this.opened = true
      setTimeout(() => {
        for (const msg of this.queue) {
          this.send(msg.action, msg.data)
        }
      }, 50)
    }
  }
  send(action: string, data: any) {
    this.latestMessageTimestamp = Date.now()
    if (this.opened) {
      this.websocket.send(JSON.stringify({action, data}))
    } else {
      this.queue.push({action, data})
    }
  }
  disconnect() {
    this.websocket.close()

    console.warn('DISCONNECTED.')

    // If the websocket was disconnected, reload the window. (But not when testing, since jsdom does not implement location.reload().)
    if (!/\bjsdom\b/.test(navigator.userAgent)) setTimeout(() => window.location.reload(), 1000)
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
