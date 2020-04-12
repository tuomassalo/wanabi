// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import * as engine from 'wanabi-engine'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Chart from 'react-apexcharts'

export default function WStats({turns, players}: {turns: engine.MaskedTurn[]; players: engine.MaskedGame['players']}) {
  // const {state} = useContext(Context) as {state: InGameState; dispatch: Dispatch<Action>}
  // const {state, dispatch} = useContext(Context) as {state: InGameState; dispatch: Dispatch<Action>}

  // turns not populated yet, return.
  if (!(0 in turns)) {
    return <div></div>
  }

  const turnTimeByPlayer = players.map(p => ({
    name: `time used by ${p.name}`,
    data: turns.map(() => 0),
    // type: 'column',
  }))
  const cumulativeTimeByPlayer = players.map(() => 0)

  let tPrev = new Date(turns[0].timestamp)
  for (const turn of turns.slice(1)) {
    const t = new Date(turn.timestamp)
    const playerIdxInTurn = (turn.turnNumber - 1) % players.length

    for (const {idx} of players) {
      turnTimeByPlayer[idx].data[turn.turnNumber] = cumulativeTimeByPlayer[idx]
    }

    const seconds = Math.round((t.valueOf() - tPrev.valueOf()) / 1000)

    cumulativeTimeByPlayer[playerIdxInTurn] += Math.min(seconds, 100)
    turnTimeByPlayer[playerIdxInTurn].data[turn.turnNumber] = cumulativeTimeByPlayer[playerIdxInTurn]
    // turnTimeByPlayer[playerIdxInTurn].data[turn.turnNumber] = Math.min(
    //   30,
    //   Math.round((t.valueOf() - tPrev.valueOf()) / 1000),
    // )
    tPrev = t
  }

  // const maxCumulativeTime = Math.max(...cumulativeTimeByPlayer)

  const options = {
    chart: {
      id: 'wanabi-stats',
    },
    xaxis: {
      // categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998]
    },
    // yaxis: [
    //   // {
    //   //   seriesName: 'score',
    //   //   labels: {
    //   //     formatter: function (val: number) {
    //   //       return val.toFixed(0)
    //   //     },
    //   //   },
    //   // },
    //   // {
    //   //   seriesName: 'score',
    //   //   show: false,
    //   // },
    //   ...turnTimeByPlayer.map((name) => ({
    //     seriesName: turnTimeByPlayer[0].name,
    //     // opposite: true,
    //     // formatter: function (val: number) {
    //     //   return val.toFixed(0)
    //     // },
    //     show: false,
    //   })),
    // ],
  }

  const series = [
    // {
    //   name: 'score',
    //   data: turns.map((t) => t.score),
    // },
    // {
    //   name: 'discarded',
    //   data: turns.map((t) => t.discardPile.size),
    // },
    ...turnTimeByPlayer,
  ]

  return (
    <div className="WStats">
      <Chart options={options} series={series} type="line" height={320} />
    </div>
  )
}
