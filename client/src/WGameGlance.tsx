import React from 'react'
import {MaskedTurn} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WPlayerList from './WPlayerList'
import {WebSocketClient} from './websocketclient'
import {promptPlayerName} from './helpers'
declare const wsclient: WebSocketClient

export default class WGameGlance extends React.Component<{game: MaskedTurn}> {
  join = () => {
    const newPlayerName: string | undefined = promptPlayerName()
    if (newPlayerName) wsclient.joinGame({gameId: this.props.game.gameId, newPlayerName})
  }
  render() {
    let actionButtons = <div></div>
    let status = <div></div>
    if (this.props.game.status === 'WAITING_FOR_PLAYERS') {
      status = <h4>Waiting for players...</h4>
      if (this.props.game.players.length < 5) {
        actionButtons = (
          <div>
            <input type="button" className="major" value="Join game" onClick={this.join} />
          </div>
        )
      }
    } else if (this.props.game.status === 'RUNNING') {
      status = <h4>Game is running... (turn {this.props.game.turnNumber})</h4>
      // no actions
    }
    return (
      <div className="WGameGlance">
        {status}
        Players: <WPlayerList turn={this.props.game} />
        {actionButtons}
      </div>
    )
  }
}
