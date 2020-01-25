import {SyntaxError} from './errors'

export type TColor = 'A' | 'B' | 'C' | 'D' | 'E' | 'X'
export type TNum = 1 | 2 | 3 | 4 | 5
export type TCardState = string // e.g. 'C2'

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
  // isKnown: boolean
  // isPlayable: boolean
  // isDiscardable: boolean
}

// Same, but we always know the card
export interface THandCardState extends TMyHandCardState {
  color: TColor
  num: TNum
  hints: THintResultState[]
  possibleCards?: TPossibleCardState[]
}

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

function parseValueString(str: string): [TColor, TNum] {
  if (/^([ABCDEX])([1-5])$/.test(str)) {
    return [RegExp.$1 as TColor, +RegExp.$2 as TNum]
  } else {
    throw new SyntaxError('INVALID_VALUE_STRING', str)
  }
}

export class Card {
  color: TColor
  num: TNum
  constructor(color: TColor, num: TNum) {
    this.color = color
    this.num = num
  }
  static fromValueString(str: string) {
    return new Card(...parseValueString(str))
  }
  toString() {
    return this.color + this.num
  }
  toJSON(): any {
    return this.toString() // {color: this.color, num: this.num}
  }
  static getFullDeck(): Card[] {
    return AllColors.flatMap(c => NumDistribution.map((n: TNum) => new Card(c, n)))
  }
  matchesHints(hints: THintResultState[]) {
    return hints.every(h => (h.result ? this.is(h.is) : !this.is(h.is)))
  }
  is(subject: Card | TCardState | TColor | TNum): boolean {
    if (typeof subject === 'number') {
      return this.num === subject
    } else if (typeof subject === 'string') {
      return this.color === subject || this.color === 'X'
    } else {
      return this.color === subject.color && this.num === subject.num
    }
  }
}

export class PossibleCard extends Card {
  weight: number
  constructor(pc: TPossibleCardState) {
    super(...parseValueString(pc.value))
    this.weight = pc.weight
  }
  static deserialize(pc: TPossibleCardState) {
    return new this(pc)
  }
  toJSON(): any {
    return {value: this.color + this.num, weight: this.weight}
  }
}

export class MyHandCard {
  hints: THintResultState[] = []
  possibleCards?: PossibleCard[]
  color?: TColor
  num?: TNum
  // static fromHandCard(hc: HandCard) {

  // }
  constructor(hc: HandCard | TMyHandCardState) {
    if (hc instanceof HandCard) {
      this.hints = hc.hints
    } else {
      this.hints = hc.hints
      this.possibleCards = hc.possibleCards ? hc.possibleCards.map(pc => PossibleCard.deserialize(pc)) : undefined
      this.color = hc.color
      this.num = hc.num
    }
  }
  static deserialize(mhcs: TMyHandCardState) {
    return new this(mhcs)
  }
  toJSON(): any {
    return {
      color: this.color,
      num: this.num,
      possibleCards: this.possibleCards?.length ? this.possibleCards : undefined,
      hints: this.hints,
    }
  }
}

export class HandCard extends MyHandCard {
  hints: THintResultState[] = []
  color: TColor // not optional
  num: TNum // not optional

  constructor(hc: THandCardState) {
    super(hc as TMyHandCardState)
    this.color = hc.color //redundant, but to make TS happy.
    this.num = hc.num // redundant, but to make TS happy.
    this.possibleCards = hc.possibleCards ? hc.possibleCards.map(pc => new PossibleCard(pc)) : undefined
    this.hints = hc.hints
  }

  static deserialize(hcs: THandCardState) {
    return new this(hcs)
  }

  static fromCard(c: Card) {
    return new HandCard({color: c.color, num: c.num, hints: []})
  }
  toCard() {
    return new Card(this.color, this.num)
  }
  addHint(hint: THintState) {
    this.hints.push({...hint, result: this.color === hint.is || this.num === hint.is})
  }
  // deserialize(state: THandCardState) {

  // }
}
