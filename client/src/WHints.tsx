import React from 'react'
import {THintResultState} from 'wanabi-engine/dist/card'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHint from './WHint'

export default class WHints extends React.Component<{hints: THintResultState[]; highlightLatestHint: boolean}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WHints clearfix">
        {this.props.hints.map((h, idx) => (
          <WHint
            hint={h}
            key={h.turnNumber}
            highlight={this.props.highlightLatestHint && idx === this.props.hints.length - 1}
          />
        ))}
      </div>
    )
  }
}
