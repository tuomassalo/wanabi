import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
import {Pile} from 'wanabi-engine/dist/pile'

export default class WDiscardPile extends React.Component<{discardPile: Pile}> {
  render() {
    return (
      <div className="WDiscardPile">
        {/* <h3>Discard Pile</h3> */}
        {this.props.discardPile.cards.map(card => (
          <WCard card={card} />
        ))}
      </div>
    )
  }
}
