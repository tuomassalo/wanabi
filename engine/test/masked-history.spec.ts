import {Game, TResolvedPlayActionState} from '../src/game'

import {createDeck, knownCard} from './helpers'
import {MaskedTurn} from '../src/masked-turn'
import {MaskedGame} from '../src/masked-game'

const gameParams = {
  maxHintCount: 8,
  maxWoundCount: 3,
  shufflePlayers: 'SHUFFLE_NONE' as any,
  useRainbow: true,
  useBlack: false,
}

const cards = [
  // p0
  'A1 B1 A5 A2 C3'.split(' '),
  // p1
  'B2 B3 C1 C5 A4'.split(' '),
  // p2
  'X1 B4 D3 C2 A3'.split(' '),
]

describe('A three-player game', () => {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Olga', 'Maria', 'Irina'],
    deck: createDeck(
      [
        cards[0][0],
        cards[1][0],
        cards[2][0],

        cards[0][1],
        cards[1][1],
        cards[2][1],

        cards[0][2],
        cards[1][2],
        cards[2][2],

        cards[0][3],
        cards[1][3],
        cards[2][3],

        cards[0][4],
        cards[1][4],
        cards[2][4],
      ].join(' '),
      gameParams,
    ),
    gameParams,
  })

  // play some cards
  const playAndExpect = (playerIdx: number, cardIdx: number, card: string) => {
    g.act(g.players[playerIdx].id, {type: 'PLAY', cardIdx})
    expect((g.getState(g.players[playerIdx].id).currentTurn.action as TResolvedPlayActionState).card).toEqual(card)
  }

  playAndExpect(0, 0, 'A1')
  playAndExpect(1, 2, 'C1')
  g.act(g.players[2].id, {type: 'HINT', toPlayerIdx: 1, is: 5})
  playAndExpect(0, 0, 'B1')
  playAndExpect(1, 0, 'B2')
  playAndExpect(2, 3, 'C2')
  playAndExpect(0, 1, 'A2')
  playAndExpect(1, 0, 'B3')
  g.act(g.players[2].id, {type: 'DISCARD', cardIdx: 0}) // X1
  playAndExpect(0, 1, 'C3')
  g.act(g.players[1].id, {type: 'HINT', toPlayerIdx: 0, is: 5})
  playAndExpect(2, 1, 'D3') // wound

  const maskedGames = [0, 1, 2].map(playerIdx => {
    const ret = new MaskedGame(g.getState(g.players[playerIdx].id))

    for (const maskedTurn of new Game({game: JSON.parse(JSON.stringify(g)), from: 'SERIALIZED_GAME'})
      .getPreviousTurns(g.players[playerIdx].id)
      .map(t => new MaskedTurn(t, g.players, gameParams).getState())) {
      ret.addTurn(maskedTurn)
    }
    return ret
  })

  const getWases = (playerIdx: number, turnNumber: number) =>
    maskedGames[playerIdx].turns[turnNumber].maskedPlayerViews[playerIdx].hand.map(c => c.was?.value || '__').join(' ')

  it('should show correct `was` values for turn 0', () => {
    expect(getWases(0, 0)).toEqual('A1 B1 __ A2 C3')
    expect(getWases(1, 0)).toEqual('B2 B3 C1 __ __')
    expect(getWases(2, 0)).toEqual('X1 __ D3 C2 __')
  })
})
