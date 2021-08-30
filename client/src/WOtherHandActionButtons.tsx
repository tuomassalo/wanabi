import React, {useContext, Dispatch} from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import {WebSocketClient} from './websocketclient'
import {TGameId} from 'wanabi-engine'
import {TColor, TNum, BasicColors, TBasicColor} from 'wanabi-engine/dist/card'
import {Context} from './Store'
import {InGameState, Action} from './Reducer'

declare const wsclient: WebSocketClient
declare const gameId: TGameId

export default function WOtherHandActionButtons({
  playerIdx,
  hintsAvailable,
}: {
  playerIdx: number
  hintsAvailable: boolean
}) {
  const {state, dispatch} = useContext(Context) as {state: InGameState; dispatch: Dispatch<Action>}

  const giveHint = (is: TBasicColor | TNum) => {
    wsclient.act({gameId, actionParams: {type: 'HINT', toPlayerIdx: playerIdx, is}})
  }

  const showSpeculativeHint = (is: TColor | TNum) => {
    dispatch({
      type: 'SHOW_SPECULATIVE_MYSTERY_VIEW',
      playerIdx,
      hand: state.game.currentTurn.getExtraMysticalHandWithSpeculativeHint(playerIdx, is),
    })
  }
  const hideSpeculativeHint = () => {
    dispatch({
      type: 'HIDE_SPECULATIVE_MYSTERY_VIEW',
    })
  }

  return (
    <div className="WHintButtons">
      <div>Give Hint:&nbsp;</div>
      <div>
        {BasicColors.map(is => (
          <input
            key={is}
            type="button"
            disabled={!hintsAvailable}
            className={`WColor-${is}`}
            value=""
            onMouseEnter={() => showSpeculativeHint(is)}
            onMouseLeave={() => hideSpeculativeHint()}
            onClick={() => giveHint(is)}
          />
        ))}
        <br />
        {([1, 2, 3, 4, 5] as TNum[]).map(is => (
          <input
            key={is}
            type="button"
            disabled={!hintsAvailable}
            value={is}
            onMouseEnter={() => showSpeculativeHint(is)}
            onMouseLeave={() => hideSpeculativeHint()}
            onClick={() => giveHint(is)}
          />
        ))}
      </div>
    </div>
  )
}
