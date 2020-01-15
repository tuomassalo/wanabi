import React from 'react'
// import logo from './logo.svg';
import './App.css'
import {WebSocketClient} from './websocketclient'

// import {Game} from 'wanabi-engine'

export default class App extends React.Component<{}, {messages: string[]}> {
  wsclient: WebSocketClient

  constructor(props: any) {
    super(props)
    this.wsclient = new WebSocketClient()
    this.wsclient.connect()
    this.state = {messages: []}
    this.wsclient.on('msg', (...args) =>
      this.setState(state => ({
        messages: [...state.messages, JSON.stringify(args)],
      })),
    )
  }
  // connect = () => {
  // }
  send = () => {
    this.wsclient.createGame({firstPlayerName: 'Foobar'})
    // this.wsclient.send('getGamesStatus', {})
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          {/* <input type="button" onClick={this.connect} value="connect" /> */}
          <input type="button" onClick={this.send} value="send!" />
          <ul>
            {this.state.messages.map(msg => (
              <li>MSG: {msg}</li>
            ))}
          </ul>
          {/* <div>{JSON.stringify(new Game({playerNames:['foo','bar']}))}</div> */}
          {/* <TestComponent name="Foobar" foo="123" num={123} /> */}
        </header>
      </div>
    )
  }
}
