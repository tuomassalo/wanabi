import {SyntaxError} from './errors'
import {DeckParams} from './game'

export type TColor = 'A' | 'B' | 'C' | 'D' | 'E' | 'X' | 'K'
export type TNum = 1 | 2 | 3 | 4 | 5

export type TActionability = 'PLAYABLE' | 'UNPLAYABLE' | 'DISCARDABLE' | 'UNDISCARDABLE'

export interface TPossibleCardState {
  value: TCardValueState
  prob: number // < 1
  count: number // the number of unreveled cards with this value, that is: 1, 2 or 3
  actionability?: TActionability
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
  actionability?: TActionability
  was?: TCardState // recorded after playing/discarding
}

export type TCardValueState = string

export interface THintState {
  turnNumber: number // allows finding more information from the log
  is: TNum | TColor
}
export interface THintResultState extends THintState {
  result: boolean
}

// export const AllColors: TColor[] = ['A', 'B', 'C', 'D', 'E', 'X']
export const AllNums: TNum[] = [1, 2, 3, 4, 5]

export const NumDistribution: TNum[] = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5]

export function getAllColors({useRainbow, useBlack}: DeckParams): TColor[] {
  return ['A', 'B', 'C', 'D', 'E', ...(useRainbow ? ['X' as TColor] : []), ...(useBlack ? ['K' as TColor] : [])]
}

function parseValueString(str: string): TCardState {
  if (/^([ABCDEXK])([1-5])$/.test(str)) {
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
  static getFullDeck(deckParams: DeckParams): Card[] {
    return getAllColors(deckParams).flatMap(color => NumDistribution.map((num: TNum) => new Card({color, num})))
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
    // console.warn(
    //   'MATCHESHINTS',
    //   hints,
    //   this.value,
    //   hints.every(h => (h.result ? this.looksLike(h.is) : !this.looksLike(h.is))),
    // )
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
  actionability?: TActionability
  hints: THintResultState[] = []
  was?: Card
  constructor(c: TMaskedCardState) {
    this.color = c.color
    this.num = c.num
    this.actionability = c.actionability
    if (c.possibleCards) this.possibleCards = c.possibleCards.map(pc => new PossibleCard(pc))
    if (c.was) this.was = new Card(c.was)
    this.hints = c.hints || []
  }
  get value() {
    return this.color && this.num ? this.color + this.num : undefined
  }
  toJSON(): TMaskedCardState {
    return {
      color: this.color,
      num: this.num,
      actionability: this.actionability,
      possibleCards:
        this.possibleCards && this.possibleCards.length ? this.possibleCards.map(pc => pc.toJSON()) : undefined,
      hints: this.hints,
      was: this.was,
    }
  }
}

export class PossibleCard extends BaseCard {
  prob: number
  count: number
  actionability?: TActionability
  constructor(pc: TPossibleCardState) {
    super(pc.value)
    this.prob = pc.prob
    this.count = pc.count
    this.actionability = pc.actionability
  }
  toJSON(): TPossibleCardState {
    return {value: this.value, prob: this.prob, count: this.count, actionability: this.actionability}
  }
}
