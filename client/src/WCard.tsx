import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {Card, TColor, TNum} from 'wanabi-engine/dist/card'

declare const wsclient: WebSocketClient

export default class WCard extends React.Component<{card: {color: TColor; num: TNum} | string}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    const card: Card =
      typeof this.props.card === 'string'
        ? Card.fromValueString(this.props.card)
        : new Card((this.props.card as Card).color, (this.props.card as Card).num)

    return <div className={`WCard WCard-${card.color}`}>{card.num}</div>
  }
}
