import {TCardState, TColor, AllColors, Card} from './card'
import {Pile} from './pile'

export type TTable = {[key in TColor]: Pile}
export type TTableState = {[key in TColor]: TCardState[]}

export class Table {
  table: TTable

  constructor(table?: TTable) {
    // NB: why does fromEntries need `as`
    this.table = table || (Object.fromEntries(AllColors.map(color => [color, new Pile([])])) as TTable)
  }
  static deserialize(state: TTableState): Table {
    return new Table(
      Object.fromEntries(
        AllColors.map(color => [color, new Pile(state[color].map(c => Card.fromValueString(c)))]),
      ) as TTable,
    )
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
