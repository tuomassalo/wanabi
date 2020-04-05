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

// from https://stackoverflow.com/a/58189464/95357
function unlockAudio() {
  const sound = new Audio('myturn.mp3')

  sound.play()
  sound.pause()
  sound.currentTime = 0

  document.body.removeEventListener('click', unlockAudio)
  document.body.removeEventListener('touchstart', unlockAudio)
}
document.body.addEventListener('click', unlockAudio)
document.body.addEventListener('touchstart', unlockAudio)

const exampleGame: engine.TMaskedGameState = {
  gameId: '123',
  players: [
    {
      id: 'bogus1',
      idx: 0,
      name: 'Jekyll',
      isConnected: true,
    },
    {
      id: 'bogus2',
      idx: 1,
      name: 'Hyde',
      isConnected: true,
    },
  ],
  currentTurn: {
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
    playerHandViews: [
      {
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
  },
  playedActions: [],
}

// when the user is in a game, these are saved to sessionStorage. In case of a reload, the player will auto-rejoin.
interface RejoinParams {
  gameId: string
  playerIdx: number
}

interface CommonState {}
interface LoadingState extends CommonState {
  phase: 'LOADING'
}
interface InMenuState extends CommonState {
  phase: 'IN_MENU'
  games: engine.MaskedGame[]
}
interface InGameState extends CommonState {
  phase: 'IN_GAME'
  game: engine.MaskedGame
}
type AppState = LoadingState | InMenuState | InGameState

export default class App extends React.Component<{}, AppState> {
  wsclient: WebSocketClient

  onSetRejoinParams = (rejoinParams: RejoinParams | undefined) => {
    if (rejoinParams) {
      sessionStorage.setItem('rejoinParams', JSON.stringify(rejoinParams))
    } else {
      sessionStorage.removeItem('rejoinParams')
      document.location.reload()
    }
  }

  constructor(props: any) {
    super(props)
    this.wsclient = new WebSocketClient()
    this.state = {
      phase: 'LOADING',
    }

    const loadedRejoinParams: RejoinParams | undefined = sessionStorage.getItem('rejoinParams')
      ? JSON.parse(sessionStorage.getItem('rejoinParams') as string)
      : undefined

    const myTurnSound = new Audio('myturn.mp3')

    // user setting defaults
    const defaults = {sound: '1'}
    for (const [k, v] of Object.entries(defaults)) {
      if (!localStorage.getItem(k)) localStorage.setItem(k, v)
    }

    if (0) {
      this.state = {
        phase: 'IN_GAME',
        game: new engine.MaskedGame(exampleGame),
      }
      // ;(window as any).gameId = '123'
    } else
      this.wsclient.on('msg', async (data: engine.WebsocketServerMessage) => {
        // console.warn('MSG', data)

        if (data.msg === 'M_GamesState') {
          const activeGameState = data.games.find(g => g.currentTurn.playerHandViews.some(phv => phv.isMe))

          if (activeGameState) {
            // A game was found with this connection.

            const game = new engine.MaskedGame(activeGameState)
            const currentTurn = game.currentTurn

            // only do sound and animation on turn change, not when joining or if someone disconnects/reconnects
            if (
              this.state.phase === 'IN_GAME' &&
              currentTurn.turnNumber === this.state.game.currentTurn.turnNumber + 1
            ) {
              // play a sound if it's my turn
              if (
                currentTurn.status === 'RUNNING' &&
                currentTurn.playerHandViews[currentTurn.inTurn].isMe &&
                localStorage.getItem('sound') === '1'
              ) {
                const promise = myTurnSound.play()
                if (promise !== undefined) {
                  promise.then(() => {}).catch(e => console.error('Error playing myTurnSound', e))
                }
              }
              // do some animation before changing state
              await this.animate(currentTurn.action, this.state.game.currentTurn.inTurn)

              this.setState(
                (state: InGameState): InGameState => {
                  state.game.addTurn(activeGameState.currentTurn)
                  return {
                    phase: 'IN_GAME',
                    game: state.game,
                  }
                },
              )
            } else {
              // something else than just a new turn in this game that the user was already viewing

              this.onSetRejoinParams({
                gameId: game.gameId,
                playerIdx: currentTurn.playerHandViews.findIndex(phv => phv.isMe),
              })

              this.setState((state_): AppState => ({phase: 'IN_GAME', game}))
              ;(window as any).gameId = game.gameId
            }
          } else {
            // This connection is not currently bound to a game.
            // If we have rejoinParams AND the game still exists AND the seat is unoccupied, rejoin.
            // Otherwise, go to the menu.
            if (
              loadedRejoinParams &&
              data.games.find(g => g.gameId === loadedRejoinParams.gameId)?.players[loadedRejoinParams.playerIdx]
                .isConnected === false
            ) {
              this.wsclient.rejoinGame(loadedRejoinParams)
              // do not set state; we will get another message for that
            } else {
              // no active game (or the rejoining was not possible)
              sessionStorage.removeItem('rejoinParams')

              this.setState(
                (state_): AppState => ({
                  phase: 'IN_MENU',
                  games: data.games.map(g => new engine.MaskedGame(g)),
                }),
              )
            }
          }
          // } else if (data.msg === 'M_GameState') {
          //   this.setState(state => {
          //     return {phase: 'IN_GAME', games: data.currentTurn, messages: [...state.messages, data]}
          //   })
        } else if (data.msg === 'M_GameHistory') {
          this.setState(
            (state: InGameState): InGameState => {
              data.previousTurns.forEach(t => state.game.addTurn(t))
              return {
                phase: 'IN_GAME',
                game: state.game,
              }
            },
          )
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
      ) : this.state.game.currentTurn.status === 'WAITING_FOR_PLAYERS' ? (
        <WWaiting game={this.state.game} />
      ) : (
        // RUNNING or GAME_OVER
        <WGame game={this.state.game} onSetRejoinParams={this.onSetRejoinParams} />
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
