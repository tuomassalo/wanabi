import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {Card, TActionability} from 'wanabi-engine/dist/card'
import {TRefinedMaskedCardState} from './refiner'

export default class WMysteryCard extends React.Component<{card: TRefinedMaskedCardState}> {
  render() {
    const {color, num, possibleCards, was} = this.props.card
    const allPossibleCards: {card: Card; prob: number; actionability?: TActionability}[][] = (possibleCards || []).map(
      pc =>
        Array(pc.count).fill({
          card: Card.fromValueString(pc.value),
          // prob: pc.prob / pc.count,
          actionability: pc.actionability,
        }),
    )
    if (allPossibleCards.length > 1) {
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

      const wasCls = (card: Card) => {
        if (was) {
          return card.num === was.num && card.color === was.color ? 'WWasCard' : 'WWasntCard'
        } else {
          return ''
        }
      }

      return (
        <div
          className={
            // `WCard-${this.props.card.actionability} ` +
            'WMysteryCard ' + (allPossibleCards.length > 4 ? 'WUpToNinePossibleCards' : 'WUpToFourPossibleCards')
          }
        >
          {/* NB: bogus index, might break animations */}
          {allPossibleCards.map((pcs, idx0) => {
            return (
              <div key={idx0} className={wasCls(pcs[0].card)}>
                {pcs
                  .map((pc, idx1) =>
                    idx1 === 0 ? (
                      <div
                        key={`${idx0}_${idx1}`}
                        className={`WCard WColor-${pc.card.color} WCard-${
                          pc.actionability || this.props.card.actionability
                        }`}
                      >
                        {pc.card.num}
                      </div>
                    ) : (
                      <div
                        key={`${idx0}_${idx1}`}
                        className={`WCard WCard-stacked WCard-stacked-${idx1} WColor-${pc.card.color}`}
                      />
                    ),
                  )
                  .reverse()}
              </div>
            )
          })}
        </div>
      )
      // }
    } else {
      // the card is completely known OR completely unknown.
      return was && !(color && num) ? (
        <div className={`WCard WMysteryCard WWasCard WColor-${was.color}`}>{was.num}</div>
      ) : (
        <div className={`WCard WCard-${this.props.card.actionability} WMysteryCard WColor-${color}`}>
          {num || '\xa0'}
        </div>
      )
    }
  }
}
