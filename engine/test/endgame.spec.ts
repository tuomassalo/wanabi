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
  it('changes to GAMEOVER state', () => {
    const g = createTightGame(gameParams)
    // p0 always discards the oldest card from hand, p1 always plays (gets a wound)
    for (let i = 1; i <= 3; i++) {
      // to allow DISCARD
      g.act(g.players[0].id, {type: 'HINT', is: 1, toPlayerIdx: 1})
      g.act(g.players[1].id, {type: 'HINT', is: 1, toPlayerIdx: 0})

      g.act(g.players[0].id, {type: 'DISCARD', cardIdx: 0})
      g.act(g.players[1].id, {type: 'PLAY', cardIdx: 0}) // make a wound
      expect(g.COMPAT_getMaskedTurnState(g.players[1].id).woundCount).toEqual(i)
    }

    // now GAMEOVER
    expect(g.COMPAT_getMaskedTurnState(g.players[1].id).status).toEqual('GAMEOVER')
  })
  it('GAMEOVER also happens if wound limit is exceeded on the last turn', () => {
    const g = createTightGame(gameParams)
    // p0 always discards the oldest card from hand, p1 always plays (gets a wound)
    while (g.currentTurn.stock.size > 2) {
      // to allow DISCARD
      g.act(g.players[0].id, {type: 'HINT', is: 1, toPlayerIdx: 1})
      g.act(g.players[1].id, {type: 'DISCARD', cardIdx: 0})
    }

    // make two wounds
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 3})
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 3})

    // // NB: the stock is now exhausted, and we have two wounds
    expect(g.currentTurn.stock.size).toEqual(0)
    expect(g.currentTurn.woundCount).toEqual(2)

    g.act(g.players[0].id, {type: 'HINT', is: 1, toPlayerIdx: 1})
    expect(g.currentTurn.status).toEqual('RUNNING')
    g.act(g.players[1].id, {type: 'PLAY', cardIdx: 2}) // third wound on the last possible move
    expect(g.currentTurn.status).toEqual('GAMEOVER')
    expect(g.currentTurn.woundCount).toEqual(3)
  })
})
