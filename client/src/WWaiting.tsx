import React from 'react'
import {MaskedTurn} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WPlayerList from './WPlayerList'
import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WWaiting extends React.Component<{currentTurn: MaskedTurn}> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.currentTurn.gameId})
  }

  render() {
    const currentPlayerCount = this.props.currentTurn.players.length
    const startButton =
      currentPlayerCount > 1 ? (
        <input type="button" value={`Start a ${currentPlayerCount} player game`} onClick={this.startGame} />
      ) : (
        ''
      )
    return (
      <div className="WWaiting">
        STATUS:{this.props.currentTurn.status}
        Players: <WPlayerList players={this.props.currentTurn.players} />
        {startButton}
      </div>
    )
  }
}
