import React from 'react'

import {WebSocketClient} from './websocketclient'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMysteryCard from './WMysteryCard'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMyCardActionButtons from './WMyCardActionButtons'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHints from './WHints'
import {TGameId} from 'wanabi-engine'
import {TRefinedMaskedCardState} from './refiner'

declare const wsclient: WebSocketClient
declare const gameId: TGameId

export default class WMyHand extends React.Component<{
  cards: TRefinedMaskedCardState[]
  playerIdx: number
  highlightLatestHint: boolean
}> {
  // startGame = () => {
  //   wsclient.startGame({gameId: this.props.currentTurn.gameId})
  // }

  render() {
    return (
      <div className="WMyHand">
        {this.props.cards.map((c, idx) => (
          <div className="WCardContainer" id={`card-${this.props.playerIdx}-${idx}`} key={idx}>
            <WMyCardActionButtons cardIdx={idx} />
            <WMysteryCard card={c} />
            <WHints hints={c.hints} highlightLatestHint={this.props.highlightLatestHint} />
          </div>
        ))}
        {this.props.children}
      </div>
    )
  }
}
