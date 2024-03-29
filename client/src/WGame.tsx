// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {useContext, Dispatch} from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WTable from './WTable'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WDiscardPile from './WDiscardPile'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMyHand from './WMyHand'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHand from './WOtherHand'
// import {WebSocketClient} from './websocketclient'
import {refineCards} from './refiner'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WTurnSelector from './WTurnSelector'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WActionDescription from './WActionDescription'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WOtherHandActionButtons from './WOtherHandActionButtons'
import {setRejoinParams} from './rejoin-storage'
import {Context} from './Store'
import {InGameState, Action} from './Reducer'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WStats from './WStats'
import {MaskedGame} from 'wanabi-engine/dist/masked-game'
import {MaskedTurn} from 'wanabi-engine/dist/masked-turn'

document.body.addEventListener('keydown', event => {
  if (event.keyCode === 77) {
    // 'm'
    document.getElementById('mystery-view-checkbox')?.click()
    event.preventDefault()
  }
})

export default function WGame({game}: {game: MaskedGame}) {
  const {state, dispatch} = useContext(Context) as {state: InGameState; dispatch: Dispatch<Action>}
  // const {state, dispatch} = useContext(Context) as {state: InGameState; dispatch: Dispatch<Action>}

  // const changeSoundChecked = () => {
  //   if ((window.event as any).target.checked) {
  //     dispatch({type: 'SET_SOUND', enabled: true})
  //     localStorage.setItem('sound', '1')
  //   } else {
  //     dispatch({type: 'SET_SOUND', enabled: false})
  //     localStorage.setItem('sound', '0')
  //   }
  // }

  // console.warn('vTN', state.visibleTurnNumber)

  const visibleTurn: MaskedTurn = game.turns[state.visibleTurnNumber]
  // console.warn('vT', visibleTurn)

  const {
    action,
    status,
    score,
    table,
    maskedPlayerViews,
    stockSize,
    discardPile,
    woundCount,
    hintCount,
    turnsLeft,
    inTurn,
    // turnNumber,
  } = visibleTurn
  // console.warn({vtn: state.visibleTurnNumber, visibleTurn, inTurn, maskedPlayerViews})
  // ;(window as any).g = game // for debugging
  const {players} = game
  let gameStatusClass: string = ''
  if (status === 'RUNNING') {
    if (maskedPlayerViews[inTurn].isMe && visibleTurn === game.currentTurn) {
      gameStatusClass = ' WGameStatus-myturn'
    }
  } else if (status === 'GAMEOVER') {
    gameStatusClass = ' WGameStatus-gameover'
  } else {
    // finished
    gameStatusClass = ' WGameStatus-finished'
  }

  const toggleSetting = (key: 'sound' | 'showStats' | 'showMysteryView') => {
    dispatch({type: 'SET_SETTING', key, value: !state.settings[key]})
  }

  const {maxHintCount, maxWoundCount} = game.gameParams

  return (
    <div className={gameStatusClass}>
      <div className="WHeader">
        <span style={{float: 'right'}}>
          <label>
            <input type="checkbox" onClick={() => toggleSetting('showMysteryView')} id="mystery-view-checkbox" />{' '}
            Mystery View
          </label>
          {/* <label>
            <input type="checkbox" checked={state.settings.sound} onChange={changeSoundChecked} /> Sound
          </label> */}
          {/* exit this game */}
          <label>
            <input type="button" value="X" onClick={() => setRejoinParams(undefined)} />
          </label>
        </span>
        <span>
          {/* Turn:{' '} */}
          <em>
            <WTurnSelector />
          </em>
        </span>
        <span>
          Stock: <em>{stockSize}</em>
        </span>
        <span>
          Hints:{' '}
          <em>
            {hintCount}
            {maxHintCount === 8 ? '' : <span> / {maxHintCount} </span>}
          </em>
        </span>
        <span>
          Wounds:{' '}
          <em>
            {woundCount}
            {maxWoundCount === 3 ? '' : <span> / {maxWoundCount} </span>}
          </em>
        </span>
        <span>
          Score: <em onClick={() => toggleSetting('showStats')}>{score}</em>
        </span>
        <span style={turnsLeft ? {} : {display: 'none'}}>
          Turns left: <em>{turnsLeft}</em>
        </span>
      </div>
      {state.settings.showStats ? <WStats turns={game.turns} players={game.players} /> : ''}
      <div className="WGame">
        {/* IDLE FOR: {+Date.now() - state.idleSince}
        <br></br> */}
        <div className="clearfix">
          <WDiscardPile discardPile={discardPile} latestAction={action} />
          <WTable table={table} latestAction={action} />
        </div>
        {maskedPlayerViews.map((phv, idx) => {
          const player = players[idx]
          const getLatestActionIfByThisPlayer = () =>
            idx === (players.length + inTurn - 1) % players.length && action.type !== 'START' ? (
              <div className="WActionDescription">
                {player.name} <WActionDescription action={action} />
              </div>
            ) : (
              <span />
            )
          const highlightLatestHint = action.type === 'HINT' && action.toPlayerIdx === idx

          const getExtraMysticalHand = () => {
            if (phv.extraMysticalHand) {
              // if (state.speculativeHint) {
              // refineCards(game, game.currentTurn...)
              // } else {
              return refineCards(game, phv.extraMysticalHand)
              // }
            } else {
              return []
            }
          }

          return (
            <div key={idx} className={`WPlayer ${idx === inTurn ? 'WPlayer-inturn' : ''}`}>
              <h3>
                {player.name}
                {player.isConnected ? '' : ' 🔌 '}
              </h3>
              {phv.isMe ? (
                <WMyHand cards={refineCards(game, phv.hand)} playerIdx={idx} highlightLatestHint={highlightLatestHint}>
                  {getLatestActionIfByThisPlayer()}
                </WMyHand>
              ) : (
                <WOtherHand
                  cards={
                    state.speculativeMysteryView && state.speculativeMysteryView.playerIdx === idx
                      ? JSON.parse(JSON.stringify(state.speculativeMysteryView.hand))
                      : state.settings.showMysteryView
                      ? getExtraMysticalHand()
                      : refineCards(game, phv.hand)
                  }
                  playerIdx={idx}
                  hintsAvailable={hintCount > 0}
                  highlightLatestHint={highlightLatestHint}
                >
                  <WOtherHandActionButtons playerIdx={idx} hintsAvailable={hintCount > 0} />
                  {getLatestActionIfByThisPlayer()}
                </WOtherHand>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
