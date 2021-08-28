import {createDeck} from './helpers'
import {Game, GameParams} from '../src/game'

function createTestGame(gameParams?: GameParams) {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Alpha', 'Omega'],
    gameParams: (gameParams || {}) as any,
    deck: createDeck(
      // p0 p1 p0 p1 p0 p1
      `  A3 B2 C3 D4 E5 X3
         B3 C2 D3 E4 X5 A3`,
    ),
  })
  return g
}

describe('Difficulty params', () => {
  it('are sane by default', () => {
    const g = createTestGame()
    expect(g.getState(g.players[0].id).gameParams).toEqual({
      maxHintCount: 8,
      maxWoundCount: 3,
      shufflePlayers: 'SHUFFLE_NONE',
      useRainbow: true,
      useBlack: true,
    })
  })
  it('are modifiable', () => {
    // NB! This test uses NEW_TEST_GAME that runs test specific code for creating the game,
    // thus making this test mostly useless.
    const g = createTestGame({
      maxHintCount: 5,
      maxWoundCount: 1,
      shufflePlayers: 'SHUFFLE_RANDOMIZE',
      useRainbow: true,
      useBlack: false,
    })
    expect(g.getState(g.players[0].id).gameParams).toEqual({
      maxHintCount: 5,
      maxWoundCount: 1,
      shufflePlayers: 'SHUFFLE_RANDOMIZE',
      useRainbow: true,
      useBlack: false,
    })
    expect(g.getState(g.players[0].id).currentTurn.hintCount).toEqual(5)

    // the first wound is lethal
    g.act(g.players[0].id, {type: 'PLAY', cardIdx: 2})
    expect(g.getState(g.players[0].id).currentTurn.status).toEqual('GAMEOVER')
  })
})
