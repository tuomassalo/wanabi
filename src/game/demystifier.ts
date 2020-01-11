import {Card, MyHandCard, PossibleCard, HandCard} from './card'
import {sum, range} from 'lodash'

interface CardWithFewSolutions {
  possibleCards: PossibleCard[]
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

function countPossibleCards(possibleCards: Card[]): PossibleCard[] {
  // console.warn('cPC', possibleCards.length)

  const possibleCardCounts: {card: Card; count: number}[] = []
  for (const pc of possibleCards) {
    const pcc = possibleCardCounts.find(c => c.card.is(pc))
    if (pcc) {
      pcc.count++
    } else {
      possibleCardCounts.push({card: pc, count: 1})
    }
  }

  // In some cases, the guessing algorithm produces multiple identical solutions.
  const divideBy = gcd(possibleCardCounts.map(pcc => pcc.count))

  const ret = possibleCardCounts
    .map(pcc => ({
      color: pcc.card.color,
      num: pcc.card.num,
      weight: pcc.count / divideBy,
    }))
    .sort((a, b) => a.color.localeCompare(b.color) || a.num - b.num)

  return ret.map(pc => new PossibleCard(pc.color, pc.num, pc.weight))
}

// NB: modifies myHand entries: adds `possibleCards` and fills out `color` and `num`
export function demystify(myHand: MyHandCard[], revealedCards: Card[]): MyHandCard[] {
  // console.warn(
  //   'DEM',
  //   myHand.map(c => c.hints),
  //   revealedCards.length,
  // )

  const unrevealedCards = Card.getFullDeck()
  for (const r of revealedCards) {
    unrevealedCards.splice(
      unrevealedCards.findIndex(u => u.is(r)),
      1,
    )
  }

  // console.warn('DEMY', unrevealedCards)
  // for (const c of myHand) {
  //   console.warn(c)
  // }

  function addKnownBits(handCard: MyHandCard, possibleCards: Card[]): boolean {
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
            revealedCards.push(new Card(handCard[k].color, handCard[k].num))
            unrevealedCards.splice(
              unrevealedCards.findIndex(u => u.is(handCard[k])),
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

    if (!(handCard.color && handCard.num) && possibleCards.length <= 10) {
      // aggregate
      // console.warn('cPC 1', possibleCards)

      handCard.possibleCards = countPossibleCards(possibleCards)
    }

    return didRevealMore
  }

  while (true) {
    // console.warn('LOOKING', {u: unrevealedCards.filter(u => u.num === 2)}, {r: revealedCards.filter(r => r.num === 2)})

    // do another pass if this pass revealed new cards
    let didRevealMore = false

    for (const handCard of myHand) {
      const possibleCards: Card[] = unrevealedCards.filter(u => u.matchesHints(handCard.hints))

      // NB: if more than 3*6 possible cards were found, we can't know
      // the color or the number.
      if (possibleCards.length <= 3 * 6) {
        // let's see if we can add some definite information to the card
        didRevealMore = addKnownBits(handCard, possibleCards) || didRevealMore
      }
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

    function guess(myHand: MyHandCard[], unrevealedCards: Card[]): boolean {
      let didRevealMore = false

      // NB! `myHand.length + 4` is based on a wild guess. It might be incorrect for some setups.
      const cardsWithFewSolutions = myHand
        .map((c, handIdx) => ({possibleCards: c.possibleCards, handIdx}))
        .filter(
          c => c.possibleCards && sum(c.possibleCards.map(pc => pc.weight)) <= myHand.length + 4,
        ) as CardWithFewSolutions[]
      if (cardsWithFewSolutions.length < 2) {
        // nothing to guess
        return false
      }

      // console.warn('GUESSING...')

      // arrange the hand so that the cards with fewest possible solutions come first
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
          nowAvailableCards.findIndex(u => u.is(p)),
          1,
        )[0]
        return {nowAvailableCards, taken}
      }

      // turn possibleCards to a list, repeat those with weight>1
      function expandPossibleCards(possibleCards: PossibleCard[]): Card[] {
        const ret: Card[] = []
        for (const pc of possibleCards) {
          for (let w = 0; w < pc.weight; w++) {
            ret.push(new Card(pc.color, pc.num))
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

        for (const p of expandPossibleCards(c.possibleCards).filter((p: Card) => availableCards.find(u => u.is(p)))) {
          // console.warn('TAKING', p)
          const {nowAvailableCards, taken} = take(availableCards, p)
          guessCard(idx + 1, [...currentGuess, taken], nowAvailableCards)
        }
      }

      // start recursive guesswork
      guessCard(0, [], unrevealedCards)

      // console.warn('pS', possibleSolutions)

      for (const idx of range(cardsWithFewSolutions.length)) {
        const handCard = myHand[cardsWithFewSolutions[idx].handIdx]
        // console.warn('cPC 2', possibleSolutions.length)

        const possibleCards = countPossibleCards(possibleSolutions.map(s => s[idx]))
        didRevealMore = addKnownBits(handCard, expandPossibleCards(possibleCards)) || didRevealMore
      }

      // TODO
      return didRevealMore
    }

    // Try guessing the cards.
    didRevealMore = guess(myHand, unrevealedCards) || didRevealMore
    if (!didRevealMore) break
    // console.warn('ANOTHER GO...', {revealedCards, unrevealedCards})
  }

  // console.warn('RET', myHand)

  return myHand
}
