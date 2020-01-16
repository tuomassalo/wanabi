import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {TMyHandCardState} from 'wanabi-engine/dist/card'

declare const wsclient: WebSocketClient

export default class WMyHand extends React.Component<{cards: TMyHandCardState[]}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WMyHand">
        {this.props.cards.map(c => (
          <div>
            {c.color}
            {c.num}
          </div>
        ))}
      </div>
    )
  }
}
