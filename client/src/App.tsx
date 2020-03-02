import React from 'react'
import {WebSocketClient} from './websocketclient'
import * as engine from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WWaiting from './WWaiting'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WGame from './WGame'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMenu from './WMenu'
import {AllColors, TColor, Card} from 'wanabi-engine/dist/card'

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
      extraMysticalHand: [], // bogus
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

    if (0) {
      this.state = {
        phase: 'IN_GAME',
        currentTurn: new engine.MaskedTurn(exampleTurn),
        messages: [],
      }
      ;(window as any).gameId = '123'
    } else
      this.wsclient.on('msg', async (data: engine.WebsocketServerMessage) => {
        // console.warn('MSG', data)

        if (data.msg === 'M_GamesState') {
          const currentTurnRaw = data.games.find(t => t.players.some(p => p.isMe))

          if (currentTurnRaw) {
            const currentTurn = new engine.MaskedTurn(currentTurnRaw)
            // only do animation on turn change, not when joining or if someone disconnects/reconnects
            if (this.state.phase === 'IN_GAME' && currentTurn.turnNumber === this.state.currentTurn.turnNumber + 1) {
              // do some animation before changing state
              await this.animate(currentTurn.action, this.state.currentTurn.inTurn)
            }
            this.setState(
              (state): AppState => {
                return {
                  phase: 'IN_GAME',
                  currentTurn,
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

  componentDidMount() {
    this.getGamesState()
  }
  async animate(action: engine.TResolvedActionState, playerIdx: number) {
    // only animate plays and discards
    if (!(action.type === 'PLAY' || action.type === 'DISCARD')) return

    const playedCard = new Card(action.card)

    const waitForAnimation = async (elem: HTMLElement) => {
      await new Promise(r => {
        elem.addEventListener('animationend', r, {once: true})
      })
    }

    const createGhost = async (cardIdx: number) => {
      const orig = document.querySelector(
        `#card-${playerIdx}-${cardIdx} > .WCard, #card-${playerIdx}-${cardIdx} > .WMysteryCard`,
      ) as HTMLDivElement
      const ghostBounds = orig.getBoundingClientRect()

      const ghostCard = orig.cloneNode(true) as HTMLDivElement
      const ghost = document.createElement('div')
      ghost.appendChild(ghostCard)
      document.body.appendChild(ghost)
      orig.style.visibility = 'hidden'

      ghost.style.width = ghostBounds.width + 'px'
      ghost.style.height = ghostBounds.height + 'px'
      ghost.style.left = ghostBounds.left + document.documentElement.scrollLeft + 'px'
      ghost.style.top = ghostBounds.top + document.documentElement.scrollTop + 'px'

      // if the card is not known yet, "flip" the clone first
      if (1 && !(orig.classList.contains('WColor-' + playedCard.color) && orig.textContent === '' + playedCard.num)) {
        // const ghost = ghost.querySelector('.WCard') as HTMLElement
        // first part of the flip
        ghost.classList.add('WCard-flip-1')

        await waitForAnimation(ghostCard)
        ghost.classList.remove('WCard-flip-1')

        // Now the ghost has been flipped 90 degrees, so it's invisible. Add information.
        ghostCard.className = `WCard WColor-${playedCard.color}`
        ghostCard.textContent = '' + playedCard.num

        ghostCard.classList.add('WCard')
        ghostCard.classList.add('WColor-' + playedCard.color)
        ghostCard.textContent = '' + playedCard.num

        // second part of the flip
        ghost.classList.add('WCard-flip-2')
        await waitForAnimation(ghostCard)
        ghost.classList.remove('WCard-flip-2')
      }

      return {orig, ghost, ghostBounds}
    }

    const findNextDiscardBounds = () => {
      const tmp = document.createElement('div')
      tmp.className = 'WCard'
      tmp.textContent = '0'
      const pile = document.querySelector('.WDiscardPile') as Element
      pile.appendChild(tmp)
      const b = tmp.getBoundingClientRect()
      tmp.remove()
      return b
    }

    const findTablePileBounds = (color: TColor) => {
      const pileIdx = AllColors.findIndex(c => c === color)
      const pileEl = (document.querySelector('.WTable') as HTMLElement).childNodes[pileIdx] as HTMLElement
      return pileEl.getBoundingClientRect()
    }

    // move to table or discard pile
    const dstBounds =
      action.type === 'PLAY' && action.success ? findTablePileBounds(playedCard.color) : findNextDiscardBounds()
    const {orig, ghost, ghostBounds} = await createGhost(action.cardIdx)

    document.documentElement.style.setProperty('--movecardScaleEnd', `${dstBounds.width / ghostBounds.width}`)
    document.documentElement.style.setProperty('--movecardTranslateXEnd', `${dstBounds.left - ghostBounds.left}px`)
    document.documentElement.style.setProperty('--movecardTranslateYEnd', `${dstBounds.top - ghostBounds.top}px`)
    document.documentElement.style.setProperty(
      '--movecardRotateEnd',
      action.type === 'PLAY' && !action.success ? '1080deg' : '0deg',
    )
    ghost.classList.add('WCard-ghost')

    // this is needed, otherwise animationend triggers immediately.
    await new Promise(r => setTimeout(r, 1))

    await waitForAnimation(ghost)

    // Old card has been moved now.

    const cardElems = [0, 1, 2, 3, 4]
      .map(idx => document.getElementById(`card-${playerIdx}-${idx}`))
      .filter(el => el) as HTMLElement[]
    const movingCards = cardElems.filter((el, idx) => idx > action.cardIdx)
    if (movingCards.length) {
      const cardDstOffsetXEnd = cardElems[0].getBoundingClientRect().left - cardElems[1].getBoundingClientRect().left
      document.documentElement.style.setProperty('--cardDstOffsetXEnd', `${cardDstOffsetXEnd}px`)
      for (const c of movingCards) {
        c.classList.add('WCard-slide-left')
      }
      await waitForAnimation(movingCards[0])
    }

    // cleanup
    ghost.remove()
    orig.style.visibility = 'visible'
    for (const c of movingCards) {
      c.classList.remove('WCard-slide-left')
    }
  }
  render() {
    if (this.state.phase === 'LOADING') {
      return (
        <div className="WSpinner">
          <Loader type="TailSpin" color="#fff5" height={100} width={100} />
        </div>
      )
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
