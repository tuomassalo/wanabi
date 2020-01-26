import React from 'react'
import {THintResultState} from 'wanabi-engine/dist/card'

export default class WHints extends React.Component<{hints: THintResultState[]}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WHints clearfix">
        {this.props.hints.map(h => (
          <div className={`WHint WHint-${h.result}`} key={h.turnNumber}>
            {typeof h.is === 'number' ? <div>{h.is}</div> : <div className={`WColor-${h.is}`}></div>}
          </div>
        ))}
      </div>
    )
  }
}
