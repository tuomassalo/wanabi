import React from 'react'
import {TResolvedActionState} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHint from './WHint'
import {Card} from 'wanabi-engine/dist/card'

// import {MaskedCard, Card} from 'wanabi-engine/dist/card'

export default class WLatestAction extends React.Component<{latestAction?: TResolvedActionState}> {
  render() {
    if (this.props.latestAction) {
      const action = this.props.latestAction

      if (action.type === 'PLAY') {
        return (
          <div className="WLatestAction">
            Played <WCard card={Card.fromValueString(action.card)} />
            {action.success ? '' : ' 👎'}
          </div>
        )
      } else if (action.type === 'DISCARD') {
        return (
          <div className="WLatestAction">
            Discarded <WCard card={Card.fromValueString(action.card)} />
          </div>
        )
      } else if (action.type === 'HINT') {
        return (
          <div className="WLatestAction">
            Hinted {action.toPlayerName}: <WHint hint={{is: action.is, result: true, turnNumber: 0}} />
          </div>
        )
      }
    }
    // otherwise...
    return <span />
  }
}
