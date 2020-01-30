import {SyntaxError} from './errors'

export type TColor = 'A' | 'B' | 'C' | 'D' | 'E' | 'X'
export type TNum = 1 | 2 | 3 | 4 | 5

export interface TPossibleCardState {
  value: TCardValueState
  weight: number // 1..3
}

export interface TCardState {
  color: TColor
  num: TNum
  hints?: THintResultState[]
}

export interface TMaskedCardState {
  color?: TColor
  num?: TNum
  hints?: THintResultState[]
  possibleCards?: TPossibleCardState[]
  // actionability?: 'PLAYABLE' | 'UNPLAYABLE' | 'DISCARDABLE' | 'UNDISCARDABLE'
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

abstract class BaseCard {
  color: TColor
  num: TNum
  hints: THintResultState[] = []

  constructor(c: TCardState | TCardValueState) {
    if (typeof c === 'string') {
      const {color, num} = parseValueString(c)
      this.color = color
      this.num = num
    } else {
      this.color = c.color
      this.num = c.num
      this.hints = c.hints || []
    }
  }
  get value() {
    return this.color + this.num
  }
}
export class Card extends BaseCard {
  static fromValueString(str: string): Card {
    return new Card(parseValueString(str))
  }
  static getFullDeck(): Card[] {
    return AllColors.flatMap(color => NumDistribution.map((num: TNum) => new Card({color, num})))
  }
  toJSON(): TCardValueState {
    return this.color + this.num
  }
  serializeWithHints(): TCardState {
    return {
      color: this.color,
      num: this.num,
      hints: this.hints,
    }
  }
  matchesHints(hints: THintResultState[]) {
    return hints.every(h => (h.result ? this.looksLike(h.is) : !this.looksLike(h.is)))
  }
  equals(subject: Card) {
    return this.color === subject.color && this.num === subject.num
  }
  looksLike(subject: TColor | TNum): boolean {
    if (typeof subject === 'number') {
      return this.num === subject
    } else {
      return this.color === subject || this.color === 'X'
    }
  }
  addHint(hint: THintState) {
    this.hints.push({
      ...hint,
      result: this.color === hint.is || (this.color === 'X' && typeof hint.is === 'string') || this.num === hint.is,
    })
  }
}

export class MaskedCard {
  color?: TColor
  num?: TNum
  possibleCards?: PossibleCard[]
  hints: THintResultState[] = []
  constructor(c: TMaskedCardState) {
    this.color = c.color
    this.num = c.num
    if (c.possibleCards) this.possibleCards = c.possibleCards.map(pc => new PossibleCard(pc))
    this.hints = c.hints || []
  }
  toJSON(): TMaskedCardState {
    return {
      color: this.color,
      num: this.num,
      possibleCards:
        this.possibleCards && this.possibleCards.length ? this.possibleCards.map(pc => pc.toJSON()) : undefined,
      hints: this.hints,
    }
  }
}

export class PossibleCard extends BaseCard {
  weight: number
  constructor(pc: TPossibleCardState) {
    super(pc.value)
    this.weight = pc.weight
  }
  toJSON(): TPossibleCardState {
    return {value: this.value, weight: this.weight}
  }
}
