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
      isConnected: true,
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
      isConnected: true,
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
            {value: 'D2', prob: 1 / 3, count: 1},
            {value: 'E2', prob: 2 / 3, count: 2},
          ],
        },
        {
          hints: [
            {turnNumber: 1, is: 'C', result: true},
            {turnNumber: 2, is: 'D', result: false},
          ],
          color: 'C',
          possibleCards: [
            {value: 'C2', prob: 1 / 3, count: 1},
            {value: 'C3', prob: 2 / 3, count: 2},
          ],
        },
        {
          hints: [{turnNumber: 1, is: 'C', result: true}],
          possibleCards: [
            {value: 'C2', prob: 1 / 5, count: 1},
            {value: 'C3', prob: 2 / 5, count: 2},
            {value: 'X3', prob: 2 / 5, count: 2},
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
interface LoadingState extends CommonState {
  phase: 'LOADING'
}
interface InMenuState extends CommonState {
  phase: 'IN_MENU'
  games: engine.MaskedTurn[]
}
interface InGameState extends CommonState {
  phase: 'IN_GAME'
  currentTurn: engine.MaskedTurn
}
type AppState = LoadingState | InMenuState | InGameState

export default class App extends React.Component<{}, AppState> {
  wsclient: WebSocketClient

  constructor(props: any) {
    super(props)
    this.wsclient = new WebSocketClient()
    this.state = {messages: [], phase: 'LOADING'}

    if (1) {
      this.state = {
        phase: 'IN_GAME',
        currentTurn: new engine.MaskedTurn(exampleTurn),
        messages: [],
      }
      ;(window as any).gameId = '123'
    } else
      this.wsclient.on('msg', (data: engine.WebsocketServerMessage) => {
        // console.warn('MSG', data)

        if (data.msg === 'M_GamesState') {
          const currentTurn = data.games.find(t => t.players.some(p => p.isMe))

          if (currentTurn) {
            this.setState(
              (state): AppState => {
                return {
                  phase: 'IN_GAME',
                  currentTurn: new engine.MaskedTurn(currentTurn),
                  messages: [...state.messages, data],
                }
              },
            )
            ;(window as any).gameId = currentTurn.gameId
          } else
            this.setState(
              (state): AppState => {
                return {
                  phase: 'IN_MENU',
                  games: data.games.map(g => new engine.MaskedTurn(g)),
                  messages: [...state.messages, data],
                }
              },
            )
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
  async componentDidMount() {
    this.getGamesState()

    const consumedCardIdx = 3
    const playerIdx = 0

    const createGhost = (cardIdx: number) => {
      const orig = document.getElementById(`card-${playerIdx}-${cardIdx}`) as HTMLDivElement
      console.warn(111, orig)
      const clone = orig.cloneNode(true) as HTMLDivElement
      clone.classList.add('WCard-ghost')
      const cloneBounds = orig.getBoundingClientRect()
      clone.style.width = cloneBounds.width + 'px'
      clone.style.height = cloneBounds.height + 'px'
      clone.style.left = cloneBounds.left + document.documentElement.scrollLeft + 'px'
      clone.style.top = cloneBounds.top + document.documentElement.scrollTop + 'px'
      orig.style.visibility = 'hidden'

      return {clone, cloneBounds}
    }

    const findNextDiscardBounds = () => {
      const tmp = document.createElement('div')
      tmp.className = 'WCard'
      tmp.textContent = '0'
      const pile = document.querySelector('.WDiscardPile') as Element
      pile.appendChild(tmp)
      const b = tmp.getBoundingClientRect()
      console.warn({b})
      tmp.remove()
      return b
    }

    // move to discard pile
    const dstBounds = findNextDiscardBounds()
    const {clone, cloneBounds} = createGhost(consumedCardIdx)
    document.documentElement.style.setProperty('--movecardScaleEnd', `${dstBounds.width / cloneBounds.width}`)
    document.documentElement.style.setProperty('--movecardTranslateXEnd', `${dstBounds.left - cloneBounds.left}px`)
    document.documentElement.style.setProperty('--movecardTranslateYEnd', `${dstBounds.top - cloneBounds.top}px`)
    document.body.appendChild(clone)

    await new Promise(r => clone.addEventListener('animationend', r, false))

    // Old card has been moved now.

    const cardElems = [0, 1, 2, 3, 4]
      .map(idx => document.getElementById(`card-${playerIdx}-${idx}`))
      .filter(el => el) as HTMLElement[]
    const movingCards = cardElems.filter((el, idx) => idx > consumedCardIdx)
    if (movingCards.length) {
      const cardDstOffsetX = cardElems[0].getBoundingClientRect().left - cardElems[1].getBoundingClientRect().left
      document.documentElement.style.setProperty('--cardDstOffsetX', `${cardDstOffsetX}px`)
      for (const c of movingCards) {
        c.classList.add('WCard-slide-left')
      }
      await new Promise(r => movingCards[0].addEventListener('animationend', r, false))
    }
  }
  render() {
    if (this.state.phase === 'LOADING') {
      return <div></div>
    }
    const phaseComponent =
      this.state.phase === 'IN_MENU' ? (
        <WMenu games={this.state.games} />
      ) : this.state.currentTurn.status === 'WAITING_FOR_PLAYERS' ? (
        <WWaiting currentTurn={this.state.currentTurn} />
      ) : (
        // RUNNING or GAME_OVER
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
