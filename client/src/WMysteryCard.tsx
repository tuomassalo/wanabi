import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {MyHandCard} from 'wanabi-engine/dist/card'

declare const wsclient: WebSocketClient

export default class WMysteryCard extends React.Component<{card: MyHandCard}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className={`WCard WMysteryCard WMysteryCard-${this.props.card.color}`}>{this.props.card.num || '?'}</div>
    )
  }
}
