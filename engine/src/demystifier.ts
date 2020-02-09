import {Card, MaskedCard, TPossibleCardState, PossibleCard, TCardValueState} from './card'
import {sum, range} from 'lodash'

interface CardWithFewSolutions {
  possibleCards: TPossibleCardState[]
  handIdx: number
}

// from https://codereview.stackexchange.com/a/212678
function gcd(arr) {
  // Use spread syntax to get minimum of array
  const lowest = Math.min(...arr)

  for (let factor = lowest; factor > 1; factor--) {
    let isCommonDivisor = true

    for (let j = 0; j < arr.length; j++) {
      if (arr[j] % factor !== 0) {
        isCommonDivisor = false
        break
      }
    }

    if (isCommonDivisor) {
      return factor
    }
  }

  return 1
}

const l = (cards: Card[]) => cards.map(c => c.toString()).join(',')

// NB: modifies myHand entries: adds `possibleCards` and fills out `color` and `num`
// export function demystify(myHand: MaskedCard[], table:Table, otherRevealedCards: Card[]): MaskedCard[] {
export function demystify(myHand: MaskedCard[], revealedCards: Card[]): MaskedCard[] {
  // make a copy to prevent modifying the argument
  myHand = myHand.map(mc => new MaskedCard(mc.toJSON()))

  // console.warn(
  //   'DEMYS',
  //   revealedCards.map(c => c.toString()),
  // )

  // console.warn(
  //   'DEM',
  //   myHand.map(c => c.hints),
  //   revealedCards.length,
  // )
  // const revealedCards:Card[] = [otherRevealedCards, table.]

  const unrevealedCards = Card.getFullDeck()
  for (const r of revealedCards) {
    unrevealedCards.splice(
      unrevealedCards.findIndex(u => u.equals(r)),
      1,
    )
  }

  // // simple sum
  // function normalizeWeights(possibleCards: PossibleCard[]): PossibleCard[] {
  //   const possibleCardsByValue: {[value: string]: PossibleCard} = {}

  //   for (const pc of possibleCards) {
  //     if (possibleCardsByValue[pc.value]) {
  //       possibleCardsByValue[pc.value].weight += pc.weight
  //     } else {
  //       possibleCardsByValue[pc.value] = pc
  //     }
  //   }
  //   return Object.values(possibleCardsByValue).sort((a, b) => a.value.localeCompare(b.value))
  //   // return Object.values(possibleCardsByValue).sort((a, b) => a.color.localeCompare(b.color) || a.num - b.num)
  // }

  function countPossibleCards(possibleValues: TCardValueState[]): PossibleCard[] {
    // console.warn('cPC', possibleValues)

    const possibleCardCounts: {cardValue: TCardValueState; count: number}[] = []
    for (const pc of possibleValues) {
      const pcc = possibleCardCounts.find(c => c.cardValue == pc)
      if (pcc) {
        pcc.count++
      } else {
        possibleCardCounts.push({cardValue: pc, count: 1})
      }
    }

    // NB: in some cases, the guessing algorithm produces multiple identical solutions.
    // This is irrelevant, since we divide by the total number of cards.

    const ret = possibleCardCounts
      .map(pcc => {
        const c = new Card(pcc.cardValue)
        return new PossibleCard({
          value: pcc.cardValue,
          prob: pcc.count / possibleValues.length,
          count: unrevealedCards.filter(u => u.value === pcc.cardValue).length,
        })
      })
      .sort((a, b) => a.value.localeCompare(b.value))
    // console.warn('cPC RET', ...ret)

    return ret
  }

  // console.warn('UNR', unrevealedCards)
  // for (const c of myHand) {
  //   console.warn(c)
  // }

  function addKnownBits(handCard: MaskedCard, possibleCards: PossibleCard[]): boolean {
    let didRevealMore = false
    // console.warn('aKB', possibleCards, handCard)

    for (const k of ['color', 'num']) {
      if (possibleCards.every(c => c[k] === possibleCards[0][k])) {
        if (!handCard[k]) {
          // console.warn('2222', k)

          handCard[k] = possibleCards[0][k]
          didRevealMore = true
          // if the card has now been fully revealed, move it to `revealedCards`.
          if (handCard.color && handCard.num) {
            // console.warn('REVEALED', handCard.color, handCard.num)

            const c = new Card({color: handCard.color, num: handCard.num})
            revealedCards.push(c)
            unrevealedCards.splice(
              unrevealedCards.findIndex(u => u.equals(c)),
              1,
            )
          }
        }
      }
    }

    // show possible cards to the user if:
    // - the card has not been resolved yet AND
    // - there are at most ten possibilities

    // remove old list, if any
    delete handCard.possibleCards

    // console.warn('cPC 0', possibleCards)

    if (!(handCard.color && handCard.num)) {
      // const pc = countPossibleCards(possibleCards)
      // console.warn('cPC 1', pc)
      // if (pc.length && pc.length < 10) handCard.possibleCards = pc
      if (possibleCards.length < 10) handCard.possibleCards = possibleCards
    }

    return didRevealMore
  }

  while (true) {
    // console.warn('LOOKING', {u: unrevealedCards.filter(u => u.num === 2)}, {r: revealedCards.filter(r => r.num === 2)})

    // do another pass if this pass revealed new cards
    let didRevealMore = false

    for (const handCard of myHand) {
      const possibleValues: TCardValueState[] = unrevealedCards
        .filter(u => u.matchesHints(handCard.hints))
        .map(c => c.value)

      // NB: if more than 3*6 possible cards were found, we can't know
      // the color or the number. (There are 3 * 6 cards with num==1).
      if (possibleValues.length <= 3 * 6) {
        // let's see if we can add some definite information to the card
        didRevealMore = addKnownBits(handCard, countPossibleCards(possibleValues)) || didRevealMore
      }
    }
    if (!didRevealMore) break
  }
  // Now we have all the knowledge we can get without guessing candidates and backtracking.

  // When to use the backtracking algorithm?
  // - if more than one card has only n `possibleCards` entries, where n<handCardCount?
  // - safety limit for the max number of entries?
  //    - if hand[0].possibleCards * hand[1].possibleCards * ... < x?

  // Optimization:
  // - start with the cards with the lowest number of `possibleCards` entries?
  // - only try one instance of each value, e.g. the hands starting with C4,C4 should only be tried once
  //   - HOW?

  function guess(myHand: MaskedCard[]): boolean {
    // console.warn(
    //   'GUESS',
    //   myHand.map(c => c.possibleCards),
    // )

    let didRevealMore = false

    // NB! `myHand.length + 4` is based on a wild guess. It might be incorrect for some setups.
    const cardsWithFewSolutions = myHand
      .map((c, handIdx) => ({possibleCards: c.possibleCards, handIdx}))
      .filter(
        c => c.possibleCards && sum(c.possibleCards.map(pc => pc.count)) <= myHand.length + 4,
      ) as CardWithFewSolutions[]
    if (cardsWithFewSolutions.length < 2) {
      // nothing to guess
      return false
    }

    // console.warn('GUESSING...')

    // optimization: arrange the hand so that the cards with fewest possible solutions come first
    cardsWithFewSolutions.sort((a, b) => a.possibleCards.length - b.possibleCards.length)

    // THE ALGORITHM
    // - assume the first card is one of its `possibleCards`
    // - remove it from unrevealedCards
    // - move to next card
    // - assume it is one of its `possibleCards`
    // - remove it from unrevealedCards
    //   - if this fails, backtrack
    // - move to next card
    // => if only one path succeeds (is this possible?), mark the cards solved
    // => if multiple paths succeed, find what information is common to all solutions and mark data
    //   => if new information was found, return true so that we can run the whole demystifyin again.

    const possibleSolutions: Card[][] = []

    const take = (availableCards: Card[], p: Card): {nowAvailableCards: Card[]; taken: Card} => {
      const nowAvailableCards = [...availableCards] // make a copy
      const taken = nowAvailableCards.splice(
        nowAvailableCards.findIndex(u => u.equals(p)),
        1,
      )[0]
      return {nowAvailableCards, taken}
    }

    // // turn possibleCards to a list, repeat those with count>1
    function expandPossibleCards(possibleCards: TPossibleCardState[]): Card[] {
      const ret: Card[] = []
      for (const pc of possibleCards) {
        for (let w = 0; w < pc.count; w++) {
          ret.push(new Card(pc.value))
        }
      }
      return ret
    }

    const guessCard = (idx: number, currentGuess: Card[], availableCards: Card[]) => {
      const c = cardsWithFewSolutions[idx]
      // console.warn('guess', l(currentGuess), 'AVAIL', l(availableCards))

      if (!c) {
        // we have reached a possible solution
        // console.warn('HIT!', l(currentGuess))
        possibleSolutions.push(currentGuess)
        return
      }
      // console.warn('looping', c.possibleCards)

      for (const p of expandPossibleCards(c.possibleCards).filter(p => availableCards.find(u => u.equals(p)))) {
        // console.warn('TAKING', p)
        const {nowAvailableCards, taken} = take(availableCards, Card.fromValueString(p.value))
        guessCard(idx + 1, [...currentGuess, taken], nowAvailableCards)
      }
    }

    // start recursive guesswork
    guessCard(0, [], unrevealedCards)

    // console.warn('pS', possibleSolutions)
    // console.warn(
    //   'GUESS 2',
    //   myHand.map(c => c.possibleCards),
    // )

    for (const idx of range(cardsWithFewSolutions.length)) {
      const handCard = myHand[cardsWithFewSolutions[idx].handIdx]
      // console.warn(111, possibleSolutions)

      const possibleCards = countPossibleCards(possibleSolutions.map(s => s[idx].value))
      // console.warn('cPC 2', handCard, possibleSolutions.length, possibleCards)
      didRevealMore = addKnownBits(handCard, possibleCards) || didRevealMore
    }

    // console.warn(
    //   'GUESS RET',
    //   myHand.map(c => c.possibleCards),
    // )

    return didRevealMore
  }

  // Try guessing the cards.
  // didRevealMore = guess(myHand, unrevealedCards) || didRevealMore
  // if (!didRevealMore) break
  // console.warn('ANOTHER GO...', {revealedCards, unrevealedCards})
  // }

  guess(myHand)

  // for (const hc of myHand) {
  //   if (hc.possibleCards) {

  //     // TMP CHECK
  //     for (const pc of hc.possibleCards) {
  //       if (Math.max(pc.weight, 1) !== unrevealedCards.filter(c => c.value === pc.value).length) {
  //         console.warn('WRONG WEIGHT', pc, unrevealedCards.map(c => c.value).join(','))
  //       }
  //     }
  //   }
  // }

  return myHand
}
