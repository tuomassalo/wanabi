import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WMyCardActionButtons extends React.Component<{cardIdx: number}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div>
        <input type="button" value="Play" />
        <br />
        <input type="button" value="Discard" />
      </div>
    )
  }
}
