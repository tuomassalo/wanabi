import {createTightGame} from './helpers'
import {Game} from '../src/game'

describe('A failed game', () => {
  const g = createTightGame()
  it('changes to GAMEOVER state', () => {
    // p0 always discards the oldest card from hand, p1 always plays (gets a wound)
    for (let i = 1; i <= 3; i++) {
      g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0})
      g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0})
      expect(g.getTurnState(g.players[1].id).woundCount).toEqual(i)
    }

    // now GAMEOVER
    expect(g.getTurnState(g.players[1].id).status).toEqual('GAMEOVER')
  })
})
