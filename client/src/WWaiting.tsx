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
        <input
          className="major"
          type="button"
          value={`Start a ${currentPlayerCount} player game`}
          onClick={this.startGame}
        />
      ) : (
        ''
      )
    return (
      <div className="WWaiting">
        <h3>Waiting for players...</h3>
        Players: <WPlayerList turn={this.props.currentTurn} />
        {startButton}
      </div>
    )
  }
}
