import React from 'react'
import {THintResultState} from 'wanabi-engine/dist/card'

export default class WHint extends React.Component<{hint: THintResultState}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    const h = this.props.hint
    return (
      <div className={`WHint WHint-${h.result}`}>
        {typeof h.is === 'number' ? <div>{h.is}</div> : <div className={`WColor-${h.is}`}>&nbsp;</div>}
      </div>
    )
  }
}
