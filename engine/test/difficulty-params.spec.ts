import {createDeck} from './helpers'
import {Game} from '../src/game'

function createTestGame() {
  const g = new Game({
    from: 'NEW_TEST_GAME',
    playerNames: ['Alpha', 'Omega'],
    deck: createDeck(
      // p0 p1 p0 p1 p0 p1 (p0 plays and p1 discards)
      `  A1 B1 A1 B1 A2 C1
         A3 A4 A4 B5 D1 X1`,
    ),
  })
  return g
}

describe('Difficulty params', () => {
  it('are returned', () => {
    const g = createTestGame()
    expect(g.getState(g.players[0].id).gameParams).toEqual({
      maxHintCount: 8,
      maxWoundCount: 3,
      shufflePlayers: 'SHUFFLE_NONE',
    })
  })
})
