import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {TGameId} from 'wanabi-engine'
import {TColor, TNum, AllColors} from 'wanabi-engine/dist/card'

declare const wsclient: WebSocketClient
declare const gameId: TGameId

export default class WMyCardActionButtons extends React.Component<{playerIdx: number}> {
  giveHint = (is: TColor | TNum) => {
    wsclient.act({gameId, actionParams: {type: 'HINT', toPlayerIdx: this.props.playerIdx, is}})
  }

  render() {
    return (
      <div className="WHintButtons">
        Anna vihje:
        {AllColors.filter(c => c !== 'X').map(is => (
          <input type="button" className={`WColor-${is}`} value="" onClick={() => this.giveHint(is)} />
        ))}
        &nbsp; &nbsp;
        {[1, 2, 3, 4, 5].map(is => (
          <input type="button" value={is} />
        ))}
      </div>
    )
  }
}
