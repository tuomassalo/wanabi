import React from 'react'
import {TRefinedHintResultState} from './refiner'
import {TNum, TColor} from 'wanabi-engine/dist/card'

// from https://www.npmjs.com/package/react-popper-tooltip#quick-start

interface TRawHintResultState {
  is: TNum | TColor
  result: boolean
}

export default class WHint extends React.Component<{
  hint: TRefinedHintResultState | TRawHintResultState
  highlight?: boolean
}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    const h = this.props.hint
    return (
      <div className={`WHint WHint-${h.result} ${this.props.highlight ? 'WIsLatestAction' : ''}`}>
        {typeof h.is === 'number' ? <div>{h.is}</div> : <div className={`WColor-${h.is}`}>&nbsp;</div>}
      </div>
    )
  }
}
