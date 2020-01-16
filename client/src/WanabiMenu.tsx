import React from 'react'
import {TMaskedTurnState} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WanabiGameOverview from './WanabiGameOverview'

export default class WanabiMenu extends React.Component<{games: TMaskedTurnState[]}> {
  render() {
    return (
      <div className="WanabiMenu">
        <h1>CHOOSE GAME</h1>
        {this.props.games.map(g => (
          <WanabiGameOverview key={g.gameId} game={g} />
        ))}
      </div>
    )
  }
}
