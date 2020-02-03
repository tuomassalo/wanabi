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
import {Card} from 'wanabi-engine/dist/card'
declare const wsclient: WebSocketClient

export default class WGame extends React.Component<{currentTurn: engine.MaskedTurn}> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.currentTurn.gameId})
  }

  render() {
    // const currentPlayerCount = this.props.currentTurn.players.length
    const {
      status,
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
    let gameClasses = 'WGame'
    if (status === 'RUNNING') {
      if (players[inTurn].isMe) {
        gameClasses += ' WGame-myturn'
      }
    } else if (status === 'GAMEOVER') {
      gameClasses += 'WGame-gameover'
    } else {
      // finished
      gameClasses += 'WGame-finished'
    }
    return (
      <div>
        <div className="WHeader">
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

          <span style={turnsLeft ? {} : {display: 'none'}}>
            Turns left: <em>{turnsLeft}</em>
          </span>
        </div>
        <div className={gameClasses}>
          <div className="clearfix">
            <WDiscardPile discardPile={discardPile} />
            <WTable table={table} />
          </div>
          {players.map(p => (
            <div key={p.idx} className={`WPlayer ${p.idx === inTurn ? 'WPlayer-inturn' : ''}`}>
              <h3>
                {p.name}
                {p.isConnected ? '' : ' 🔌 '}
              </h3>
              {p.isMe ? (
                <WMyHand cards={p.hand.cards} />
              ) : (
                <WOtherHand cards={p.hand.cards as Card[]} playerIdx={p.idx} hintsAvailable={hintCount > 0} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
