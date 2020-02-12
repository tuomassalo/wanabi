import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {TColor, TNum} from 'wanabi-engine/dist/card'

declare const wsclient: WebSocketClient

export default class WCard extends React.Component<{card: {color: TColor; num: TNum}; isLatestAction?: boolean}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className={`WCard WColor-${this.props.card.color} ${this.props.isLatestAction ? 'WIsLatestAction' : ''}`}>
        {this.props.card.num}
      </div>
    )
  }
}
