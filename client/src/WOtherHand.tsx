import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WCard from './WCard'

import {WebSocketClient} from './websocketclient'
import {THandCardState} from 'wanabi-engine/dist/card'

declare const wsclient: WebSocketClient

export default class WOtherHand extends React.Component<{cards: THandCardState[]}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WOtherHand">
        {this.props.cards.map(c => (
          <WCard key={Math.random()} card={{color: c.color, num: c.num}} />
        ))}
      </div>
    )
  }
}
