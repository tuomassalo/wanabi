import {SyntaxError} from './errors'

export type TColor = 'A' | 'B' | 'C' | 'D' | 'E' | 'X'
export type TNum = 1 | 2 | 3 | 4 | 5
export interface TCardState {
  color: TColor
  num: TNum
}
export interface THandCardState {
  color?: TColor
  num?: TNum
  hints: THintResultState[]
  // isKnown: boolean
  // isPlayable: boolean
  // isDiscardable: boolean
}
export interface THintState {
  turn: number // allows finding more information from the log
  is: TNum | TColor
}
export interface THintResultState extends THintState {
  result: boolean
}

export const AllColors: TColor[] = ['A', 'B', 'C', 'D', 'E', 'X']
export const AllNums: TNum[] = [1, 2, 3, 4, 5]

export const NumDistribution: TNum[] = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5]

export class Card {
  color: TColor
  num: TNum
  constructor(color: TColor, num: TNum) {
    this.color = color
    this.num = num
  }
  static fromValueString(string) {
    if (/^([ABCDEX])([1-5])$/.test(string)) {
      return new Card(RegExp.$1 as TColor, +RegExp.$2 as TNum)
    } else {
      throw new SyntaxError('INVALID_VALUE_STRING', string)
    }
  }
  toString() {
    return this.color + this.num
  }
  getState(): TCardState {
    return {color: this.color, num: this.num}
  }
  static getFullDeck(): Card[] {
    return AllColors.flatMap(c => NumDistribution.map((n: TNum) => new Card(c, n)))
  }
}

export class HandCard extends Card {
  hints: THintResultState[] = []
  static fromCard(c: Card) {
    return new HandCard(c.color, c.num)
  }
  // hints: Hint[]
  getMePlayerState(): THandCardState {
    return {hints: this.hints}
  }
  getOtherPlayerState(): THandCardState {
    return {color: this.color, num: this.num, hints: this.hints}
  }
  toString() {
    return this.color + this.num
  }
  toCard() {
    return new Card(this.color, this.num)
  }
  addHint(hint: THintState) {
    this.hints.push({...hint, result: this.color === hint.is || this.num === hint.is})
  }
}
