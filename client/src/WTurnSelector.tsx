import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WActionDescription from './WActionDescription'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Select from 'react-select'

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
    const onChange = ({value}: any) => {
      this.props.onSetVisibleTurnNumber(value)
    }
    const button = (mod: number, label: string) => {
      return (
        <input
          style={{visibility: (cur + mod >= 0 && cur + mod) < this.props.currentTurnNumber ? 'visible' : 'hidden'}}
          type="button"
          value={label}
          onClick={() => this.props.onSetVisibleTurnNumber(cur + mod)}
        />
      )
    }
    return (
      <span>
        {button(-1, '<')}
        <Select
          value={null}
          className="WTurnSelector"
          onChange={onChange}
          isSearchable={false}
          placeholder={`Turn: ${cur}`}
          options={this.props.turns.map(t => ({
            value: t.turnNumber,
            label: (
              <div>
                Turn <b>{t.turnNumber}</b>:
                {t.turnNumber ? this.props.players[(t.turnNumber - 1) % this.props.players.length].name : ''}
                <WActionDescription action={t.action} />
              </div>
            ),
            //`<b>foo</b> ${t.turnNumber} ${t.action.type}`,
          }))}
        />
        {button(+1, '>')}
      </span>
    )
  }
}
