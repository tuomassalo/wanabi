import React from 'react'
// import logo from './logo.svg';
import './App.css'
import {WebSocketClient} from './websocketclient'
import {TMaskedTurnState, WebsocketServerMessage} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WWaiting from './WWaiting'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WGame from './WGame'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMenu from './WMenu'

declare const wsclient: WebSocketClient

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

    if (1) {
      this.state = {
        phase: 'IN_GAME',
        currentTurn: {
          gameId: '123',
          timestamp: '2020-01-01',
          action: {type: 'DISCARD', cardIdx: 1, card: 'E2'},
          stockSize: 60 - 2 * 5 - 2 * 24, // === 2
          discardPile: [],
          hintCount: 9,
          woundCount: 0,
          table: {
            A: 'A1,A2,A3,A4,A5'.split(','),
            B: 'B1,B2,B3,B4,B5'.split(','),
            C: 'C1,C2,C3,C4,C5'.split(','),
            D: 'D1,D2,D3,D4,D5'.split(','),
            E: 'E1,E2,E3,E4'.split(','),
            X: [],
          },
          turnNumber: 48,
          inTurn: 0,
          turnsLeft: null,
          score: 24,
          status: 'RUNNING',
          players: [
            {
              name: 'Jekyll',
              idx: 0,
              isMe: false,
              completeHandCards: [
                {color: 'E', num: 5, hints: []},
                {color: 'X', num: 1, hints: []},
                {color: 'X', num: 2, hints: []},
                {color: 'X', num: 3, hints: []},
                {color: 'X', num: 4, hints: []},
              ],
              mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
            },
            {
              name: 'Hyde',
              idx: 1,
              isMe: true,
              completeHandCards: [],
              mysteryHandCards: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}],
            },
          ],
        },
        messages: [],
      }
    } else
      this.wsclient.on('msg', (data: WebsocketServerMessage) => {
        if (data.msg === 'M_GamesState') {
          const currentTurn = data.games.find(t => t.players.some(p => p.isMe))

          if (currentTurn)
            this.setState(state => {
              return {phase: 'IN_GAME', currentTurn, messages: [...state.messages, data]}
            })
          else
            this.setState(state => {
              return {phase: 'IN_MENU', games: data.games, messages: [...state.messages, data]}
            })
          // } else if (data.msg === 'M_GameState') {
          //   this.setState(state => {
          //     return {phase: 'IN_GAME', games: data.currentTurn, messages: [...state.messages, data]}
          //   })
        } else {
          console.warn('unknown msg', data)
        }
      })
    ;(window as any).wsclient = this.wsclient
  }

  getGamesState = () => this.wsclient.getGamesState({})
  // getGameState = () =>     this.wsclient.getGameState({})
  componentDidMount() {
    this.getGamesState()
  }
  render() {
    const phaseComponent =
      this.state.phase === 'IN_MENU' ? (
        <WMenu games={this.state.games} />
      ) : this.state.currentTurn.status === 'WAITING_FOR_PLAYERS' ? (
        <WWaiting currentTurn={this.state.currentTurn} />
      ) : (
        <WGame currentTurn={this.state.currentTurn} />
      )
    return (
      <div className="App">
        {this.state.phase}
        {phaseComponent}
        <header className="App-header">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          {/* <input type="button" onClick={this.connect} value="connect" /> */}
          {/* <input type="button" onClick={this.getGamesState} value="getGamesState" /> */}
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
