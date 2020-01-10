import {EventEmitter} from 'events'

export class WebSocketClient extends EventEmitter {
  endpoint: string
  // messages: string[] = []
  websocket: WebSocket

  constructor(endpoint: string) {
    super()
    this.endpoint = endpoint
    this.websocket = new WebSocket(this.endpoint)
  }

  connect() {
    /*
     * See https://html.spec.whatwg.org/multipage/indices.html#events-2
     * for details around each WebSocket event type.
     */

    // WebSocket sends a message to API Gateway on creation that gets
    // routed to the '$connect' route

    this.websocket.onclose = ({wasClean, code, reason}) => {
      this.emit('msg', `onclose:   ${JSON.stringify({wasClean, code, reason})}`)
    }

    this.websocket.onerror = error => {
      console.log(error)
      this.emit('msg', 'onerror:   An error has occurred. See console for details.')
    }

    this.websocket.onmessage = ({data}) => {
      this.emit('msg', `onmessage: ${data}`)
    }

    this.websocket.onopen = () => {
      this.emit('msg', 'onopen:    Connected successfully.')
    }
  }
  send() {
    this.emit('msg', 'client:    Sending a message.')

    this.websocket.send(
      // This message will be routed to 'routeA' based on the 'action'
      // property
      JSON.stringify({action: 'routeA', data: 'Hello from client.'}),
    )
    this.websocket.send(
      // This message will be routed to the '$default' route as 'routeB'
      // has not been defined
      JSON.stringify({action: 'routeB', data: 'Hello from client.'}),
    )
  }
  disconnect() {
    // WebSocket sends a message to API Gateway that gets routed to the
    // '$disconnect' route.
    this.emit('msg', 'client:    Closing the connection.')
    this.websocket.close()
  }
}
