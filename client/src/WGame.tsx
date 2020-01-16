import React from 'react'
import {TMaskedTurnState} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMyHand from './WMyHand'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHand from './WOtherHand'
import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WGame extends React.Component<{currentTurn: TMaskedTurnState}> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.currentTurn.gameId})
  }

  render() {
    const currentPlayerCount = this.props.currentTurn.players.length
    const {players, table, stockSize, discardPile, woundCount, hintCount, turnsLeft, inTurn} = this.props.currentTurn
    return (
      <div className="WGame">
        {players.map(p =>
          p.isMe ? <WMyHand cards={p.mysteryHandCards} /> : <WOtherHand cards={p.completeHandCards} />,
        )}
      </div>
    )
  }
}
