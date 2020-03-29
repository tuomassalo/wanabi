import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WTable from './WTable'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WDiscardPile from './WDiscardPile'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMyHand from './WMyHand'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHand from './WOtherHand'
import {WebSocketClient} from './websocketclient'
import * as engine from 'wanabi-engine'
import {refineCards} from './refiner'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WLatestAction from './WLatestAction'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHandActionButtons from './WOtherHandActionButtons'
declare const wsclient: WebSocketClient

export default class WGame extends React.Component<
  {gameId: engine.TGameId; currentTurn: engine.MaskedTurn},
  {soundChecked: boolean}
> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.gameId})
  }

  constructor(props: any) {
    super(props)
    this.state = {
      soundChecked: localStorage.getItem('sound') === '1',
    }
  }

  changeSoundChecked = () => {
    if ((window.event as any).target.checked) {
      this.setState({soundChecked: true})
      localStorage.setItem('sound', '1')
    } else {
      this.setState({soundChecked: false})
      localStorage.setItem('sound', '0')
    }
  }

  render() {
    // const currentPlayerCount = this.props.currentTurn.players.length
    const {
      action,
      status,
      score,
      players,
      table,
      stockSize,
      discardPile,
      woundCount,
      hintCount,
      turnsLeft,
      inTurn,
      turnNumber,
    } = this.props.currentTurn
    let gameStatusClass: string = ''
    if (status === 'RUNNING') {
      if (players[inTurn].isMe) {
        gameStatusClass = ' WGameStatus-myturn'
      }
    } else if (status === 'GAMEOVER') {
      gameStatusClass = ' WGameStatus-gameover'
    } else {
      // finished
      gameStatusClass = ' WGameStatus-finished'
    }

    return (
      <div className={gameStatusClass}>
        <div className="WHeader">
          <span style={{float: 'right'}}>
            <label>
              <input type="checkbox" onClick={() => document.body.classList.toggle('mysteryview')} /> Mystery View
            </label>
            <label>
              <input type="checkbox" checked={this.state.soundChecked} onChange={this.changeSoundChecked} /> Sound
            </label>
          </span>
          <span>
            Turn: <em>{turnNumber}</em>
          </span>
          <span>
            Stock: <em>{stockSize}</em>
          </span>
          <span>
            Hints: <em>{hintCount}</em>
          </span>
          <span>
            Wounds: <em>{woundCount}</em>
          </span>
          <span>
            Score: <em>{score}</em>
          </span>
          <span style={turnsLeft ? {} : {display: 'none'}}>
            Turns left: <em>{turnsLeft}</em>
          </span>
        </div>
        <div className="WGame">
          <div className="clearfix">
            <WDiscardPile discardPile={discardPile} latestAction={action} />
            <WTable table={table} latestAction={action} />
          </div>
          {players.map(p => {
            const getLatestActionIfByThisPlayer = () =>
              p.idx === (players.length + inTurn - 1) % players.length ? (
                <WLatestAction latestAction={action} />
              ) : (
                <span />
              )
            const highlightLatestHint = action.type === 'HINT' && action.toPlayerIdx === p.idx

            return (
              <div key={p.idx} className={`WPlayer ${p.idx === inTurn ? 'WPlayer-inturn' : ''}`}>
                <h3>
                  {p.name}
                  {p.isConnected ? '' : ' 🔌 '}
                </h3>
                {p.isMe ? (
                  <WMyHand
                    cards={refineCards(this.props.currentTurn, p.hand.cards)}
                    playerIdx={p.idx}
                    highlightLatestHint={highlightLatestHint}
                  >
                    {getLatestActionIfByThisPlayer()}
                  </WMyHand>
                ) : (
                  <WOtherHand
                    cards={refineCards(this.props.currentTurn, p.hand.cards)}
                    extraMysticalHand={
                      p.extraMysticalHand ? refineCards(this.props.currentTurn, p.extraMysticalHand.cards) : []
                    }
                    playerIdx={p.idx}
                    hintsAvailable={hintCount > 0}
                    highlightLatestHint={highlightLatestHint}
                  >
                    <WOtherHandActionButtons playerIdx={p.idx} hintsAvailable={hintCount > 0} />
                    {getLatestActionIfByThisPlayer()}
                  </WOtherHand>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
