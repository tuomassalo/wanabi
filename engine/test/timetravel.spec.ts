import {createTightGame} from './helpers'
import {Game} from '../src/game'

describe('A game', () => {
  const g = createTightGame()
  it('should be rewindable to turn 4', () => {
    // p0 always plays the oldest card from hand, p1 always discards

    const turn0 = g.getState(g.players[0].id)
    expect(turn0.currentTurn.stockSize).toEqual(50)

    // First, make some moves
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 3})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0}) // not playable

    const turn4 = JSON.parse(JSON.stringify(g.getState(g.players[0].id)))

    // Some more actions
    g.act(g.players[0].id, {type: 'HINT', toPlayerIdx: 1, is: 'A'})
    g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0}) // ok
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 3}) // not playable

    // On turn 8, look back at turn 4.
    expect(g.turns[4].getState(g.players[0].id)).toEqual(turn4.currentTurn)
  })
})
