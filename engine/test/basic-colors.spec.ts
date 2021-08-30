import {createDeck} from './helpers'
import {DeckParams, Game} from '../src/game'

const gameParams = {
  maxHintCount: 8,
  maxWoundCount: 3,
  shufflePlayers: 'SHUFFLE_NONE' as any,
  useRainbow: false, // NB!
  useBlack: false,
}

function createTestGame() {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Thelma', 'Louise'],
    deck: createDeck(
      //  p0 p1
      `   A1 B1
          A1 B1
          A2 C1
          A3 A4
          A4 B5
          
          B3 C3 D3
          `,
      gameParams,
    ),
    gameParams,
  })
  // First, let's give some hints.
  g.act(g.players[0].id, {type: 'HINT', is: 1, toPlayerIdx: 1})
  g.act(g.players[1].id, {type: 'HINT', is: 1, toPlayerIdx: 0})
  g.act(g.players[0].id, {type: 'HINT', is: 'A', toPlayerIdx: 1})
  g.act(g.players[1].id, {type: 'HINT', is: 'A', toPlayerIdx: 0})

  // p0 always plays the oldest card from hand, p1 always discards
  for (let i = 1; i <= 3; i++) {
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
  }
  return g
}

describe('Basic game', () => {
  const g = createTestGame()
  it('should not show rainbow or black cards in table', () => {
    expect(g.getState(g.players[0].id)).toEqual({
      currentTurn: {
        action: {card: 'C1', cardIdx: 0, type: 'DISCARD'},
        discardPile: ['B1', 'A1', 'B1', 'C1'],
        hintCount: 7,
        inTurn: 0,
        maskedPlayerViews: jasmine.any(Array),
        score: 2,
        status: 'RUNNING',
        stockSize: 34, // NB: no rainbow or black cards
        table: {A: ['A1', 'A2'], B: [], C: [], D: [], E: []}, // ditto
        timestamp: jasmine.any(String),
        turnNumber: 10,
        turnsLeft: null,
        woundCount: 1,
      },
      gameId: g.gameId,
      gameParams: {
        maxHintCount: 8,
        maxWoundCount: 3,
        shufflePlayers: 'SHUFFLE_NONE',
        useBlack: false,
        useRainbow: false,
      },
      playedActions: jasmine.any(Array),
      players: [
        {id: 'bogus_id_Thelma', idx: 0, isConnected: true, name: 'Thelma'},
        {id: 'REDACTED', idx: 1, isConnected: true, name: 'Louise'},
      ],
    })
  })
  it('should not offer rainbow cards in possibleCards', () => {
    expect(g.COMPAT_getMaskedTurnState(g.players[0].id).maskedPlayerViews[0].hand).toEqual([
      {
        color: 'A',
        hints: [
          {is: 1, result: false, turnNumber: 1},
          {is: 'A', result: true, turnNumber: 3},
        ],
        possibleCards: [
          {actionability: 'DISCARDABLE', count: 1, prob: 1 / 4, value: 'A2'},
          {actionability: 'PLAYABLE', count: 1, prob: 1 / 4, value: 'A3'},
          {actionability: 'UNPLAYABLE', count: 1, prob: 1 / 4, value: 'A4'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 4, value: 'A5'},
        ],
      },
      {
        color: 'A',
        hints: [
          {is: 1, result: false, turnNumber: 1},
          {is: 'A', result: true, turnNumber: 3},
        ],
        possibleCards: [
          {actionability: 'DISCARDABLE', count: 1, prob: 1 / 4, value: 'A2'},
          {actionability: 'PLAYABLE', count: 1, prob: 1 / 4, value: 'A3'},
          {actionability: 'UNPLAYABLE', count: 1, prob: 1 / 4, value: 'A4'},
          {actionability: 'UNDISCARDABLE', count: 1, prob: 1 / 4, value: 'A5'},
        ],
      },
      {hints: []},
      {hints: []},
      {hints: []},
    ])
  })
})
