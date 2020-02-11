import React from 'react'
import {THintResultState} from 'wanabi-engine/dist/card'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHint from './WHint'

export default class WHints extends React.Component<{hints: THintResultState[]}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WHints clearfix">
        {this.props.hints.map(h => (
          <WHint hint={h} key={h.turnNumber} />
        ))}
      </div>
    )
  }
}
