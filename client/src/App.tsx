import React from 'react'
// import logo from './logo.svg';
import './App.css'
import {WebSocketClient} from './websocketclient'
import {TMaskedTurnState, WebsocketServerMessage} from 'wanabi-engine'
import WanabiGame from './WanabiGame'
import WanabiMenu from './WanabiMenu'

// import {Game} from 'wanabi-engine'

interface CommonState {
  messages: WebsocketServerMessage[]
}
interface InMenuState extends CommonState {
  phase: 'IN_MENU'
  games: TMaskedTurnState[]
}
interface InGameState extends CommonState {
  phase: 'IN_GAME'
  currentTurn: TMaskedTurnState
}
type AppState = InMenuState | InGameState

export default class App extends React.Component<{}, AppState> {
  wsclient: WebSocketClient

  constructor(props: any) {
    super(props)
    this.wsclient = new WebSocketClient()
    this.state = {messages: [], phase: 'IN_MENU', games: []}
    this.wsclient.on('msg', (data: WebsocketServerMessage) => {
      if (data.msg === 'M_GamesState') {
        this.setState(state => {
          return {phase: 'IN_MENU', games: data.games, messages: [...state.messages, data]}
        })
      } else if (data.msg === 'M_GameState') {
        this.setState(state => {
          return {phase: 'IN_GAME', games: data.currentTurn, messages: [...state.messages, data]}
        })
      }
    })
  }
  // connect = () => {
  // }
  createGame = () => this.wsclient.createGame({firstPlayerName: 'Foobar'})
  getGamesState = () => this.wsclient.getGamesState({})
  // getGameState = () =>     this.wsclient.getGameState({})
  componentDidMount() {
    this.getGamesState()
  }
  render() {
    const phaseComponent =
      this.state.phase === 'IN_MENU' ? (
        <WanabiMenu games={this.state.games} />
      ) : (
        <WanabiGame currentTurn={this.state.currentTurn} />
      )
    return (
      <div className="App">
        {this.state.phase}
        {phaseComponent}
        <header className="App-header">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          {/* <input type="button" onClick={this.connect} value="connect" /> */}
          <input type="button" onClick={this.createGame} value="createGame" />
          <input type="button" onClick={this.getGamesState} value="getGamesState" />
          {/* <input type="button" onClick={this.getGameState} value="getGameState" /> */}
          <ul>
            {this.state.messages.map(msg => (
              <li key={msg.timestamp}>MSG: {JSON.stringify(msg)}</li>
            ))}
          </ul>
          {/* <div>{JSON.stringify(new Game({playerNames:['foo','bar']}))}</div> */}
          {/* <TestComponent name="Foobar" foo="123" num={123} /> */}
        </header>
      </div>
    )
  }
}
