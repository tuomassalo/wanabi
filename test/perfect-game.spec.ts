import {Game} from '../src/game'

import {c, createDeck, knownCard} from './helpers'

describe('A perfect two-player game without any hints or discards', () => {
  const g = new Game(['Bonnie', 'Clyde'], {
    deck: createDeck(
      `
    A1 B1 C1 D1 A1
    B1 B1 C1 D1 A2
    A3 A4 A5
  ` + ['B', 'C', 'E', 'X'].flatMap(c => [1, 2, 3, 4, 5].map(n => c + n)).join(' '),
      // NB: No idea why vscode claims that flatMap does not exist  on type 'string[]'
    ),
  })
  it('should have correct setup', () => {
    expect(g.getState(g.players[0].id)).toEqual({
      stockSize: 50,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {A: [], B: [], C: [], D: [], E: [], X: []},
      inTurn: 0,
      score: 0,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: true,
          hand: [{}, {}, {}, {}, {}],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: false,
          hand: [c.B1, c.B1, c.C1, c.D1, c.A2],
        },
      ],
    })
  })
  it('should properly alter state after playing a card', () => {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 4})
    expect(g.getState(g.players[1].id)).toEqual({
      stockSize: 49,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {A: [c.A1], B: [], C: [], D: [], E: [], X: []},
      inTurn: 1,
      score: 1,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          hand: [c.A1, c.B1, c.C1, c.D1, c.A3],
        },
        {
          name: 'Clyde',
          idx: 1,
          isMe: true,
          hand: [{}, {}, {}, {}, {}],
        },
      ],
    })
  })
})
