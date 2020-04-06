import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WActionDescription from './WActionDescription'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Popup from 'reactjs-popup'

// const SingleValue = ({ children, ...props }) => (
//   <components.SingleValue {...props}>{children}</components.SingleValue>
// );
import * as engine from 'wanabi-engine'

export default class WTurnSelector extends React.Component<{
  currentVisibleTurnNumber: number
  currentTurnNumber: number
  onSetVisibleTurnNumber: (vtn: number) => void
  turns: engine.MaskedTurn[]
  players: engine.Game['players']
}> {
  render() {
    const cur = this.props.currentVisibleTurnNumber
    const button = (mod: number, label: string) => {
      return (
        <input
          style={{visibility: cur + mod >= 0 && cur + mod <= this.props.currentTurnNumber ? 'visible' : 'hidden'}}
          type="button"
          value={label}
          onClick={() => this.props.onSetVisibleTurnNumber(cur + mod)}
        />
      )
    }
    return (
      <span>
        {button(-1, '<')}
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
                {this.props.turns.map(t => (
                  <tr
                    key={t.turnNumber}
                    className={t.turnNumber === cur ? 'visible-turn' : ''}
                    onClick={() => this.props.onSetVisibleTurnNumber(t.turnNumber)}
                  >
                    <td>
                      Turn <b>{t.turnNumber}</b>
                    </td>
                    <td>
                      {t.turnNumber ? this.props.players[(t.turnNumber - 1) % this.props.players.length].name : ''}
                    </td>
                    <td className="WActionDescription">
                      <WActionDescription action={t.action} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Popup>
        {button(+1, '>')}
      </span>
    )
  }
}
