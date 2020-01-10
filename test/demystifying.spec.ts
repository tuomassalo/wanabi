import {THintResultState, Card, TColor, TNum, THandCardState} from '../src/game/card'
import {demystify} from '../src/game/demystifier'

interface CreateHint {
  is: TColor | TNum
  result?: boolean // default true
}

interface CreateHandParam {
  color?: TColor
  num?: TNum
  hints?: CreateHint[]
}

function hand(...cards: CreateHandParam[]): THandCardState[] {
  return cards.map(c => ({
    ...c,
    hints: (c.hints || []).map(h => ({result: true, ...h, turn: 0})),
  }))
}

function revealedCards(r: string) {
  return r
    .split(/\s+/)
    .filter(v => /\w/.test(v))
    .map(Card.fromValueString)
    .map(c => c.getState())
}

function fullDeckMinus(r: string) {
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
  return left.map(c => c.getState())
}

describe('with no revealed cards', () => {
  it('first we should have nothing', () => {
    expect(demystify([{hints: []}], [])).toEqual([{hints: []}])
  })
  it("if we say 3, it's a 3", () => {
    expect(demystify(hand({hints: [{is: 3}]}), [])).toEqual([{num: 3, hints: [{is: 3, result: true, turn: 0}]}])
  })
  it('if we say C, still >10 possibilities => no listing', () => {
    expect(demystify(hand({hints: [{is: 'C'}]}), [])).toEqual([{hints: [{is: 'C', result: true, turn: 0}]}])
  })
  it("if we say C and not 1..3, it's a C or an X", () => {
    expect(
      demystify(hand({hints: [{is: 'C'}, {is: 1, result: false}, {is: 2, result: false}, {is: 3, result: false}]}), []),
    ).toEqual([
      {
        hints: [
          {is: 'C', result: true, turn: 0},
          {result: false, is: 1, turn: 0},
          {result: false, is: 2, turn: 0},
          {result: false, is: 3, turn: 0},
        ],
        possibleCards: [
          {color: 'C', num: 4, weight: 2},
          {color: 'C', num: 5, weight: 1},
          {color: 'X', num: 4, weight: 2},
          {color: 'X', num: 5, weight: 1},
        ],
      },
    ])
  })
  it("if we say D and 4, it's a D4 or X4", () => {
    expect(demystify(hand({hints: [{is: 'D'}, {is: 4}]}), [])).toEqual([
      {
        num: 4,
        hints: [
          {is: 'D', result: true, turn: 0},
          {is: 4, result: true, turn: 0},
        ],
        possibleCards: [
          {color: 'D', num: 4, weight: 1},
          {color: 'X', num: 4, weight: 1},
        ],
      },
    ])
  })
  it("if we say D and E and 4, it's an X4", () => {
    expect(demystify(hand({hints: [{is: 'D'}, {is: 'E'}, {is: 4}]}), [])).toEqual([
      {
        color: 'X',
        num: 4,
        hints: [
          {is: 'D', result: true, turn: 0},
          {is: 'E', result: true, turn: 0},
          {is: 4, result: true, turn: 0},
        ],
      },
    ])
  })
})

describe('with some revealed cards', () => {
  it('if we say D and 4, and one X4 is revealed, we get a weighted guess', () => {
    expect(demystify(hand({hints: [{is: 'D'}, {is: 4}]}), revealedCards('X4'))).toEqual([
      {
        num: 4,
        hints: [
          {is: 'D', result: true, turn: 0},
          {is: 4, result: true, turn: 0},
        ],
        possibleCards: [
          {color: 'D', num: 4, weight: 2},
          {color: 'X', num: 4, weight: 1},
        ],
      },
    ])
  })
  it('if we say D and 4, and both X4s are revelead, we get a hit', () => {
    expect(demystify(hand({hints: [{is: 'D'}, {is: 4}]}), revealedCards('X4 X4'))).toEqual([
      {
        color: 'D',
        num: 4,
        hints: [
          {is: 'D', result: true, turn: 0},
          {is: 4, result: true, turn: 0},
        ],
      },
    ])
  })
})
describe('information inferred from a complete hit', () => {
  // these are found with iteration (`didRevealMore`)
  it('if we identify a B2, we can infer a C2/X2', () => {
    expect(
      demystify(
        hand({hints: [{is: 2}, {is: 'C', result: false}]}, {hints: [{is: 2}]}),
        revealedCards('A2 A2 B2 D2 D2 E2 E2 X2'),
      ),
    ).toEqual([
      {
        color: 'B',
        num: 2,
        hints: [
          {is: 2, result: true, turn: 0},
          {is: 'C', result: false, turn: 0},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'C', num: 2, weight: 2},
          {color: 'X', num: 2, weight: 1},
        ],
      },
    ])
  })
  it('if we identify a B2, we can infer a C2', () => {
    expect(
      demystify(
        hand({hints: [{is: 2}, {is: 'C', result: false}]}, {hints: [{is: 2}]}),
        revealedCards('A2 A2 B2 D2 D2 E2 E2 X2 X2'),
      ),
    ).toEqual([
      {
        color: 'B',
        num: 2,
        hints: [
          {is: 2, result: true, turn: 0},
          {is: 'C', result: false, turn: 0},
        ],
      },
      {
        color: 'C',
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
      },
    ])
  })
})

describe('information inferred from a partial hit', () => {
  it('infers C3 from a B2/C2/C3 when we know that two other cards are B2+C2 or C2+B2', () => {
    expect(
      demystify(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // no stock left: all the cards are visible except the three in hand
        fullDeckMinus('B2 C2 C3'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
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
      demystify(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // stock only has a C3/D3.
        fullDeckMinus('B2 C2 C3 D3'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
        ],
      },
      {
        num: 3,
        hints: [],
        possibleCards: [
          {color: 'C', num: 3, weight: 1},
          {color: 'D', num: 3, weight: 1},
        ],
      },
    ])
  })
  it('infers C3/D4 from a B2/C2/C3/D4 when we know that two other cards are B2+C2 or C2+B2', () => {
    expect(
      demystify(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // stock only has a C3/D4.
        fullDeckMinus('B2 C2 C3 D4'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
        ],
      },
      {
        hints: [],
        possibleCards: [
          {color: 'C', num: 3, weight: 1},
          {color: 'D', num: 4, weight: 1},
        ],
      },
    ])
  })
  it('infers weighted C3/D4 from a B2/C2/C3/D4 when we know that two other cards are B2+C2 or C2+B2', () => {
    expect(
      demystify(
        hand({hints: [{is: 2}]}, {hints: [{is: 2}]}, {hints: []}),
        // stock only has two of these: C3 D4 D4
        fullDeckMinus('B2 C2 C3 D4 D4'),
      ),
    ).toEqual([
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turn: 0}],
        possibleCards: [
          {color: 'B', num: 2, weight: 1},
          {color: 'C', num: 2, weight: 1},
        ],
      },
      {
        hints: [],
        possibleCards: [
          {color: 'C', num: 3, weight: 1},
          {color: 'D', num: 4, weight: 2},
        ],
      },
    ])
  })
})
