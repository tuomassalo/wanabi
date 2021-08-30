import React from 'react'
import {MaskedGame} from 'wanabi-engine/dist/masked-game'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import WPlayerList from './WPlayerList'
import {WebSocketClient} from './websocketclient'

declare const wsclient: WebSocketClient

export default class WWaiting extends React.Component<{game: MaskedGame}> {
  startGame = () => {
    wsclient.startGame({gameId: this.props.game.gameId})
  }

  render() {
    const currentPlayerCount = this.props.game.players.length
    const startButton =
      currentPlayerCount > 1 ? (
        <input
          className="major"
          type="button"
          value={`Start a ${currentPlayerCount} player game`}
          onClick={this.startGame}
        />
      ) : (
        ''
      )

    const setParams = (key: string) => (evt: React.FormEvent<HTMLInputElement>) => {
      const val =
        evt.currentTarget.type === 'number'
          ? parseInt(evt.currentTarget.value, 10)
          : evt.currentTarget.type === 'checkbox'
          ? evt.currentTarget.checked
          : evt.currentTarget.value
      // console.warn('setting', {key, val})
      const gameParams = {...this.props.game.gameParams, [key]: val}
      wsclient.setGameParams({gameId: this.props.game.gameId, gameParams})
    }

    return (
      <div className="WWaiting">
        <h3>Waiting for players...</h3>
        Players: <WPlayerList game={this.props.game} />
        {startButton}
        <hr />
        <h2>Parameters</h2>
        <ul>
          <li>
            <label>
              <input
                type="checkbox"
                checked={this.props.game.gameParams.useRainbow}
                onChange={setParams('useRainbow')}
              />{' '}
              Use Rainbow cards
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" checked={this.props.game.gameParams.useBlack} onChange={setParams('useBlack')} />{' '}
              Use Black Powder cards
            </label>
          </li>
          <li>
            Hints:{' '}
            <input
              type="number"
              min="1"
              max="10"
              value={this.props.game.gameParams.maxHintCount}
              onChange={setParams('maxHintCount')}
            />{' '}
            (initial and maximum)
          </li>
          <li>
            Game over after{' '}
            <input
              type="number"
              min="1"
              max="5"
              value={this.props.game.gameParams.maxWoundCount}
              onChange={setParams('maxWoundCount')}
            />{' '}
            wounds
          </li>
          <li>
            Player shuffling:
            {[
              {value: 'SHUFFLE_NONE', label: 'No shuffling'},
              {value: 'SHUFFLE_RANDOMIZE', label: 'Shuffle player order'},
              {value: 'SHUFFLE_RANDOMIZE_AND_ANONYMIZE', label: 'Shuffle player order and anonymize player names'},
            ].map(o => (
              <label key={o.value}>
                <input
                  type="radio"
                  value={o.value}
                  checked={this.props.game.gameParams.shufflePlayers === o.value}
                  onChange={setParams('shufflePlayers')}
                />{' '}
                {o.label}
              </label>
            ))}
          </li>
        </ul>
      </div>
    )
  }
}
