import {TCardValueState, TColor, getAllColors, Card, AllNums} from './card'
import {GameParams} from './game'
import {Pile} from './pile'

export type TTable = {[key in TColor]: Pile}
export type TTableState = {[key in TColor]: TCardValueState[]}

export type PlayResult = 'SUCCESS_CLOSED' | 'SUCCESS_PENDING' | 'FAILURE'

export class Table {
  table: TTable
  gameParams: GameParams

  constructor(table: TTableState | undefined, gameParams: GameParams) {
    this.gameParams = gameParams
    // NB: why does fromEntries need `as`
    // FIXME: black
    this.table = Object.fromEntries(
      getAllColors(gameParams).map(color => [color, new Pile(table ? table[color] : [])]),
    ) as TTable
  }
  getScore(): number {
    return Object.values(this.table)
      .map(p => p.cards)
      .flat().length
  }
  toJSON(): TTableState {
    // NB: why does fromEntries need `as`
    return Object.fromEntries(Object.entries(this.table).map(([c, pile]) => [c, pile.toJSON()])) as TTableState
  }
  getCards(): Card[] {
    return Object.values(this.table)
      .map(p => p.cards)
      .flat()
  }
  has(card: Card) {
    return this.table[card.color].size >= card.num
  }
  // returns whether the card could be successfully played
  isPlayable(card: Card) {
    return this.table[card.color].size === card.num - 1
  }
  // returns new pile size if the card was successfully played,
  // and false if not
  play(card: Card): PlayResult {
    const colorPile = this.table[card.color]
    // FIXME fix the if to support black cards
    if (colorPile.size === card.num - 1) {
      colorPile.add(card)
      return colorPile.size === AllNums.length ? 'SUCCESS_CLOSED' : 'SUCCESS_PENDING'
    } else {
      return 'FAILURE'
    }
  }
}
