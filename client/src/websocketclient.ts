import {EventEmitter} from 'events'

export class WebSocketClient extends EventEmitter {
  // messages: string[] = []
  websocket: WebSocket

  constructor() {
    super()
    const endpoint = 'ws://localhost:3001'
    this.websocket = new WebSocket(endpoint)
  }

  connect() {
    /*
     * See https://html.spec.whatwg.org/multipage/indices.html#events-2
     * for details around each WebSocket event type.
     */

    // WebSocket sends a message to API Gateway on creation that gets
    // routed to the '$connect' route

    this.websocket.onclose = ({wasClean, code, reason}) => {
      this.emit('closing', 'CLOSE', {wasClean, code, reason})
    }

    this.websocket.onerror = error => {
      console.log(error)
      this.emit('error', 'ERROR', 'An error has occurred. See console for details.')
    }

    this.websocket.onmessage = ({data}) => {
      this.emit('msg', data)
    }

    this.websocket.onopen = () => {
      this.emit('opened')
    }
  }
  send() {
    // this.emit('msg', 'client:    Sending a message.')

    this.websocket.send(
      // This message will be routed to 'routeA' based on the 'action'
      // property
      JSON.stringify({action: 'routeA', data: 'Hello from client.'}),
    )
    // this.websocket.send(
    //   // This message will be routed to the '$default' route as 'routeB'
    //   // has not been defined
    //   JSON.stringify({action: 'routeB', data: 'Hello from client.'}),
    // )
  }
  disconnect() {
    // WebSocket sends a message to API Gateway that gets routed to the
    // '$disconnect' route.
    // this.emit('closed', 'Closing the connection.')
    this.websocket.close()
  }
}
