import {EventEmitter} from 'events'
import * as game from 'wanabi-engine'

export class WebSocketClient extends EventEmitter {
  // messages: string[] = []
  websocket: WebSocket
  opened = false
  queue: {action: string; data: any}[] = []
  constructor() {
    super()
    const endpoint = 'ws://localhost:3001'
    this.websocket = new WebSocket(endpoint)

    this.websocket.onclose = ({wasClean, code, reason}) => {
      this.emit('closing', 'CLOSE', {wasClean, code, reason})
    }

    this.websocket.onerror = error => {
      console.warn('onerror', error)

      this.emit('error', 'ERROR', 'An error has occurred. See console for details.')
    }

    this.websocket.onmessage = ({data}) => {
      this.emit('msg', JSON.parse(data))
    }

    this.websocket.onopen = () => {
      this.emit('opened')
      this.opened = true
      setTimeout(() => {
        for (const msg of this.queue) {
          this.send(msg.action, msg.data)
        }
      }, 1000)
    }
  }
  send(action: string, data: any) {
    if (this.opened) {
      this.websocket.send(JSON.stringify({action, data}))
    } else {
      this.queue.push({action, data})
    }
  }
  disconnect() {
    this.websocket.close()
    setTimeout(() => window.location.reload(), 1000)
  }

  // perl -wlne 'print qq!$2(p: game.$1): void { this.send("$2", p) } // prettier-ignore! if /interface (WS_(\w+)Params)\b/' ../engine/src/game.ts | pbcopy
  // PASTE AFTER THIS LINE:
  getGamesState(p: game.WS_getGamesStateParams): void { this.send("getGamesState", p) } // prettier-ignore
  getGameState(p: game.WS_getGameStateParams): void { this.send("getGameState", p) } // prettier-ignore
  createGame(p: game.WS_createGameParams): void { this.send("createGame", p) } // prettier-ignore
  startGame(p: game.WS_startGameParams): void { this.send("startGame", p) } // prettier-ignore
  joinGame(p: game.WS_joinGameParams): void { this.send("joinGame", p) } // prettier-ignore
  rejoinGame(p: game.WS_rejoinGameParams): void { this.send("rejoinGame", p) } // prettier-ignore
  act(p: game.WS_actParams): void { this.send("act", p) } // prettier-ignore
}
