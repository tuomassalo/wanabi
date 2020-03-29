import React from 'react'

import {WebSocketClient} from './websocketclient'
import {MaskedTurn, TGameId} from 'wanabi-engine'

declare const wsclient: WebSocketClient

export default class WPlayerList extends React.Component<{gameId: TGameId; turn: MaskedTurn}> {
  render() {
    const {players} = this.props.turn
    const rejoin = (playerIdx: number) => {
      wsclient.rejoinGame({gameId: this.props.gameId, playerIdx})
    }
    const amIInThisGame = players.some(p => p.isMe)
    return (
      <ul className="WPlayerList">
        {players.map(p => (
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
