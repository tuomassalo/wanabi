import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {MaskedCard, Card, TActionability} from 'wanabi-engine/dist/card'

export default class WMysteryCard extends React.Component<{card: MaskedCard}> {
  render() {
    const {color, num, possibleCards} = this.props.card
    const allPossibleCards: {card: Card; prob: number; actionability?: TActionability}[] = (
      possibleCards || []
    ).flatMap(pc =>
      Array(pc.count).fill({
        card: Card.fromValueString(pc.value),
        prob: pc.prob / pc.count,
        actionability: pc.actionability,
      }),
    )
    if (allPossibleCards.length > 1 && allPossibleCards.length < 10) {
      // if (num) {
      //   // we know the number, but there are different possible colors. Create a gradient to show them all
      //   const mysteryGradient = {}
      //   return (
      //     <div style={mysteryGradient} className={`WCard WMysteryCard WMysteryCard-${color}`}>
      //       {num || '\xa0'}
      //     </div>
      //   )
      // } else {
      // show a collection of miniature cards
      return (
        <div
          className={
            // `WCard-${this.props.card.actionability} ` +
            allPossibleCards.length > 4 ? 'WUpToNinePossibleCards' : 'WUpToFourPossibleCards'
          }
        >
          {/* NB: bogus index, might break animations */}
          {allPossibleCards.map((pc, idx) => (
            <div
              key={idx}
              className={`WCard WColor-${pc.card.color} WCard-${pc.actionability || this.props.card.actionability}`}
            >
              {pc.card.num}
            </div>
          ))}
        </div>
      )
      // }
    } else {
      // too many possible cards - we only know color or num or neither

      return (
        <div className={`WCard WCard-${this.props.card.actionability} WMysteryCard WColor-${color}`}>
          {num || '\xa0'}
        </div>
      )
    }
  }
}
