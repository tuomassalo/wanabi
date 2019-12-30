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

  for (const handCard of myHand) {
    const possibleCards: Card[] = unrevealedCards.filter(u => u.matchesHints(handCard.hints))

    // NB: if more than 3*6 possible cards were found, we can't know
    // the color or the number.
    if (possibleCards.length <= 3 * 6) {
      // let's see if we can add some definite information to the card
      for (const k of ['color', 'num']) {
        if (possibleCards.every(c => c[k] === possibleCards[0][k])) {
          handCard[k] = possibleCards[0][k]
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
  return myHand
}
