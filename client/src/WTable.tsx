import React from 'react'
import {Table} from 'wanabi-engine/dist/table'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'
import {TResolvedActionState} from 'wanabi-engine'

export default class WTable extends React.Component<{table: Table; latestAction: TResolvedActionState}> {
  render() {
    return (
      <div className="WTable">
        {Object.entries(this.props.table.table).map(([color, pile]) => (
          <div key={color} className={`WPile WPile-${color}`}>
            <div className={`WCardPlaceHolder xWCardPlaceHolder-${color} WColor-${color}`}>&nbsp;</div>
            {pile.cards.map(card => (
              <WCard
                key={card.value}
                card={card}
                isLatestAction={
                  this.props.latestAction.type === 'PLAY' &&
                  this.props.latestAction.success &&
                  this.props.latestAction.card === card.value
                }
              />
            ))}
          </div>
        ))}
      </div>
    )
  }
}
