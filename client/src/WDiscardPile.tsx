import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
import {Pile} from 'wanabi-engine/dist/pile'
import {TResolvedActionState} from 'wanabi-engine'

export default class WDiscardPile extends React.Component<{discardPile: Pile; latestAction: TResolvedActionState}> {
  render() {
    return (
      <div className="WDiscardPile">
        {/* <h3>Discard Pile</h3> */}
        {/* NB: bogus index, might break animations */}
        {this.props.discardPile.cards.map((card, idx) => (
          <WCard
            card={card}
            key={idx}
            isLatestAction={
              idx === this.props.discardPile.cards.length - 1 &&
              ((this.props.latestAction.type === 'PLAY' && this.props.latestAction.success === false) ||
                this.props.latestAction.type === 'DISCARD')
            }
          />
        ))}
      </div>
    )
  }
}
