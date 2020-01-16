import React from 'react'
import {TPlayerState} from 'wanabi-engine/dist/player'

export default class WanabiPlayerList extends React.Component<{players: TPlayerState[]}> {
  render() {
    return (
      <ul className="WanabiPlayerList">
        {this.props.players.map(p => (
          <li key={p.idx}>{p.name}</li>
        ))}
      </ul>
    )
  }
}
