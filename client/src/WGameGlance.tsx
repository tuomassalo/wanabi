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
    if (this.props.game.status === 'WAITING_FOR_PLAYERS') {
      if (this.props.game.players.length < 5) {
        actionButtons = (
          <div>
            <input type="button" className="major" value="Join game" onClick={this.join} />
          </div>
        )
      }
    } else if (this.props.game.status === 'RUNNING') {
      actionButtons = (
        <div>
          TODO
          {/* <input type="button" value="Re-join game as..." /> */}
        </div>
      )
    }
    return (
      <div className="WGameGlance">
        Players: <WPlayerList turn={this.props.game} />
        {actionButtons}
      </div>
    )
  }
}
