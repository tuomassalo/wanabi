import {Game} from '../src/game'

import {c, createDeck, knownCard} from './helpers'
import {Card} from '../src/card'

function dbg(g: Game) {
  for (const [key, cards] of Object.entries({
    // stock: g.stock.cards,
    hand0: g.players[0].hand.cards,
    hand1: g.players[1].hand.cards,
  })) {
    console.warn(
      'DBG',
      key,
      cards.map(c => c.toString()),
    )
  }
}

describe('A perfect two-player game without any hints or discards', () => {
  const g = new Game(['Bonnie', 'Clyde'], {
    deck: createDeck(
      `
    A1 B1 C1 D1 A1
    A1 B1 C1 D1 A2
    A3 A4 A5
  ` +
        ['B', 'C', 'D', 'E', 'X'].flatMap(c => [1, 2, 3, 4, 5].map(n => c + n)).join(' ') +
        ' B2',
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
          hand: [c.A1, c.B1, c.C1, c.D1, c.A2],
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
  it('should have proper state before the final action', () => {
    // always play the newest card from hand
    for (let i = 1; i <= 28; i++) {
      g.act(g.players[i % 2].id, {type: 'PLAY', cardIdx: 4})
    }
    expect(g.getState(g.players[1].id)).toEqual({
      stockSize: 21,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {
        A: [c.A1, c.A2, c.A3, c.A4, c.A5],
        B: [c.B1, c.B2, c.B3, c.B4, c.B5],
        C: [c.C1, c.C2, c.C3, c.C4, c.C5],
        D: [c.D1, c.D2, c.D3, c.D4, c.D5],
        E: [c.E1, c.E2, c.E3, c.E4, c.E5],
        X: [c.X1, c.X2, c.X3, c.X4],
      },
      inTurn: 1,
      score: 29,
      status: 'RUNNING',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          hand: [c.A1, c.B1, c.C1, c.D1, c.B2],
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
  it('should finish after the last card has been played', () => {
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 4})
    expect(g.getState(g.players[1].id)).toEqual({
      stockSize: 20,
      discardPile: [],
      hintCount: 9,
      woundCount: 0,
      table: {
        A: [c.A1, c.A2, c.A3, c.A4, c.A5],
        B: [c.B1, c.B2, c.B3, c.B4, c.B5],
        C: [c.C1, c.C2, c.C3, c.C4, c.C5],
        D: [c.D1, c.D2, c.D3, c.D4, c.D5],
        E: [c.E1, c.E2, c.E3, c.E4, c.E5],
        X: [c.X1, c.X2, c.X3, c.X4, c.X5],
      },
      inTurn: 0,
      score: 30,
      status: 'FINISHED',
      players: [
        {
          name: 'Bonnie',
          idx: 0,
          isMe: false,
          hand: [c.A1, c.B1, c.C1, c.D1, c.B2],
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
