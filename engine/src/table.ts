import {TCardValueState, TColor, AllColors, Card} from './card'
import {Pile} from './pile'

export type TTable = {[key in TColor]: Pile}
export type TTableState = {[key in TColor]: TCardValueState[]}

export class Table {
  table: TTable

  constructor(table?: TTableState) {
    // NB: why does fromEntries need `as`
    this.table = Object.fromEntries(AllColors.map(color => [color, new Pile(table ? table[color] : [])])) as TTable
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
  // returns whether the card was successfully played
  play(card: Card): boolean {
    const colorPile = this.table[card.color]
    if (colorPile.size === card.num - 1) {
      colorPile.add(card)
      return true
    } else {
      return false
    }
  }
}
