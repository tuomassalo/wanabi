type TColor = 'A' | 'B' | 'C' | 'D' | 'E' | 'X'
export type TNum = 1 | 2 | 3 | 4 | 5
export type TCardState = string // e.g. 'B3'
export interface THandCardState {
  color?: TColor
  num?: TNum
  // hints: THintState[]
  // isKnown: boolean
  // isPlayable: boolean
  // isDiscardable: boolean
}

export const AllColors: TColor[] = ['A', 'B', 'C', 'D', 'E', 'X']

export const NumDistribution: TNum[] = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5]

export class Card {
  color: TColor
  num: TNum
  constructor(color: TColor, num: TNum) {
    this.color = color
    this.num = num
  }
  getState(): TCardState {
    return this.color + this.num
  }
}

export class HandCard extends Card {
  static fromCard(c: Card) {
    return new HandCard(c.color, c.num)
  }
  // hints: Hint[]
  getMePlayerState(): THandCardState {
    return {}
  }
  getOtherPlayerState(): THandCardState {
    return {color: this.color, num: this.num}
  }
}
