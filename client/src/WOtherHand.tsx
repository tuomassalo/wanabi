import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMysteryCard from './WMysteryCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHints from './WHints'
import {Card} from 'wanabi-engine/dist/card'
import {TRefinedMaskedCardState} from './refiner'

export default class WOtherHand extends React.Component<{
  cards: TRefinedMaskedCardState[]
  playerIdx: number
  hintsAvailable: boolean
  extraMysticalHand: TRefinedMaskedCardState[]
  highlightLatestHint: boolean
}> {
  render() {
    return (
      <div className="WOtherHand">
        {/* NB: bogus index, might break animations */}
        {this.props.cards.map((c, idx) => (
          <div className="WCardContainer" id={`card-${this.props.playerIdx}-${idx}`} key={idx}>
            <WCard key={Math.random()} card={new Card(c.value as string)} actionability={c.actionability} />
            <WMysteryCard card={this.props.extraMysticalHand[idx]} />
            <WHints hints={c.hints} highlightLatestHint={this.props.highlightLatestHint} />
          </div>
        ))}
        {this.props.children}
      </div>
    )
  }
}
