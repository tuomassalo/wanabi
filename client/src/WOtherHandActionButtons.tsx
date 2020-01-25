import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WMyCardActionButtons extends React.Component<{playerIdx: number}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WHintButtons">
        Anna vihje:
        {['A', 'B', 'C', 'D', 'E'].map(is => (
          <input type="button" className={`WColor-${is}`} value="" />
        ))}
        &nbsp; &nbsp;
        {[1, 2, 3, 4, 5].map(is => (
          <input type="button" value={is} />
        ))}
      </div>
    )
  }
}
