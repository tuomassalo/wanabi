import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMyHand from './WMyHand'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHand from './WOtherHand'
import {WebSocketClient} from './websocketclient'
import * as engine from 'wanabi-engine'

declare const wsclient: WebSocketClient

export default class WGame extends React.Component<{currentTurn: engine.MaskedTurn}> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.currentTurn.gameId})
  }

  render() {
    // const currentPlayerCount = this.props.currentTurn.players.length
    const {
      players,
      // table,
      // stockSize,
      // discardPile,
      // woundCount,
      // hintCount,
      // turnsLeft,
      inTurn,
    } = this.props.currentTurn
    ;(window as any).PLA = players
    return (
      <div className="WGame">
        {players.map((p, idx) => (
          <div className={`WPlayer ${idx === inTurn ? 'WPlayer-inturn' : ''}`}>
            <h3>{p.name}</h3>
            {p.isMe ? <WMyHand cards={p.getMysteryHandCards()} /> : <WOtherHand cards={p.completeHandCards} />}
          </div>
        ))}
      </div>
    )
  }
}
