import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {TGameId} from 'wanabi-engine'

declare const wsclient: WebSocketClient
declare const gameId: TGameId

export default class WMyCardActionButtons extends React.Component<{cardIdx: number}> {
  playCard = () => {
    wsclient.act({gameId, actionParams: {type: 'PLAY', cardIdx: this.props.cardIdx}})
  }
  discardCard = () => {
    wsclient.act({gameId, actionParams: {type: 'DISCARD', cardIdx: this.props.cardIdx}})
  }

  render() {
    return (
      <div className="WMyCardActionButtons">
        <input type="button" value="Play" onClick={this.playCard} />
        <br />
        <input type="button" value="Discard" onClick={this.discardCard} />
      </div>
    )
  }
}
