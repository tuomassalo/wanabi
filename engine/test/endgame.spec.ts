import {createTightGame} from './helpers'
import {Game} from '../src/game'

const gameParams = {
  maxHintCount: 8,
  maxWoundCount: 3,
  shufflePlayers: 'SHUFFLE_NONE' as any,
  useRainbow: true,
  useBlack: false,
}

describe('A failed game', () => {
  const g = createTightGame(gameParams)
  it('changes to GAMEOVER state', () => {
    // p0 always discards the oldest card from hand, p1 always plays (gets a wound)
    for (let i = 1; i <= 3; i++) {
      // to allow DISCARD
      g.act(g.players[0].id, {type: 'HINT', is: 1, toPlayerIdx: 1})
      g.act(g.players[1].id, {type: 'HINT', is: 1, toPlayerIdx: 0})

      g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0})
      g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0})
      expect(g.COMPAT_getMaskedTurnState(g.players[1].id).woundCount).toEqual(i)
    }

    // now GAMEOVER
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).status).toEqual('GAMEOVER')
  })
})
