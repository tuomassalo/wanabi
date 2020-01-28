import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHints from './WHints'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHandActionButtons from './WOtherHandActionButtons'

import {Card} from 'wanabi-engine/dist/card'

export default class WOtherHand extends React.Component<{cards: Card[]; playerIdx: number}> {
  render() {
    return (
      <div className="WOtherHand">
        {/* NB: bogus index, might break animations */}
        {this.props.cards.map((c, idx) => (
          <div key={idx}>
            <WCard key={Math.random()} card={c} />
            <WHints hints={c.hints} />
          </div>
        ))}
        <WOtherHandActionButtons playerIdx={this.props.playerIdx} />
      </div>
    )
  }
}
