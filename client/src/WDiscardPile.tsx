import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
import {Pile} from 'wanabi-engine/dist/pile'

export default class WDiscardPile extends React.Component<{discardPile: Pile}> {
  render() {
    return (
      <div className="WDiscardPile">
        <h2>Discard Pile</h2>
        {this.props.discardPile.cards.map(card => (
          <WCard card={card} />
        ))}
      </div>
    )
  }
}
