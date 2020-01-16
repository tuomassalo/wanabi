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
    this.state = {messages: []}
    this.wsclient.on('msg', (...args) =>
      this.setState(state => ({
        messages: [...state.messages, JSON.stringify(args)],
      })),
    )
  }
  // connect = () => {
  // }
  createGame = () => this.wsclient.createGame({firstPlayerName: 'Foobar'})
  getGamesState = () => this.wsclient.getGamesState({})
  // getGameState = () =>     this.wsclient.getGameState({})
  render() {
    return (
      <div className="App">
        <header className="App-header">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          {/* <input type="button" onClick={this.connect} value="connect" /> */}
          <input type="button" onClick={this.createGame} value="createGame" />
          <input type="button" onClick={this.getGamesState} value="getGamesState" />
          {/* <input type="button" onClick={this.getGameState} value="getGameState" /> */}
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
