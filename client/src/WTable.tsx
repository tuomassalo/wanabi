import React from 'react'
import {Table} from 'wanabi-engine/dist/table'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'

export default class WTable extends React.Component<{table: Table}> {
  render() {
    return (
      <div className="WTable">
        {Object.entries(this.props.table.table).map(([color, pile]) => {
          if (pile.size) {
            return <WCard card={pile.top} />
          } else {
            return <div className={`WCardPlaceHolder xWCardPlaceHolder-${color} WColor-${color}`}>&nbsp;</div>
          }
        })}
      </div>
    )
  }
}
