import React, {CSSProperties} from 'react'
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
  render() {
    const h = this.props.hint
    const style: CSSProperties = (h as TRefinedHintResultState).turnNumber === -2 ? {visibility: 'hidden'} : {}
    return (
      <div className={`WHint WHint-${h.result} ${this.props.highlight ? 'WIsLatestAction' : ''}`} style={style}>
        {typeof h.is === 'number' ? <div>{h.is}</div> : <div className={`WColor-${h.is}`}>&nbsp;</div>}
      </div>
    )
  }
}
