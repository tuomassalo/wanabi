import React from 'react'
import {MaskedPlayer} from 'wanabi-engine/dist/player'

export default class WPlayerList extends React.Component<{players: MaskedPlayer[]}> {
  render() {
    return (
      <ul className="WPlayerList">
        {this.props.players.map(p => (
          <li key={p.idx}>{p.name}</li>
        ))}
      </ul>
    )
  }
}
