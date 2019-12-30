import {TCardState, THandCardState, Card} from './card'

// NB: modifies myHand entries: adds `possibleCards` and fills out `color` and `num`
export function demystify(myHand: THandCardState[], revealedCards: TCardState[]) {
  const unrevealedCards = Card.getFullDeck()
  for (const r of revealedCards) {
    unrevealedCards.splice(
      unrevealedCards.findIndex(u => u.is(r)),
      1,
    )
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
        for (const k of ['color', 'num']) {
          if (possibleCards.every(c => c[k] === possibleCards[0][k])) {
            if (!handCard[k]) {
              handCard[k] = possibleCards[0][k]
              didRevealMore = true
              // if the card has now been fully revealed, move it to `revealedCards`.
              if (handCard.color && handCard.num) {
                revealedCards.push({color: handCard[k].color, num: handCard[k].num})
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
        if (!(handCard.color && handCard.num) && possibleCards.length <= 10) {
          // aggregate
          const possibleCardCounts: {card: Card; count: number}[] = []
          for (const pc of possibleCards) {
            const pcc = possibleCardCounts.find(c => c.card.is(pc))
            if (pcc) {
              pcc.count++
            } else {
              possibleCardCounts.push({card: pc, count: 1})
            }
          }
          handCard.possibleCards = possibleCardCounts.map(pcc => ({
            color: pcc.card.color,
            num: pcc.card.num,
            weight: pcc.count,
          }))
        }
      }
    }
    if (!didRevealMore) break
    // console.warn('ANOTHER GO...', {revealedCards, unrevealedCards})
  }
  return myHand
}
