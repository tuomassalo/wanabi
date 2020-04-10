// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {useContext, Dispatch} from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WActionDescription from './WActionDescription'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Popup from 'reactjs-popup'

import {Context} from './Store'
import {InGameState, Action} from './Reducer'

document.body.addEventListener('keydown', (event) => {
  if (event.keyCode === 37) {
    // left
    document.getElementById('prev-turn-button')?.click()
    event.preventDefault()
  } else if (event.keyCode === 39) {
    // right
    document.getElementById('next-turn-button')?.click()
    event.preventDefault()
  }
})

export default function WTurnSelector() {
  const {state, dispatch} = useContext(Context) as {state: InGameState; dispatch: Dispatch<Action>}

  const cur = state.visibleTurnNumber
  const button = (mod: number, label: string, id: string) => {
    return (
      <input
        id={id}
        disabled={cur + mod < 0 || cur + mod > state.game.currentTurn.turnNumber}
        type="button"
        value={label}
        onClick={() => dispatch({type: 'SET_VISIBLE_TURN', turnNumber: cur + mod})}
      />
    )
  }
  return (
    <span>
      {button(-1, '<', 'prev-turn-button')}
      <Popup
        position="bottom left"
        trigger={
          <span className="WTurnSelector-label">
            Turn: <b>{cur}</b> ▼
          </span>
        }
      >
        <div className="WTurnSelector">
          <table>
            <tbody>
              {state.game.turns.map((t) => (
                <tr
                  key={t.turnNumber}
                  className={t.turnNumber === cur ? 'visible-turn' : ''}
                  onClick={() => dispatch({type: 'SET_VISIBLE_TURN', turnNumber: t.turnNumber})}
                >
                  <td>
                    Turn <b>{t.turnNumber}</b>
                  </td>
                  <td>{t.turnNumber ? state.game.players[(t.turnNumber - 1) % state.game.players.length].name : ''}</td>
                  <td className="WActionDescription">
                    <WActionDescription action={t.action} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Popup>
      {button(+1, '>', 'next-turn-button')}
    </span>
  )
}
