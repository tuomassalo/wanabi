import React from 'react'

import {WebSocketClient} from './websocketclient'
import {MaskedGame} from 'wanabi-engine'

declare const wsclient: WebSocketClient

export default class WPlayerList extends React.Component<{game: MaskedGame}> {
  render() {
    const rejoin = (playerIdx: number) => {
      wsclient.rejoinGame({gameId: this.props.game.gameId, playerIdx})
    }
    const amIInThisGame = this.props.game.currentTurn.playerHandViews.some(p => p.isMe)
    return (
      <ul className="WPlayerList">
        {this.props.game.players.map(p => (
          <li key={p.idx}>
            {p.name}
            {p.isConnected ? (
              ''
            ) : (
              <span>
                {' 🔌 '}
                {amIInThisGame ? '' : <input type="button" value="rejoin" onClick={() => rejoin(p.idx)} />}
              </span>
            )}
          </li>
        ))}
      </ul>
    )
  }
}
