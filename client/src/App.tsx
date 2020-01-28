import React from 'react'
import {WebSocketClient} from './websocketclient'
import * as engine from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WWaiting from './WWaiting'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WGame from './WGame'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMenu from './WMenu'

declare const wsclient: WebSocketClient

const exampleTurn: engine.TMaskedTurnState = {
  gameId: '123',
  timestamp: '2020-01-01',
  action: {type: 'DISCARD', cardIdx: 1, card: 'E2'},
  stockSize: 60 - 2 * 5 - 2 * 24, // === 2
  discardPile: ['A3', 'A4', 'C3', 'A1', 'X4'],
  hintCount: 9,
  woundCount: 0,
  table: {
    A: 'A1,A2,A3,A4,A5'.split(','),
    B: 'B1,B2,B3,B4,B5'.split(','),
    C: [],
    // C: 'C1,C2,C3,C4,C5'.split(','),
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
      hand: [
        {
          color: 'E',
          num: 5,
          hints: [
            {turnNumber: 1, is: 5, result: true},
            {turnNumber: 2, is: 1, result: false},
          ],
        },
        {color: 'X', num: 1, hints: [{turnNumber: 1, is: 1, result: true}]},
        {color: 'A', num: 2, hints: []},
        {color: 'B', num: 2, hints: []},
        {color: 'X', num: 4, hints: []},
      ],
    },
    {
      name: 'Hyde',
      idx: 1,
      isMe: true,
      hand: [
        {
          hints: [
            {turnNumber: 1, is: 'A', result: false},
            {turnNumber: 2, is: 'C', result: true},
            {turnNumber: 3, is: 'D', result: false},
            {turnNumber: 4, is: 2, result: true},
          ],
          color: 'C',
          num: 2,
        },
        {
          hints: [
            {turnNumber: 1, is: 'C', result: false},
            {turnNumber: 2, is: 2, result: true},
          ],
          num: 2,
          possibleCards: [
            {value: 'D2', weight: 1},
            {value: 'E2', weight: 2},
          ],
        },
        {
          hints: [
            {turnNumber: 1, is: 'C', result: true},
            {turnNumber: 2, is: 'D', result: false},
          ],
          color: 'C',
          possibleCards: [
            {value: 'C2', weight: 1},
            {value: 'C3', weight: 2},
          ],
        },
        {
          hints: [{turnNumber: 1, is: 'C', result: true}],
          possibleCards: [
            {value: 'C2', weight: 1},
            {value: 'C3', weight: 2},
            {value: 'X3', weight: 2},
          ],
        },
        {hints: []},
      ],
    },
  ],
}

interface CommonState {
  messages: engine.WebsocketServerMessage[]
}
interface InMenuState extends CommonState {
  phase: 'IN_MENU'
  games: engine.MaskedTurn[]
}
interface InGameState extends CommonState {
  phase: 'IN_GAME'
  currentTurn: engine.MaskedTurn
}
type AppState = InMenuState | InGameState

export default class App extends React.Component<{}, AppState> {
  wsclient: WebSocketClient

  constructor(props: any) {
    super(props)
    this.wsclient = new WebSocketClient()
    this.state = {messages: [], phase: 'IN_MENU', games: []}

    if (0) {
      this.state = {
        phase: 'IN_GAME',
        currentTurn: new engine.MaskedTurn(exampleTurn),
        messages: [],
      }
      ;(window as any).gameId = '123'
    } else
      this.wsclient.on('msg', (data: engine.WebsocketServerMessage) => {
        if (data.msg === 'M_GamesState') {
          const currentTurn = data.games.find(t => t.players.some(p => p.isMe))

          if (currentTurn) {
            this.setState(state => {
              return {phase: 'IN_GAME', currentTurn, messages: [...state.messages, data]}
            })
            ;(window as any).gameId = currentTurn.gameId
          } else
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
        {/* {this.state.phase} */}
        {phaseComponent}
        {/* <header className="App-header">
          <ul>
            {this.state.messages.map(msg => (
              <li key={msg.timestamp}>MSG: {JSON.stringify(msg)}</li>
            ))}
          </ul>
        </header> */}
      </div>
    )
  }
}
