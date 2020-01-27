import {SyntaxError} from './errors'

export type TColor = 'A' | 'B' | 'C' | 'D' | 'E' | 'X'
export type TNum = 1 | 2 | 3 | 4 | 5

export interface TPossibleCardState {
  value: TCardState
  weight: number // 0 .. 1, but in practice something like 0.2 .. 0.8
}
export interface TMyHandCardState {
  color?: TColor
  num?: TNum
  hints: THintResultState[]
  possibleCards?: TPossibleCardState[]
  // TODO: (or maybe as getters)
  actionability?: 'PLAYABLE' | 'UNPLAYABLE' | 'DISCARDABLE' | 'UNDISCARDABLE'
}

export interface TCardState {
  color: TColor
  num: TNum
  hints?: THintResultState[]
  possibleCards?: TPossibleCardState[]
}

export type TCardValueState = string

export interface THintState {
  turnNumber: number // allows finding more information from the log
  is: TNum | TColor
}
export interface THintResultState extends THintState {
  result: boolean
}

export const AllColors: TColor[] = ['A', 'B', 'C', 'D', 'E', 'X']
export const AllNums: TNum[] = [1, 2, 3, 4, 5]

export const NumDistribution: TNum[] = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5]

function parseValueString(str: string): TCardState {
  if (/^([ABCDEX])([1-5])$/.test(str)) {
    return {color: RegExp.$1 as TColor, num: +RegExp.$2 as TNum}
  } else {
    throw new SyntaxError('INVALID_VALUE_STRING', str)
  }
}

export class Card {
  color: TColor
  num: TNum
  possibleCards: TPossibleCardState[] = []
  hints: THintResultState[] = []
  constructor(c: TCardState | string) {
    if (typeof c === 'string') {
      const {color, num} = parseValueString(c)
      this.color = color
      this.num = num
    } else {
      this.color = c.color
      this.num = c.num
      this.possibleCards = c.possibleCards || []
      this.hints = c.hints || []
    }
  }
  static fromValueString(str: string) {
    return new this(parseValueString(str))
  }
  static getFullDeck(): Card[] {
    return AllColors.flatMap(color => NumDistribution.map((num: TNum) => new Card({color, num})))
  }
  // toString() {
  //   return this.color && this.num ? this.color + this.num : undefined
  // }
  toJSON(): any {
    return this.color && this.num ? this.color + this.num : undefined
    // return this.toString() // {color: this.color, num: this.num}
  }
  matchesHints(hints: THintResultState[]) {
    return hints.every(h => (h.result ? this.looksLike(h.is) : !this.looksLike(h.is)))
  }
  equals(subject: Card) {
    return this.color === subject.color && this.num === subject.num
  }
  looksLike(subject: Card | TCardState | TColor | TNum): boolean {
    if (typeof subject === 'number') {
      return this.num === subject
    } else if (typeof subject === 'string') {
      return this.color === subject || this.color === 'X'
    } else {
      return this.color === subject.color && this.num === subject.num
    }
  }
  addHint(hint: THintState) {
    this.hints.push({...hint, result: this.color === hint.is || this.num === hint.is})
  }
}
