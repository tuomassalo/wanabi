import React from 'react'
import {MaskedGame} from 'wanabi-engine/dist/masked-game'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WPlayerList from './WPlayerList'
import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WWaiting extends React.Component<{game: MaskedGame}> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.game.gameId})
  }

  render() {
    const currentPlayerCount = this.props.game.players.length
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
        Players: <WPlayerList game={this.props.game} />
        {startButton}
      </div>
    )
  }
}
