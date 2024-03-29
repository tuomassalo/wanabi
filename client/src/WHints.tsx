import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WHint from './WHint'
import {TRefinedHintResultState} from './refiner'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import TooltipTrigger from 'react-popper-tooltip'
import 'react-popper-tooltip/dist/styles.css'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Tooltip = ({children, tooltip, hideArrow, ...props}: any) => (
  <TooltipTrigger
    {...props}
    trigger={['click', 'hover']}
    tooltip={({arrowRef, tooltipRef, getArrowProps, getTooltipProps, placement}) => (
      <div
        {...getTooltipProps({
          ref: tooltipRef,
          className: 'tooltip-container',
        })}
      >
        {!hideArrow && (
          <div
            {...getArrowProps({
              ref: arrowRef,
              className: 'tooltip-arrow',
              'data-placement': placement,
            })}
          />
        )}
        {tooltip}
      </div>
    )}
  >
    {({getTriggerProps, triggerRef}) => (
      <span
        {...getTriggerProps({
          ref: triggerRef,
          className: 'trigger',
        })}
      >
        {children}
      </span>
    )}
  </TooltipTrigger>
)

export default class WHints extends React.Component<{hints: TRefinedHintResultState[]; highlightLatestHint: boolean}> {
  render() {
    // add a "visibility: none" bogus hint as the last one if no speculative hint is given
    const hints = [...this.props.hints]
    if (hints[hints.length - 1]?.turnNumber !== -1) {
      hints.push({turnNumber: -2, turnsAgo: 0, is: 'A', hinterName: '', result: false})
    }
    return (
      <div className="WHints clearfix">
        {hints
          // .filter(h => h.turnNumber !== -1) // workaround: do not show speculative hint since it might jump the view on hover
          .map((h, idx) => (
            <Tooltip
              key={h.turnNumber}
              tooltip={`Hinted by ${h.hinterName} on turn ${h.turnNumber} (${
                h.turnsAgo > 1 ? `${h.turnsAgo} turns ago` : 'just now'
              })`}
            >
              <WHint hint={h} highlight={this.props.highlightLatestHint && idx === hints.length - 1} />
            </Tooltip>
          ))}
      </div>
    )
  }
}
