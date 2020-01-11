import {demystify} from '../src/game/demystifier'
import {Card, TColor, TNum, TMyHandCardState, MyHandCard} from '../src/game/card'

interface CreateHint {
  is: TColor | TNum
  result?: boolean // default true
}

interface CreateHandParam {
  color?: TColor
  num?: TNum
  hints?: CreateHint[]
}
function dem(myHand: MyHandCard[], revealedCards: Card[]): TMyHandCardState[] {
  return JSON.parse(JSON.stringify(demystify(myHand, revealedCards))) as TMyHandCardState[]
}

function hand(...cards: CreateHandParam[]): MyHandCard[] {
  return cards.map(c =>
    MyHandCard.deserialize({
      ...c,
      possibleCards: [],
      hints: (c.hints || []).map(h => ({...h, turnNumber: 0, result: h.result ?? true})),
    }),
  )
}

function revealedCards(r: string): Card[] {
  return r
    .split(/\s+/)
    .filter(v => /\w/.test(v))
    .map(Card.fromValueString)
}

function fullDeckMinus(r: string): Card[] {
  const left = Card.getFullDeck()

  for (const c of r
    .split(/\s+/)
    .filter(v => /\w/.test(v))
    .map(Card.fromValueString)) {
    left.splice(
      left.findIndex(f => f.is(c)),
      1,
    )
  }
  return left
}

describe('with no revealed cards', () => {
  it('first we should have nothing', () => {
    expect(dem(hand({hints: []}), [])).toEqual([{hints: []}])
  })
  it("if we say 3, it's a 3", () => {
    expect(dem(hand({hints: [{is: 3}]}), [])).toEqual([{num: 3, hints: [{is: 3, result: true, turnNumber: 0}]}])
  })
  it('if we say C, still >10 possibilities => no listing', () => {
    expect(dem(hand({hints: [{is: 'C'}]}), [])).toEqual([{hints: [{is: 'C', result: true, turnNumber: 0}]}])
  })
  it("if we say C and not 1..3, it's a C or an X", () => {
    expect(
      dem(hand({hints: [{is: 'C'}, {is: 1, result: false}, {is: 2, result: false}, {is: 3, result: false}]}), []),
    ).toEqual([
      {
        hints: [
          {is: 'C', result: true, turnNumber: 0},
          {result: false, is: 1, turnNumber: 0},
          {result: false, is: 2, turnNumber: 0},
          {result: false, is: 3, turnNumber: 0},
        ],
        possibleCards: [
          {value: 'C4', weight: 2},
          {value: 'C5', weight: 1},
          {value: 'X4', weight: 2},
          {value: 'X5', weight: 1},
        ],
      },
    ])
  })
  it("if we say D and 4, it's a D4 or X4", () => {
    expect(dem(hand({hints: [{is: 'D'}, {is: 4}]}), [])).toEqual([
      {
        num: 4,
        hints: [
          {is: 'D', result: true, turnNumber: 0},
          {is: 4, result: true, turnNumber: 0},
        ],
        possibleCards: [
          {value: 'D4', weight: 1},
          {value: 'X4', weight: 1},
        ],
      },
    ])
  })
  it("if we say D and E and 4, it's an X4", () => {
    expect(dem(hand({hints: [{is: 'D'}, {is: 'E'}, {is: 4}]}), [])).toEqual([
      {
        color: 'X',
        num: 4,
        hints: [
          {is: 'D', result: true, turnNumber: 0},
          {is: 'E', result: true, turnNumber: 0},
          {is: 4, result: true, turnNumber: 0},
        ],
      },
    ])
  })
})

describe('with some revealed cards', () => {
  it('if we say D and 4, and one X4 is revealed, we get a weighted guess', () => {
    expect(dem(hand({hints: [{is: 'D'}, {is: 4}]}), revealedCards('X4'))).toEqual([
      {
        num: 4,
        hints: [
          {is: 'D', result: true, turnNumber: 0},
          {is: 4, result: true, turnNumber: 0},
        ],
        possibleCards: [
          {value: 'D4', weight: 2},
          {value: 'X4', weight: 1},
        ],
      },
    ])
  })
  it('if we say D and 4, and both X4s are revelead, we get a hit', () => {
    expect(dem(hand({hints: [{is: 'D'}, {is: 4}]}), revealedCards('X4 X4'))).toEqual([
      {
        color: 'D',
        num: 4,
        hints: [
          {is: 'D', result: true, turnNumber: 0},
          {is: 4, result: true, turnNumber: 0},
        ],
      },
    ])
  })
})
describe('information inferred from a complete hit', () => {
  // these are found with iteration (`didRevealMore`)
  it('if we identify a B2, we can infer a C2/X2', () => {
    expect(
      dem(
        hand({hints: [{is: 2}, {is: 'C', result: false}]}, {hints: [{is: 2}]}),
        revealedCards('A2 A2 B2 D2 D2 E2 E2 X2'),
      ),
    ).toEqual([
      {
        color: 'B',
        num: 2,
        hints: [
          {is: 2, result: true, turnNumber: 0},
          {is: 'C', result: false, turnNumber: 0},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'C2', weight: 2},
          {value: 'X2', weight: 1},
        ],
      },
    ])
  })
  it('if we identify a B2, we can infer a C2', () => {
    expect(
      dem(
        hand({hints: [{is: 2}, {is: 'C', result: false}]}, {hints: [{is: 2}]}),
        revealedCards('A2 A2 B2 D2 D2 E2 E2 X2 X2'),
      ),
    ).toEqual([
      {
        color: 'B',
        num: 2,
        hints: [
          {is: 2, result: true, turnNumber: 0},
          {is: 'C', result: false, turnNumber: 0},
        ],
      },
      {
        color: 'C',
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
      },
    ])
  })
})

describe('information inferred from a partial hit', () => {
  it('infers C3 from a B2/C2/C3 when we know that two other cards are B2+C2 or C2+B2', () => {
    expect(
      dem(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // no stock left: all the cards are visible except the three in hand
        fullDeckMinus('B2 C2 C3'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        color: 'C',
        num: 3,
        hints: [],
      },
    ])
  })
  it('infers C3/D3 from a B2/C2/C3/D3 when we know that two other cards are B2+C2 or C2+B2', () => {
    expect(
      dem(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // stock only has a C3/D3.
        fullDeckMinus('B2 C2 C3 D3'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        num: 3,
        hints: [],
        possibleCards: [
          {value: 'C3', weight: 1},
          {value: 'D3', weight: 1},
        ],
      },
    ])
  })
  it('infers C3/D4 from a B2/C2/C3/D4 when we know that two other cards are B2+C2 or C2+B2', () => {
    expect(
      dem(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // stock only has a C3/D4.
        fullDeckMinus('B2 C2 C3 D4'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        hints: [],
        possibleCards: [
          {value: 'C3', weight: 1},
          {value: 'D4', weight: 1},
        ],
      },
    ])
  })
  it('infers weighted C3/D4 from a B2/C2/C3/D4 when we know that two other cards are B2+C2 or C2+B2', () => {
    expect(
      dem(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // stock only has two of these: C3 D4 D4
        fullDeckMinus('B2 C2 C3 D4 D4'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', weight: 1},
          {value: 'C2', weight: 1},
        ],
      },
      {
        hints: [],
        possibleCards: [
          {value: 'C3', weight: 1},
          {value: 'D4', weight: 2},
        ],
      },
    ])
  })
})
