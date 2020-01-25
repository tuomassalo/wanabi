import React from 'react'

import {WebSocketClient} from './websocketclient'
import {MyHandCard} from 'wanabi-engine/dist/card'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMysteryCard from './WMysteryCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMyCardActionButtons from './WMyCardActionButtons'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHints from './WHints'

declare const wsclient: WebSocketClient

export default class WMyHand extends React.Component<{cards: MyHandCard[]}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WMyHand">
        {this.props.cards.map((c, idx) => (
          <div key={idx}>
            <WHints hints={c.hints} />
            <WMysteryCard card={c} />
            <WMyCardActionButtons cardIdx={idx} />
          </div>
        ))}
      </div>
    )
  }
}
