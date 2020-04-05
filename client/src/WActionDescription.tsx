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
        <React.Fragment>
          played <WCard card={Card.fromValueString(action.card)} />
          {action.success ? '' : ' 👎'}
        </React.Fragment>
      )
    } else if (action.type === 'DISCARD') {
      return (
        <React.Fragment>
          discarded <WCard card={Card.fromValueString(action.card)} />
        </React.Fragment>
      )
    } else if (action.type === 'HINT') {
      return (
        <React.Fragment>
          hinted {action.toPlayerName}: <WHint hint={{is: action.is, result: true}} />
        </React.Fragment>
      )
    } else {
      //START
      return <div className="WActionDescription">[GAME STARTED]</div>
    }
  }
}
