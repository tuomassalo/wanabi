import {createTightGame} from './helpers'
import {Game} from '../src/game'

describe('A game', () => {
  const g = createTightGame()
  it('should be rewindable to the previous turn', () => {
    // p0 always plays the oldest card from hand, p1 always discards

    const turn0 = g.getState(g.players[0].id)
    expect(turn0.currentTurn.stockSize).toEqual(50)

    // First, make some moves
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 3})
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0}) // not playable

    const turn4 = g.getState(g.players[0].id)

    expect(turn4).toEqual({
      currentTurn: {
        action: {card: 'A3', cardIdx: 0, success: false, type: 'PLAY'},
        discardPile: ['A4', 'A3'],
        hintCount: 8,
        inTurn: 0,
        playerHandViews: [
          {hand: [{hints: []}, {hints: []}, {hints: []}, {hints: []}, {hints: []}], isMe: true},
          {
            extraMysticalHand: [
              {hints: [{is: 3, result: false, turnNumber: 2}]},
              {hints: [{is: 3, result: false, turnNumber: 2}]},
              {hints: [{is: 3, result: false, turnNumber: 2}]},
              {hints: [{is: 3, result: false, turnNumber: 2}]},
              {hints: []},
            ],
            hand: [
              {actionability: 'PLAYABLE', color: 'A', hints: [{is: 3, result: false, turnNumber: 2}], num: 2},
              {actionability: 'DISCARDABLE', color: 'A', hints: [{is: 3, result: false, turnNumber: 2}], num: 1},
              {actionability: 'DISCARDABLE', color: 'A', hints: [{is: 3, result: false, turnNumber: 2}], num: 1},
              {actionability: 'UNPLAYABLE', color: 'B', hints: [{is: 3, result: false, turnNumber: 2}], num: 4},
              {actionability: 'UNPLAYABLE', color: 'B', hints: [], num: 2},
            ],
            isMe: false,
          },
        ],
        score: 1,
        status: 'RUNNING',
        stockSize: 47,
        table: {A: ['A1'], B: [], C: [], D: [], E: [], X: []},
        timestamp: jasmine.any(String),
        turnNumber: 4,
        turnsLeft: null,
        woundCount: 1,
      },
      gameId: jasmine.any(String),
      history: {
        playedActions: [
          {action: {type: 'START'}, timestamp: jasmine.any(String)},
          {action: {card: 'A1', cardIdx: 0, success: true, type: 'PLAY'}, timestamp: jasmine.any(String)},
          {action: {card: 'A4', cardIdx: 0, type: 'DISCARD'}, timestamp: jasmine.any(String)},
          {
            action: {
              is: 3,
              toPlayerIdx: 1,
              toPlayerName: 'Hyde',
              type: 'HINT',
              matches: [true, false, false, false, false],
            },
            timestamp: jasmine.any(String),
          },
          {action: {card: 'A3', cardIdx: 0, success: false, type: 'PLAY'}, timestamp: jasmine.any(String)},
        ],
        revealedStock: ['B2', 'B4', 'B1', 'A1', 'A5', 'A1', 'A4', 'A2', 'A3', 'A3', 'A2', 'A4', 'A1'],
      },
      players: [
        {id: 'bogus_id_Jekyll', idx: 0, isConnected: true, name: 'Jekyll'},
        {id: 'REDACTED', idx: 1, isConnected: true, name: 'Hyde'},
      ],
    })

    // Some more actions
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0}) // ok
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'A'})
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 3}) // not playable

    const turn8 = g.getState(g.players[0].id)

    // On turn 8, look back at turn 4.
    const maskedGame = Game.fromMaskedGame(turn8)
    expect(maskedGame.turns[4].getState(g.players[0].id)).toEqual(turn4.currentTurn)
  })
})
