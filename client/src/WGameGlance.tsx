import React from 'react'
import {MaskedGame} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WPlayerList from './WPlayerList'
import {WebSocketClient} from './websocketclient'
import {promptPlayerName} from './helpers'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TimeAgo from 'react-timeago'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//@ts-ignore
import timeAgoStrings from 'react-timeago/lib/language-strings/en'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//@ts-ignore
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter'

const formatter = buildFormatter(timeAgoStrings)

declare const wsclient: WebSocketClient

export default class WGameGlance extends React.Component<{game: MaskedGame}> {
  join = () => {
    const newPlayerName: string | undefined = promptPlayerName()
    if (newPlayerName) wsclient.joinGame({gameId: this.props.game.gameId, newPlayerName})
  }
  render() {
    let actionButtons = <div></div>
    let status = <div></div>
    if (this.props.game.currentTurn.status === 'WAITING_FOR_PLAYERS') {
      status = <h4>Waiting for players...</h4>
      if (this.props.game.currentTurn.players.length < 5) {
        actionButtons = (
          <div>
            <input type="button" className="major" value="Join game" onClick={this.join} />
          </div>
        )
      }
    } else if (this.props.game.currentTurn.status === 'RUNNING') {
      status = <h4>Game is running... (turn {this.props.game.currentTurn.turnNumber})</h4>
      // no actions
    } else if (this.props.game.currentTurn.status === 'GAMEOVER') {
      status = <h4>GAME OVER</h4>
    } else if (this.props.game.currentTurn.status === 'FINISHED') {
      status = (
        <h4>
          FINISHED with {this.props.game.currentTurn.score} points and {this.props.game.currentTurn.woundCount}{' '}
          wound(s).
        </h4>
      )
    }
    return (
      <div className={`WGameGlance WGameGlance-${this.props.game.currentTurn.status}`}>
        <span style={{float: 'right'}}>
          <TimeAgo date={this.props.game.currentTurn.timestamp} formatter={formatter} />
        </span>
        {status}
        Players: <WPlayerList gameId={this.props.game.gameId} turn={this.props.game.currentTurn} />
        {actionButtons}
      </div>
    )
  }
}
