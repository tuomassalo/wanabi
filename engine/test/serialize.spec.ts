import {createTightGame} from './helpers'
import {Game} from '../src/game'

describe('A game', () => {
  const g = createTightGame()
  it('should maintain its state after serialization and deserialization', () => {
    // p0 always plays the oldest card from hand, p1 always discards

    expect(1).toEqual(1)
    for (let i = 1; i <= 24; i++) {
      g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
      g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    }
    const state1 = g.getState(g.players[1].id)

    const serialized = JSON.stringify(g)

    expect(serialized.length).toBeLessThan(70000)

    const g2 = new Game({...JSON.parse(serialized), from: 'SERIALIZED_TURNS'})

    expect(g2.getState(g.players[1].id)).toEqual(state1)

    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})
    g2.act(g.players[0].id, {type: 'PLAY', cardIdx: 0})

    // both games should be in the same state
    // ... ignoring the timestamp
    const states = [g.getState(g.players[1].id), g2.getState(g2.players[1].id)].map(s => ({...s, timestamp: 'BOGUS'}))

    expect(states[0]).toEqual(states[1])
  })
})