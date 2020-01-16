import React from 'react'
import {TMaskedTurnState} from 'wanabi-engine'
import WanabiPlayerList from './WanabiPlayerList'

export default class WanabiGameOverview extends React.Component<{game: TMaskedTurnState}> {
  render() {
    const actionButtons = {
      WAITING_FOR_PLAYERS: (
        <div>
          <input type="button" value="Join game" />
        </div>
      ),
      RUNNING: (
        <div>
          <input type="button" value="Re-join game as..." />
        </div>
      ),
      GAMEOVER: '',
      FINISHED: '',
    }
    return (
      <div className="WanabiGameOverview">
        [{this.props.game.status}]
        <br />
        Players: <WanabiPlayerList players={this.props.game.players} />
        {actionButtons[this.props.game.status]}
      </div>
    )
  }
}
