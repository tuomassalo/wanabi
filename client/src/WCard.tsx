import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {Card} from 'wanabi-engine/dist/card'

declare const wsclient: WebSocketClient

export default class WCard extends React.Component<{card: Card}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return <div className={`WCard WCard-${this.props.card.color}`}>{this.props.card.num}</div>
  }
}
