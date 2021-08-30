import {demystify} from '../src/demystifier'
import {Card, TColor, TNum, TMaskedCardState, MaskedCard} from '../src/card'

const gameParams = {
  maxHintCount: 8,
  maxWoundCount: 3,
  shufflePlayers: 'SHUFFLE_NONE' as any,
  useRainbow: true,
  useBlack: false,
}

interface CreateHint {
  is: TColor | TNum
  result?: boolean // default true
}

interface CreateHandParam {
  color?: TColor
  num?: TNum
  hints?: CreateHint[]
}
function dem(myHand: MaskedCard[], revealedCards: Card[]): TMaskedCardState[] {
  return JSON.parse(JSON.stringify(demystify(myHand, revealedCards, gameParams)[0])) as TMaskedCardState[]
}

function hand(...cards: CreateHandParam[]): MaskedCard[] {
  return cards.map(
    c =>
      new MaskedCard({
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
  const left = Card.getFullDeck(gameParams)

  for (const c of r
    .split(/\s+/)
    .filter(v => /\w/.test(v))
    .map(Card.fromValueString)) {
    left.splice(
      left.findIndex(f => f.equals(c)),
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
    expect(dem(hand({hints: [{is: 3}]}), [])).toEqual([
      {
        num: 3,
        hints: [{is: 3, result: true, turnNumber: 0}],
        possibleCards: [
          {count: 2, prob: 1 / 6, value: 'A3'},
          {count: 2, prob: 1 / 6, value: 'B3'},
          {count: 2, prob: 1 / 6, value: 'C3'},
          {count: 2, prob: 1 / 6, value: 'D3'},
          {count: 2, prob: 1 / 6, value: 'E3'},
          {count: 2, prob: 1 / 6, value: 'X3'},
        ],
      },
    ])
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
          {value: 'C4', prob: 1 / 3, count: 2},
          {value: 'C5', prob: 1 / 6, count: 1},
          {value: 'X4', prob: 1 / 3, count: 2},
          {value: 'X5', prob: 1 / 6, count: 1},
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
          {value: 'D4', prob: 0.5, count: 2},
          {value: 'X4', prob: 0.5, count: 2},
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
          {value: 'D4', prob: 2 / 3, count: 2},
          {value: 'X4', prob: 1 / 3, count: 1},
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
          {value: 'C2', prob: 2 / 3, count: 2},
          {value: 'X2', prob: 1 / 3, count: 1},
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
          {value: 'B2', prob: 0.5, count: 1},
          {value: 'C2', prob: 0.5, count: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', prob: 0.5, count: 1},
          {value: 'C2', prob: 0.5, count: 1},
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
          {value: 'B2', prob: 0.5, count: 1},
          {value: 'C2', prob: 0.5, count: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', prob: 0.5, count: 1},
          {value: 'C2', prob: 0.5, count: 1},
        ],
      },
      {
        num: 3,
        hints: [],
        possibleCards: [
          {value: 'C3', prob: 0.5, count: 1},
          {value: 'D3', prob: 0.5, count: 1},
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
          {value: 'B2', prob: 0.5, count: 1},
          {value: 'C2', prob: 0.5, count: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', prob: 0.5, count: 1},
          {value: 'C2', prob: 0.5, count: 1},
        ],
      },
      {
        hints: [],
        possibleCards: [
          {value: 'C3', prob: 0.5, count: 1},
          {value: 'D4', prob: 0.5, count: 1},
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
          {value: 'B2', prob: 1 / 2, count: 1},
          {value: 'C2', prob: 1 / 2, count: 1},
        ],
      },
      {
        num: 2,
        hints: [{is: 2, result: true, turnNumber: 0}],
        possibleCards: [
          {value: 'B2', prob: 1 / 2, count: 1},
          {value: 'C2', prob: 1 / 2, count: 1},
        ],
      },
      {
        hints: [],
        possibleCards: [
          {value: 'C3', prob: 1 / 3, count: 1},
          {value: 'D4', prob: 2 / 3, count: 2},
        ],
      },
    ])
  })
})

describe('more cases', () => {
  it('a D5/X5 is inferred from shown fives', () => {
    expect(
      dem(
        hand(
          {hints: [{is: 5}, {is: 'E'}, {is: 'D', result: false}]}, // => must be E5
          {hints: [{is: 5, result: false}, {is: 'D'}]},
          {hints: [{is: 5}]}, // => must D5/E5/X5, but E5 is taken => must be D5/X5
        ),
        revealedCards(
          [
            'A1 A1 A1 A2 A2 A3 A3 A4 A4 A5',
            'B1 B1 B1 B2 B2 B3 B3 B4 B4 B5',
            'C1 C1 C1 C2 C2 C3 C3 C4 C4 C5',
            'D1 D1 D1 D2 D2 D3 D3 D4', //    all but D4 D5
            'E1 E1 E1 E2 E2 E3 E3 E4 E4', // all but E5
            'X1 X1 X1 X2 X2 X3 X3 X4', //    all but X5
          ].join(' '),
        ),
      ),
    ).toEqual([
      {
        color: 'E',
        hints: [
          {is: 5, result: true, turnNumber: 0},
          {is: 'E', result: true, turnNumber: 0},
          {is: 'D', result: false, turnNumber: 0},
        ],
        num: 5,
      },
      {
        hints: [
          {is: 5, result: false, turnNumber: 0},
          {is: 'D', result: true, turnNumber: 0},
        ],
        num: 4,
        possibleCards: [
          {value: 'D4', prob: 1 / 2, count: 1},
          {value: 'X4', prob: 1 / 2, count: 1},
        ],
      },
      {
        hints: [{is: 5, result: true, turnNumber: 0}],
        num: 5,
        possibleCards: [
          {value: 'D5', prob: 1 / 2, count: 1},
          {value: 'X5', prob: 1 / 2, count: 1},
        ],
      },
    ])
  })
  it('fractional possibleCards: if only a single A2 is left, but its probability is twice than of an A1, dont show A2 as weight:2', () => {
    expect(
      dem(
        hand(
          {hints: [{is: 3, result: false}, {is: 1}]},
          {hints: [{is: 3, result: false}]},
          {hints: [{is: 3, result: false}]},
        ),
        revealedCards(
          [
            'A1 A1    A2    A3 A3 A4 A4 A5',
            'B1 B1 B1 B2    B3 B3 B4 B4 B5',
            'C1 C1    C2    C3    C4    C5',
            'D1 D1 D1 D2 D2 D3 D3 D4 D4 D5',
            'E1 E1 E1 E2 E2 E3 E3 E4 E4 E5',
            'X1 X1 X1 X2 X2 X3 X3 X4    X5',
          ].join(' '),
        ),
      ),
    ).toEqual([
      {
        hints: jasmine.any(Array),
        num: 1,
        possibleCards: [
          {value: 'A1', prob: 0.5, count: 1},
          {value: 'C1', prob: 0.5, count: 1},
        ],
      },
      {
        hints: jasmine.any(Array),
        possibleCards: [
          {value: 'A1', prob: 1 / 12, count: 1},
          {value: 'A2', prob: 1 / 6, count: 1},
          {value: 'B2', prob: 1 / 6, count: 1},
          {value: 'C1', prob: 1 / 12, count: 1},
          {value: 'C2', prob: 1 / 6, count: 1},
          {value: 'C4', prob: 1 / 6, count: 1},
          {value: 'X4', prob: 1 / 6, count: 1},
        ],
      },
      {
        hints: jasmine.any(Array),
        possibleCards: [
          {value: 'A1', prob: 1 / 12, count: 1},
          {value: 'A2', prob: 1 / 6, count: 1},
          {value: 'B2', prob: 1 / 6, count: 1},
          {value: 'C1', prob: 1 / 12, count: 1},
          {value: 'C2', prob: 1 / 6, count: 1},
          {value: 'C4', prob: 1 / 6, count: 1},
          {value: 'X4', prob: 1 / 6, count: 1},
        ],
      },
    ])
  })
  it('fractional possibleCards: another case', () => {
    expect(
      dem(
        hand(
          {hints: []},
          {hints: []},
          {hints: []},
          // {hints: []}, {hints: []}, {hints: []}
        ),
        revealedCards(
          `
            A1 A1 A1 A2 A2 A3 A3 A4 A4 A5
            B1 B1 B1 B2 B2 B3 B3 B4 B4 B5
            C1 C1 C1 C2 C2 C3 C3 C4 C4 C5
            D1 D1 D1 D2 D2 D3 D3 D4 D4 D5
            E1 E1 E1 E2 E2 E3 E3 E4 E4 E5
                     X2 X2 X3 X3
          `
            .trim()
            .split(/\s+/)
            .join(' '),
        ),
      ),
    ).toEqual([
      // NB: these fractions are unchecked
      {
        color: 'X',
        hints: [],
        possibleCards: [
          {value: 'X1', prob: 35 / 64, count: 3},
          {value: 'X4', prob: 31 / 96, count: 2},
          {value: 'X5', prob: 25 / 192, count: 1},
        ],
      },
      {
        color: 'X',
        hints: [],
        possibleCards: [
          {value: 'X1', prob: 35 / 64, count: 3},
          {value: 'X4', prob: 31 / 96, count: 2},
          {value: 'X5', prob: 25 / 192, count: 1},
        ],
      },
      {
        color: 'X',
        hints: [],
        possibleCards: [
          {value: 'X1', prob: 35 / 64, count: 3},
          {value: 'X4', prob: 31 / 96, count: 2},
          {value: 'X5', prob: 25 / 192, count: 1},
        ],
      },
    ])
  })
})
