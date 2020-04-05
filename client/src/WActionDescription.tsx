import React from 'react'
import {TResolvedActionState} from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHint from './WHint'
import {Card} from 'wanabi-engine/dist/card'

// import {MaskedCard, Card} from 'wanabi-engine/dist/card'

export default class WActionDescription extends React.Component<{action: TResolvedActionState}> {
  render() {
    const action = this.props.action

    if (action.type === 'PLAY') {
      return (
        <div className="WActionDescription">
          Played <WCard card={Card.fromValueString(action.card)} />
          {action.success ? '' : ' 👎'}
        </div>
      )
    } else if (action.type === 'DISCARD') {
      return (
        <div className="WActionDescription">
          Discarded <WCard card={Card.fromValueString(action.card)} />
        </div>
      )
    } else if (action.type === 'HINT') {
      return (
        <div className="WActionDescription">
          Hinted {action.toPlayerName}: <WHint hint={{is: action.is, result: true}} />
        </div>
      )
    } else {
      //START
      return <div className="WActionDescription">[GAME STARTED]</div>
    }
  }
}
