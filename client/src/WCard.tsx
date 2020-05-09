import React from 'react'

import {TColor, TNum, TActionability} from 'wanabi-engine/dist/card'

export default class WCard extends React.Component<{
  card: {color: TColor; num: TNum}
  actionability?: TActionability
  isLatestAction?: boolean
}> {
  render() {
    return (
      <div
        className={`WCard WCard-${this.props.actionability} WColor-${this.props.card.color} ${
          this.props.isLatestAction ? 'WIsLatestAction' : ''
        }`}
      >
        {this.props.card.num}
      </div>
    )
  }
}
