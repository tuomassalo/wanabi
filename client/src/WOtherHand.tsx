import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHints from './WHints'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WLatestAction from './WLatestAction'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHandActionButtons from './WOtherHandActionButtons'

import {MaskedCard, Card} from 'wanabi-engine/dist/card'
import {TResolvedActionState} from 'wanabi-engine'

export default class WOtherHand extends React.Component<{
  cards: MaskedCard[]
  playerIdx: number
  hintsAvailable: boolean
  latestAction?: TResolvedActionState
  highlightLatestHint: boolean
}> {
  render() {
    return (
      <div className="WOtherHand">
        {/* NB: bogus index, might break animations */}
        {this.props.cards.map((c, idx) => (
          <div id={`card-${this.props.playerIdx}-${idx}`} key={idx}>
            <WCard key={Math.random()} card={new Card(c.value as string)} actionability={c.actionability} />
            <WHints hints={c.hints} highlightLatestHint={this.props.highlightLatestHint} />
          </div>
        ))}
        <WOtherHandActionButtons playerIdx={this.props.playerIdx} hintsAvailable={this.props.hintsAvailable} />
        <WLatestAction latestAction={this.props.latestAction} />
      </div>
    )
  }
}
