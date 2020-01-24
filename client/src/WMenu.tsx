import React from 'react'
import {MaskedTurn} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WGameOverview from './WGameOverview'
import {promptPlayerName} from './helpers'
import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WMenu extends React.Component<{games: MaskedTurn[]}> {
  createGame = () => {
    wsclient.createGame({firstPlayerName: promptPlayerName()})
  }
  render() {
    return (
      <div className="WMenu">
        <input type="button" onClick={this.createGame} value="Create a new game" />
        <h1>CHOOSE GAME</h1>
        {this.props.games.map(g => (
          <WGameOverview key={g.gameId} game={g} />
        ))}
      </div>
    )
  }
}
