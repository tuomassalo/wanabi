// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import {useContext} from 'react'
import {Context} from './Store'
// import {WebSocketClient} from './websocketclient'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WWaiting from './WWaiting'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WGame from './WGame'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WMenu from './WMenu'
import {InMenuState} from './Reducer'

// const exampleGame: engine.TMaskedGameState = {
//   gameId: '123',
//   players: [
//     {
//       id: 'bogus1',
//       idx: 0,
//       name: 'Jekyll',
//       isConnected: true,
//     },
//     {
//       id: 'bogus2',
//       idx: 1,
//       name: 'Hyde',
//       isConnected: true,
//     },
//   ],
//   currentTurn: {
//     timestamp: '2020-01-01',
//     action: {type: 'DISCARD', cardIdx: 1, card: 'E2'},
//     stockSize: 60 - 2 * 5 - 2 * 24, // === 2
//     discardPile: ['A3', 'A4', 'C3', 'A1', 'X4'],
//     hintCount: 9,
//     woundCount: 0,
//     table: {
//       A: 'A1,A2,A3,A4,A5'.split(','),
//       B: 'B1,B2,B3,B4,B5'.split(','),
//       C: [],
//       // C: 'C1,C2,C3,C4,C5'.split(','),
//       D: 'D1,D2,D3,D4,D5'.split(','),
//       E: 'E1,E2,E3,E4'.split(','),
//       X: [],
//     },
//     turnNumber: 48,
//     inTurn: 0,
//     turnsLeft: null,
//     score: 24,
//     status: 'RUNNING',
//     maskedPlayerViews: [
//       {
//         isMe: false,
//         extraMysticalHand: [], // bogus
//         hand: [
//           {
//             color: 'E',
//             num: 5,
//             hints: [
//               {turnNumber: 1, is: 5, result: true},
//               {turnNumber: 2, is: 1, result: false},
//             ],
//           },
//           {color: 'X', num: 1, hints: [{turnNumber: 1, is: 1, result: true}]},
//           {color: 'A', num: 2, hints: []},
//           {color: 'B', num: 2, hints: []},
//           {color: 'X', num: 4, hints: []},
//         ],
//       },
//       {
//         isMe: true,
//         hand: [
//           {
//             hints: [
//               {turnNumber: 1, is: 'A', result: false},
//               {turnNumber: 2, is: 'C', result: true},
//               {turnNumber: 3, is: 'D', result: false},
//               {turnNumber: 4, is: 2, result: true},
//             ],
//             color: 'C',
//             num: 2,
//           },
//           {
//             hints: [
//               {turnNumber: 1, is: 'C', result: false},
//               {turnNumber: 2, is: 2, result: true},
//             ],
//             num: 2,
//             possibleCards: [
//               {value: 'D2', prob: 1 / 3, count: 1},
//               {value: 'E2', prob: 2 / 3, count: 2},
//             ],
//           },
//           {
//             hints: [
//               {turnNumber: 1, is: 'C', result: true},
//               {turnNumber: 2, is: 'D', result: false},
//             ],
//             color: 'C',
//             possibleCards: [
//               {value: 'C2', prob: 1 / 3, count: 1},
//               {value: 'C3', prob: 2 / 3, count: 2},
//             ],
//           },
//           {
//             hints: [{turnNumber: 1, is: 'C', result: true}],
//             possibleCards: [
//               {value: 'C2', prob: 1 / 5, count: 1},
//               {value: 'C3', prob: 2 / 5, count: 2},
//               {value: 'X3', prob: 2 / 5, count: 2},
//             ],
//           },
//           {hints: []},
//         ],
//       },
//     ],
//   },
//   playedActions: [],
// }

export const App = () => {
  const {state} = useContext(Context) // as [AppState, Dispatch<Action>];
  if (state.phase === 'LOADING') {
    return (
      <div className="WSpinner">
        <Loader type="TailSpin" color="#fff5" height={100} width={100} />
      </div>
    )
  } else if (state.phase === 'DISCONNECTED') {
    return (
      <div>
        Disconnected. <input type="button" onClick={() => document.location.reload()} value="Reconnect" />
      </div>
    )
  }
  const phaseComponent =
    state.phase === 'IN_MENU' ? (
      <WMenu games={(state as InMenuState).games} />
    ) : state.game.currentTurn.status === 'WAITING_FOR_PLAYERS' ? (
      <WWaiting game={state.game} />
    ) : (
      // RUNNING or GAME_OVER
      <WGame game={state.game} />
    )
  return (
    <div className="App">
      {/* {state.phase} */}
      {phaseComponent}
      {/* <header className="App-header">
          <ul>
            {state.messages.map(msg => (
              <li key={msg.timestamp}>MSG: {JSON.stringify(msg)}</li>
            ))}
          </ul>
        </header> */}
    </div>
  )
}
