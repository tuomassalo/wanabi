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
    const {color, num, possibleCards} = this.props.card
    const allPossibleCards = (possibleCards || []).flatMap(pc => Array(pc.weight).fill(pc))
    if (allPossibleCards.length > 1 && allPossibleCards.length < 10) {
      // if (num) {
      //   // we know the number, but there are different possible colors. Create a gradient to show them all
      //   const mysteryGradient = {}
      //   return (
      //     <div style={mysteryGradient} className={`WCard WMysteryCard WMysteryCard-${color}`}>
      //       {num || '\xa0'}
      //     </div>
      //   )
      // } else {
      // show a collection of miniature cards
      return (
        <div className={allPossibleCards.length > 4 ? 'WUpToNinePossibleCards' : 'WUpToFourPossibleCards'}>
          {allPossibleCards.map(pc => (
            <div className={`WCard WColor-${pc.color}`}>{pc.num}</div>
          ))}
        </div>
      )
      // }
    } else {
      // too many possible cards - we only know color or num or neither

      return <div className={`WCard WMysteryCard WColor-${color}`}>{num || '\xa0'}</div>
    }
  }
}
