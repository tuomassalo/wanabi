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
    const className = status === 'RUNNING' ? (players[inTurn].isMe ? 'WGame-myturn' : '') : 'WGame-gameover'
    return (
      <div>
        <div className="WHeader">
          <span>
            Vuoro: <em>{turnNumber}</em>
          </span>

          <span>
            Pakassa kortteja: <em>{stockSize}</em>
          </span>

          <span>
            Vihjeitä: <em>{hintCount}</em>
          </span>

          <span>
            Haavoja: <em>{woundCount}</em>
          </span>

          <span style={turnsLeft ? {} : {display: 'none'}}>
            Vuoroja jäljellä: <em>{turnsLeft}</em>
          </span>
        </div>
        <div className={`WGame ${className}`}>
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
                <WOtherHand cards={p.hand.cards as Card[]} playerIdx={p.idx} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
