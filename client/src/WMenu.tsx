import React from 'react'
import {MaskedGame} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WGameGlance from './WGameGlance'
import {promptPlayerName} from './helpers'
import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WMenu extends React.Component<{games: MaskedGame[]}> {
  createGame = () => {
    const firstPlayerName: string | undefined = promptPlayerName()
    if (firstPlayerName) wsclient.createGame({firstPlayerName})
  }
  render() {
    return (
      <div className="WMenu">
        {this.props.games.map(g => (
          <WGameGlance key={g.currentTurn.gameId} game={g} />
        ))}
        <input type="button" className="major" onClick={this.createGame} value="Create a new game" />
      </div>
    )
  }
}
