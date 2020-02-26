import {WebSocketClient} from '../src/websocketclient'

let ws1: WebSocketClient, ws2: WebSocketClient

beforeAll(async () => {
  await new Promise(r => setTimeout(r, 100)) // fix obscure race when running all tests
  ws1 = new WebSocketClient()
  ws2 = new WebSocketClient()
})
afterEach(() => {
  ws1.removeAllListeners()
  ws2.removeAllListeners()
})

test('createGame, then disconnect', async done => {
  expect.assertions(2)
  await new Promise(r => setTimeout(r, 100))
  const ws2msgs = [
    // a new game by ws1 appears
    (msg: any) => expect(msg.games.length).toEqual(1),
    // then disappears, when ws1 disconnects
    (msg: any) => expect(msg.games.length).toEqual(0),
  ]
  ws2.on('msg', msg => {
    ;(ws2msgs.shift() as any)(msg)
    if (ws2msgs.length === 0) {
      setTimeout(done, 100)
    }
  })
  ws1.createGame({firstPlayerName: 'BOBBY_TABLES'}) // this wipes the tables in dev
  await new Promise(r => setTimeout(r, 100))
  ws1.disconnect()
})
