import React from 'react'

import {WebSocketClient} from './websocketclient'
import {MaskedCard} from 'wanabi-engine/dist/card'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMysteryCard from './WMysteryCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WLatestAction from './WLatestAction'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMyCardActionButtons from './WMyCardActionButtons'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHints from './WHints'
import {TGameId, TResolvedActionState} from 'wanabi-engine'

declare const wsclient: WebSocketClient
declare const gameId: TGameId

export default class WMyHand extends React.Component<{cards: MaskedCard[]; latestAction?: TResolvedActionState}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WMyHand">
        {this.props.cards.map((c, idx) => (
          <div key={idx}>
            <WMyCardActionButtons cardIdx={idx} />
            <WMysteryCard card={c} />
            <WHints hints={c.hints} />
          </div>
        ))}
        <WLatestAction latestAction={this.props.latestAction} />
      </div>
    )
  }
}
