import {WebSocketClient} from '../src/websocketclient'

test('connect', done => {
  expect.assertions(1)
  const ws = new WebSocketClient()
  ws.connect()
  // NB: needs the closure.
  ws.on('closing', () => done())
  ws.on('msg', msg => {
    expect(msg).toEqual('HELLO')
    ws.disconnect()
  })
})
