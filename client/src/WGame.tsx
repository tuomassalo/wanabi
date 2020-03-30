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

export default class WGame extends React.Component<{game: engine.MaskedGame}, {soundChecked: boolean}> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.game.gameId})
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
      table,
      playerHandViews,
      stockSize,
      discardPile,
      woundCount,
      hintCount,
      turnsLeft,
      inTurn,
      turnNumber,
    } = this.props.game.currentTurn
    const {players} = this.props.game
    let gameStatusClass: string = ''
    if (status === 'RUNNING') {
      if (playerHandViews[inTurn].isMe) {
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
          {playerHandViews.map((phv, idx) => {
            const player = players[idx]
            const getLatestActionIfByThisPlayer = () =>
              idx === (players.length + inTurn - 1) % players.length ? (
                <WLatestAction latestAction={action} />
              ) : (
                <span />
              )
            const highlightLatestHint = action.type === 'HINT' && action.toPlayerIdx === idx

            return (
              <div key={idx} className={`WPlayer ${idx === inTurn ? 'WPlayer-inturn' : ''}`}>
                <h3>
                  {player.name}
                  {player.isConnected ? '' : ' 🔌 '}
                </h3>
                {phv.isMe ? (
                  <WMyHand
                    cards={refineCards(this.props.game, phv.hand.cards)}
                    playerIdx={idx}
                    highlightLatestHint={highlightLatestHint}
                  >
                    {getLatestActionIfByThisPlayer()}
                  </WMyHand>
                ) : (
                  <WOtherHand
                    cards={refineCards(this.props.game, phv.hand.cards)}
                    extraMysticalHand={
                      phv.extraMysticalHand ? refineCards(this.props.game, phv.extraMysticalHand.cards) : []
                    }
                    playerIdx={idx}
                    hintsAvailable={hintCount > 0}
                    highlightLatestHint={highlightLatestHint}
                  >
                    <WOtherHandActionButtons playerIdx={idx} hintsAvailable={hintCount > 0} />
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
